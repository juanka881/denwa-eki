import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ResolveKey, Tiny } from '@denwa/tiny';
import { ClassType } from '../utils/reflection';
import { bindModel } from '../binding/binding';

/**
 * context data context instance key
 */
export const ContextKey = 'eki:context';

/**
 * context data model instance key
 */
export const ModelKey = 'eki:model';

/**
 * request context
 */
export interface Context {
	/**
	 * express request object
	 */
	request: Request;

	/**
	 * express response object
	 */
	response: Response;
	
	/**
	 * express next callback
	 */
	next: NextFunction;

	/**
	 * helper function to read model from request, 
	 * using the given class type
	 * @param type class type
	 */
	bindModel<T>(type: ClassType<T>): T;

	/**
	 * helper function to resolve a value from the container
	 * @param key resolve key
	 */
	resolve<T>(key: ResolveKey<T>): T;
}

/**
 * get a data value from the request context
 * @param request express request object
 * @param key data key
 * @returns data value or undefined if not set
 */
export function getData(request: Request, key: string): any {
	let data: Map<string, any> = (request as any).data;
	if(!data) {
		data = new Map<string, any>();
		(request as any).data = data;
	}

	return data.get(key);
}

/**
 * set a data value in the request context
 * @param request express request object
 * @param key data key
 * @param value data value
 */
export function setData(request: Request, key: string, value: any): void {
	let data: Map<string, any> = (request as any).data;
	if(!data) {
		data = new Map<string, any>();
		(request as any).data = data;
	}

	data.set(key, value);	
}

/**
 * removes the data value from the request context
 * @param request express request object
 * @param key data key
 * @returns void
 */
export function deleteData(request: Request, key: string): void {
	let data: Map<string, any> = (request as any).data;
	if(!data) {
		return;
	}

	data.delete(key);
}

/**
 * gets the context instance from the request
 * or throws if not found
 * @param request 
 */
export function getContext(request: Request): Context {
	const context = getData(request, ContextKey);
	if(!context) {
		throw new Error(`unable to context from request.data, key=${ContextKey}`);
	}

	return context;
}

/**
 * context instance
 */
export class ContextInstance implements Context {
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

	bindModel<T>(target: ClassType<T>): T {
		let model: T = getData(this.request, ModelKey);
		if(model)  {
			return model;
		}

		model = new target();
		bindModel(target, this.request);
		setData(this.request, ModelKey, model);
		
		return model;
	}

	resolve<T>(key: ResolveKey<T>): T {
		return this.tiny.resolve(key);
	}
}