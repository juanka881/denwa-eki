import { Request, Response, NextFunction, RequestHandler, IRouter } from 'express';
import * as yup from 'yup';
import 'reflect-metadata';
import { 
	ClassType, 
	Context, 
	ControllerActionListMetadataKey, 
	ControllerActionMetadata, 
	ControllerActionMetadataKey, 
	ControllerConfig, 
	ControllerMetadata, 
	ControllerMetadataKey, 
	HttpMethod, 
	ModelFieldListMetadataKey, 
	ModelFieldMetadata, 
	ModelFieldMetadataKey, 
	ModelMetadata, 
	ModelMetadataKey, 
	ModelSchemaMetadataKey, 
	OnlyOptions, 
	RedirectResult, 
	ViewResult 
} from './types';
import { getClassPropertyList, getCallerPath } from './reflection';
import { ResolveKey, Tiny } from '@denwa/tiny';
import viewResultHandler from './handlers/view';
import redirectResultHandler from './handlers/redirect';

export const TinyKey = 'tiny';
export const ContextKey = 'context';
export const ControllerConfigKey = 'controllerConfig';
export const ControllerKey = 'controller';
export const ControllerActionResultKey = 'actionResult';

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
		const schema = getModelSchema(type);

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
				else if(key in this.request.params) {
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

export function view(name: string, data?: any): ViewResult {
	return {
		type: 'view',
		name,
		data
	}
}

export function redirect(url: string): RedirectResult
export function redirect(status: number, url: string): RedirectResult
export function redirect(...args: any[]): RedirectResult {
	switch(args.length) {
		case 1: {
			return {
				type: 'redirect',
				status: 303,
				url: args[0]
			}
		}

		case 2: {
			return {
				type: 'redirect',
				status: args[0],
				url: args[1]
			}
		}

		default: {
			throw new Error(`invalid arguments length=${args.length}, args=${JSON.stringify(args)}`)
		}
	}
}

export function controller(filename?: string) {
	if(!filename) {
		const callPath = getCallerPath();
		if(!callPath) {
			throw new Error(`unable to get controller filename`);
		}

		filename = callPath;
	}

	return function(type: any) {
		const controller: ControllerMetadata = {
			filename: filename!,
			actions: new Map<string, ControllerActionMetadata>()
		}
		
		Reflect.defineMetadata(ControllerMetadataKey, controller, type);

		const props = getClassPropertyList(type.prototype, ControllerActionListMetadataKey);
		for(const prop of props) {
			const action = Reflect.getMetadata(ControllerActionMetadataKey, type.prototype, prop);
			controller.actions.set(prop, action);
		}
	}
}

export function action(method?: HttpMethod, path?: string) {
	return function(type: any, property: string) {
		const name = property;
		if(!method && !path) {
			switch(name) {
				case 'index': 
					method = 'get';
					path = '/';
					break;

				case 'create': 
					method = 'get';
					path = '/create';
					break;

				case 'save':
					method = 'post';
					path = '/';
					break;

				case 'saveDone':
					method = 'get';
					path = 'save/done';
					break;

				case 'updateDone':
					method = 'get';
					path = 'update/done';
					break;

				case 'deleteDone':
					method = 'get';
					path = 'delete/done';
					break;

				case 'show':
					method = 'get';
					path = '/:id'
					break;

				case 'edit': 
					method = 'get';
					path = '/:id/edit';
					break;

				case 'update':
					method = 'patch';
					path = '/:id';
					break;

				case 'delete':
					method = 'get';
					path = '/:id/delete';
					break;

				case 'destroy':
					method = 'delete';
					path = '/:id';
					break;

				default:
					method = method ?? 'get';
					path = property;
			}
		}

		if(!method) {
			method = 'get';
		}

		if(!path) {
			path = property;
		}

		const metadata: ControllerActionMetadata = {
			name,
			method,
			path
		}
		Reflect.defineMetadata(ControllerActionMetadataKey, metadata, type, property);

		const props = getClassPropertyList(type, ControllerActionListMetadataKey);
		props.push(property);
	}
}

export function model() {
	return function(type: any) {
		let model: ModelMetadata = {
			fields: new Map<string, ModelFieldMetadata>()
		};
		Reflect.defineMetadata(ModelMetadataKey, model, type);

		const props = getClassPropertyList(type.prototype, ModelFieldListMetadataKey);
		for(const prop of props) {
			const field = Reflect.getMetadata(ModelFieldMetadataKey, type.prototype, prop);
			model.fields.set(prop, field);
		}
	}
}

export function field(options?: ModelFieldMetadata) {
	return function(type: any, property: string) {
		Reflect.defineMetadata(ModelFieldMetadataKey, options, type, property);
		
		const props = getClassPropertyList(type, ModelFieldListMetadataKey);
		props.push(property);
	}
}

export function getModelMetadata(type: any): ModelMetadata {
	const metadata: ModelMetadata = Reflect.getMetadata(ModelMetadataKey, type);
	if(!metadata) {
		throw new Error(`${type.name} requires @model() decorator`);
	}

	return metadata;
}

export function getModelSchema(type: any): yup.ObjectSchema<any> {
	let schema: yup.ObjectSchema<any> = Reflect.getMetadata(ModelSchemaMetadataKey, type);
	if(schema) {
		return schema;
	}

	const metadata: ModelMetadata = getModelMetadata(type);
	const properties: any = {};
	for(const [key, value] of metadata.fields.entries()) {
		properties[key] = value;
	}

	schema = yup.object().shape(properties);
	Reflect.defineMetadata(ModelSchemaMetadataKey, schema, type);

	return schema;
}

export function getControllerMetadata(type: any): ControllerMetadata {
	const metadata: ControllerMetadata = Reflect.getMetadata(ControllerMetadataKey, type);
	if(!metadata) {
		throw new Error(`${type.name} requires @controller() decorator`);
	}

	return metadata;
}

export function mount(router: IRouter, prefix: string, type: ClassType, only?: OnlyOptions[]): void {
	const controller = getControllerMetadata(type);
	const props = getClassPropertyList(type.prototype, ControllerActionListMetadataKey);
	
	for(const prop of props) {
		if(only && only.includes(prop)) {
			continue;
		}

		const action = controller.actions.get(prop);
		if(!action) {
			throw new Error(`unable to get action ${prop} from controller.actions metadata`);
		}

		let routePrefix = prefix;
		let routePath = action.path;

		if(routePrefix.endsWith('/')) {
			routePrefix = routePrefix.substring(0, routePrefix.length - 1);
		}

		if(routePath.startsWith('/')) {
			routePath = routePath.substring(1, routePrefix.length);
		}

		const route = `${routePrefix}/${routePath}`;
		const config: ControllerConfig = {
			type,
			name: type.name,
			action: action.name,
			filename: controller.filename,
			method: action.method,
			prefix,
			path: action.path,
			route
		}

		router[config.method](config.route, setController(config), actionHandler);
	}
}

export function wrap(handler: (request: Request, response: Response, next: NextFunction) => Promise<any> | any): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		Promise.resolve(handler(request, response, next)).catch(next);
	}
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

