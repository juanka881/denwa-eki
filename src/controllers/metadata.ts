import { getConstructor, Constructor } from '../utils/reflection';
import { paramCase } from 'change-case';
import pluralize from 'pluralize';
import { HttpMethod } from './types';

/**
 * controller info reflection key
 */
export const ControllerInfoKey = Symbol('eki:controllerInfo');

/**
 * action metadata reflection key
 */
export const ActionInfoKey = Symbol('eki:actionInfo');

/**
 * controller action info
 */
export interface ActionInfo {
	/**
	 * action function name
	 */
	name: string;

	/**
	 * action http method
	 */
	method: HttpMethod;

	/**
	 * action path, relative to controller's prefix
	 */
	path: string;
}

/**
 * controller info
 */
export interface ControllerInfo {
	/**
	 * controller class constructor 
	 */
	constructor: Constructor;

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
	 * controllers action map,
	 * use to mount the controllers actions 
	 * handlers in the router
	 */
	actions: Map<string, ActionInfo>;
}

/**
 * controller info options
 */
export interface ControllerOptions {
	/**
	 * controller prefix
	 */
	prefix?: string;
}

/**
 * get a objects controller info, throws if not found
 * @param object target object
 * @returns controller info object
 */
export function getControllerInfo(object: Object): ControllerInfo {
	const controllerInfo = tryGetControllerInfo(object);
	if (!controllerInfo) {
		throw new Error(`class=${object} requires @controller() or action() decorators`);
	}

	return controllerInfo;
}

/**
 * gets controller information, returns undefined if not found
 * @param constructor class type constructor
 * @returns controller info or undefined if not found
 */
export function tryGetControllerInfo(object: Object): ControllerInfo | undefined {
	const constructor = getConstructor(object);
	const controllerInfo = Reflect.getMetadata(ControllerInfoKey, constructor);
	return controllerInfo;
}

/**
 * set controller information
 * @param object target object
 * @param options 
 * @returns 
 */
export function setControllerInfo(object: Object, options?: ControllerOptions): ControllerInfo {
	let controllerInfo: ControllerInfo | undefined = Reflect.getOwnMetadata(ControllerInfoKey, object);
	if (controllerInfo && options) {
		if (options.prefix && controllerInfo.prefix !== options.prefix ) {
			controllerInfo.prefix = options.prefix;
		}
	}

	if(controllerInfo) {
		return controllerInfo;
	}

	const constructor = getConstructor(object);
	const name = constructor.name;
	let prefix = options?.prefix;

	/* istanbul ignore else */
	if (!prefix) {
		let prefixName = name;

		/* istanbul ignore else */
		if(prefixName.endsWith('Controller')) {
			prefixName = prefixName.substring(0, prefixName.length - 'Controller'.length);
		}

		prefix = paramCase(pluralize(prefixName));
	}

	controllerInfo = {
		prefix,
		name,
		constructor: constructor as any,
		actions: new Map<string, ActionInfo>()
	}

	Reflect.defineMetadata(ControllerInfoKey, controllerInfo, constructor);
	return controllerInfo;
}

/**
 * gets a http method and path from a list of
 * conventions, that match a property name for a function
 * to a well known route
 * @param name property name
 * @returns http method and path as a tuple, undefined if not matches are found
 */
export function getKnownAction(name: string): [HttpMethod | undefined, string | undefined] {
	switch (name) {
		/**
		 * show methods
		 */
		case 'show': return ['get', '/:id']

		/**
		 * index methods
		 */
		case 'index': return ['get', '/'];

		/**
		 * create methods
		 */
		case 'create': return ['get', '/create'];
		case 'doCreate': return ['post', '/create'];
		case 'createDone': return ['get', '/create/done'];

		/**
		 * edit methods
		 */
		case 'edit': return ['get', '/:id/edit']
		case 'doEdit': return ['patch', '/:id/edit'];
		case 'editDone': return ['get', '/edit/done']

		/**
		 * delete methods
		 */
		case 'delete': return ['get', '/:id/delete']
		case 'doDelete': return ['delete', '/:id/delete'];
		case 'deleteDone': return ['get', '/delete/done']

		default: return [undefined, undefined];
	}
}

/**
 * controller decorator, use to set controller prefix
 * @param prefix route prefix
 * @returns class decorator
 */
export function controller(prefix?: string): ClassDecorator {
	return function (target: Object) {
		const constructor = getConstructor(target);
		setControllerInfo(constructor, { prefix });
	}
}

/**
 * action decorator, use to mark a function as a controller
 * action
 * @param method http method for action
 * @param path route path, relative to controller's prefix
 * @returns property decorator
 */
export function action(method?: HttpMethod, path?: string): PropertyDecorator {
	return function (constructor: Object, property: string | Symbol) {
		// get property name
		let name: string;

		/* istanbul ignore if */
		if (typeof property === 'symbol') {
			name = property.description ?? '';
		}
		else {
			name = property as string;
		}

		// determine method and path
		// base on conventions
		if (!method && !path) {
			[method, path] = getKnownAction(name);
		}

		if (!method) {
			method = 'get';
		}

		if (!path) {
			path = paramCase(name);
		}

		const actionInfo: ActionInfo = {
			name,
			method,
			path
		}

		// might be class constructor or prototype
		constructor = getConstructor(constructor);
		const controller = setControllerInfo(constructor);
		controller.actions.set(name, actionInfo);
	}
}