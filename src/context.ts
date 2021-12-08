import { 
	Request, 
	Response, 
	NextFunction, 
	RequestHandler, 
} from 'express';
import { ResolveKey, Tiny } from '@denwa/tiny';
import { ClassType, ContextKey, TinyKey } from './types';
import { getModelMetadata } from './model';

export interface Context {
	request: Request;
	response: Response;
	next: NextFunction;
	model<T>(type: ClassType<T>): T;
	resolve<T>(key: ResolveKey<T>): T;
}

export function getData(request: Request, key: string): any {
	let data: Map<string, any> = (request as any).data;
	if(!data) {
		data = new Map<string, any>();
		(request as any).data = data;
	}

	return data.get(key);
}

export function setData(request: Request, key: string, value: any): void {
	let data: Map<string, any> = (request as any).data;
	if(!data) {
		data = new Map<string, any>();
		(request as any).data = data;
	}

	data.set(key, value);	
}

export function deleteData(request: Request, key: string): void {
	let data: Map<string, any> = (request as any).data;
	if(!data) {
		return;
	}

	data.delete(key);
}

export function setContext(tiny?: Tiny): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		if(!tiny) {
			tiny = request.app.get(TinyKey);
			if(!tiny) {
				throw new Error(`unable to get key=${tiny} from request.app.get()`);
			}
		}

		const context: Context = new ContextImpl(request, response, next, tiny);
		setData(request, ContextKey, context);
		
		next();
	}
}

export class ContextImpl implements Context {
	request: Request;
	response: Response;
	next: NextFunction;
	tiny: Tiny;

	constructor(request: Request, response: Response, next: NextFunction, tiny: Tiny) {
		this.request = request;
		this.response = response;
		this.next = next;
		this.tiny = tiny;
	}

	model<T>(type: ClassType<T>): T {
		let model: T = getData(this.request, 'model');
		if(model)  {
			return model;
		}

		model = new type();
		const metadata = getModelMetadata(type);

		for(const key of metadata.fields.keys()) {
			const field = metadata.fields.get(key);
			if(!field) {
				continue;
			}

			const fieldKey =  field.key ?? key;
			const from = field.from;

			if(from) {
				(model as any)[key] = this.request[from][fieldKey];
			}
			else {
				if(key in this.request.query) {
					(model as any)[key] = this.request.query[fieldKey];
				}
				else if(key in this.request.params) {
					(model as any)[key] = this.request.params[fieldKey];
				}
				else if(key in this.request.body) {
					(model as any)[key] = this.request.body[fieldKey];
				}
			}
		}

		setData(this.request, 'model', model);
		return model;
	}

	resolve<T>(key: ResolveKey<T>): T {
		return this.tiny.resolve(key);
	}
}