export function setController(config: ControllerConfig): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		const context = getData(request, ContextKey);
		if(!context) {
			throw new Error(`unable to get key=${ContextKey} from request.data`);
		}

		const controller = context.resolve(config.type);
		setData(request, ControllerConfigKey, config);
		setData(request, ControllerKey, controller);
		
		next();
	}
}

async function actionHandler(request: Request, response: Response, next: NextFunction): Promise<any> {
	try {
		const context: Context = getData(request, ContextKey);
		if(!context) {
			throw new Error(`unable to find key=${ContextKey} in request.data`);
		}

		const controller: any = getData(request, ControllerKey);
		if(!controller) {
			throw new Error(`unable to find key=${ControllerKey} in request.data`);
		}

		const config: ControllerConfig = getData(request, ControllerConfigKey);
		if(!config) {
			throw new Error(`unable to find key=${ControllerConfigKey} in request.data`);
		}

		const action = config.action;
		const result = await controller[action](context);
		setData(request, ControllerActionResultKey, result);
		next();
	}
	catch(error) {
		next(error);
	}
}

export async function resultHandler(request: Request, response: Response, next: NextFunction): Promise<any> {
	const result = getData(request, ControllerActionResultKey);
	if(!result) {
		return next();
	}

	const context: Context = getData(request, ContextKey);
	if(!context) {
		throw new Error(`unable to find key=${ContextKey} in request.data`);
	}

	try {
		switch(result.type) {
			case 'view': {
				return await viewResultHandler(result, context);
			}

			case 'redirect': {
				return await redirectResultHandler(result, context);
			}

			default:
				return next();
		}
	}
	catch(error) {
		next(error)
	}
}

