import { 
	Request, 
	Response, 
	NextFunction, 
	RequestHandler, 
	IRouter
} from 'express';
import viewResultHandler from './handlers/view';
import redirectResultHandler from './handlers/redirect';
import { 
	ClassType, 
	ContextKey, 
	ControllerActionResultKey, 
	ControllerConfigKey, 
	ControllerKey 
} from './types';
import { getCallerPath, getClassPropertyList } from './reflection';
import { Context, getData, setData, deleteData } from './context';
import 'reflect-metadata';
import urlJoin from 'url-join';
import pluralize from 'pluralize';
import { paramCase } from 'change-case';

export type HttpMethod = 'get' | 'post' | 'delete' | 'patch' | 'put' | 'head' | 'options';
export type OnlyOptions = 'index' | 'show' | 'create' | 'edit' | 'delete' | string;

export interface ControllerMetadata {
	/**
	 * controlle name, use for debuging
	 */
	name: string;

	/**
	 * controller route prefix, use to 
	 * mount set the controllers mount location
	 * in the router
	 */
	prefix: string;

	/**
	 * controller filename location, 
	 * use to determine the relative location
	 * of controller's views
	 */
	filename: string;

	/**
	 * controllers action map,
	 * use to mount the controllers actions 
	 * handlers in the router
	 */
	actions: Map<string, ControllerActionMetadata>;
}

export interface ControllerActionMetadata {
	name: string;
	method: HttpMethod;
	path: string;
}

export interface ControllerConfig {
	type: ClassType;
	name: string;
	action: string;
	filename: string;
	method: HttpMethod;
	prefix: string;
	path: string;
	route: string;	
}

export interface ResourceOptions {
	prefix?: string;
	only?: OnlyOptions[];
}

export const ControllerMetadataKey = Symbol('controller');
export const ControllerActionMetadataKey = Symbol('action');
export const ControllerActionListMetadataKey = Symbol('controllerActionList');

export function controller(metadata?: Omit<Partial<ControllerMetadata>, 'actions'>) {
	let { filename, name, prefix } = metadata ?? {};

	if(!filename) {
		const callPath = getCallerPath();
		if(!callPath) {
			throw new Error(`unable to get controller filename`);
		}

		filename = callPath;
	}

	return function(type: any) {
		if(!name) {
			name = type.name;

			if(!name) {
				throw new Error(`unable to get controller name from type.name`);
			}

			if(name.endsWith('Controller')) {
				name = name.substring(0, name.length - 'Controller'.length);
			}
		}

		if(!prefix) {
			prefix = paramCase(pluralize(name));
		}

		const controller: ControllerMetadata = {
			filename: filename!,
			name, 
			prefix,
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
				/**
				 * show methods
				 */
				case 'show':
					method = 'get';
					path = '/:id'
					break;

				/**
				 * index methods
				 */
				case 'index': 
					method = 'get';
					path = '/';
					break;

				/**
				 * create methods
				 */
				case 'create': 
					method = 'get';
					path = '/create';
					break;

				case 'doCreate':
					method = 'post';
					path = '/';
					break;

				case 'createDone':
					method = 'get';
					path = '/create/done';
					break;

				/**
				 * edit methods
				 */
				case 'edit': 
					method = 'get';
					path = '/:id/edit';
					break;
				
				case 'doEdit':
					method = 'patch';
					path = '/:id';
					break;

				case 'editDone':
					method = 'get';
					path = '/edit/done';
					break;

				/**
				 * delete methods
				 */
				case 'delete':
					method = 'get';
					path = '/:id/delete';
					break;

				case 'doDelete':
					method = 'delete';
					path = '/:id';
					break;

				case 'deleteDone':
					method = 'get';
					path = 'delete/done';
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
			path = paramCase(property);
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

export function getControllerMetadata(type: any): ControllerMetadata {
	const metadata: ControllerMetadata = Reflect.getMetadata(ControllerMetadataKey, type);
	if(!metadata) {
		throw new Error(`${type.name} requires @controller() decorator`);
	}

	return metadata;
}

export function resource(router: IRouter, type: ClassType, options?: ResourceOptions): void {
	const controller = getControllerMetadata(type);
	const props = getClassPropertyList(type.prototype, ControllerActionListMetadataKey);
	let { prefix, only = [] } = options ?? {};
	
	for(const prop of props) {
		if(only && only.includes(prop)) {
			continue;
		}

		const action = controller.actions.get(prop);
		if(!action) {
			throw new Error(`unable to get action ${prop} from controller.actions metadata`);
		}

		if(!prefix) {
			prefix = controller.prefix;
		}

		let route = urlJoin(prefix, action.path);
		if(route.endsWith('/')) {
			route = route.substring(0, route.length - 1);
		}

		const config: ControllerConfig = {
			type,
			name: controller.name,
			action: action.name,
			filename: controller.filename,
			method: action.method,
			prefix,
			path: action.path,
			route
		}

		router[config.method](
			config.route, 
			setController(config),
			actionHandler, 
			resultHandler, 
			clearController
		);
	}
}

export function wrap(handler: (request: Request, response: Response, next: NextFunction) => Promise<any> | any): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		Promise.resolve(handler(request, response, next)).catch(next);
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

export function clearController(request: Request, response: Response, next: NextFunction): void {
	deleteData(request, ControllerConfigKey);
	deleteData(request, ControllerKey);
	next();
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