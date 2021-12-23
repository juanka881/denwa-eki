import * as reflection from '../utils/reflection';
import { paramCase } from 'change-case';
import pluralize from 'pluralize';
import { HttpMethod } from './types';

/**
 * controller metadata reflection key
 */
export const ControllerMetadataKey = Symbol('ControllerMetadataKey');

/**
 * action metadata reflection key
 */
export const ActionMetadataKey = Symbol('ActionMetadataKey');

/**
 * controller action metadata
 */
export interface ActionMetadata {
	name: string;
	method: HttpMethod;
	path: string;
}

/**
 * controller metadata object
 */
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
	actions: Map<string, ActionMetadata>;
}

/**
 * gets the controller filename by searching
 * the callstack, and finding the file
 * that has the current process cwd, and 
 * ends with controller.js
 * @returns filename if found, undefined otherwise
 */
export function getControllerFileName(): string | undefined {
	const CONTROLLER_PATTERN = /[c|C]ontroller\.js$/gm;
	const filenames: string[] = reflection.getCallsites().map(x => x.getFileName());
	const filename = filenames.find(x => x.startsWith(process.cwd()) && CONTROLLER_PATTERN.test(x));
	return filename;
}

export function getControllerMetadata(target: Object): ControllerMetadata {
	const metadata = Reflect.getMetadata(ControllerMetadataKey, target);
	if(!metadata) {
		throw new Error(`class=${target} requires @controller() decorator`);
	}

	return metadata;
}

export function defineControllerMetadata(target: Object, options: Partial<ControllerMetadata>): ControllerMetadata {
	let metadata: ControllerMetadata | undefined = Reflect.getOwnMetadata(ControllerMetadataKey, target);
	if(metadata) {
		if(metadata.filename !== options.filename && options.filename) {
			metadata.filename = options.filename;
		}

		if(metadata.name !== options.name && options.name) {
			metadata.name = options.name;
		}

		if(metadata.prefix !== options.prefix && options.prefix) {
			metadata.prefix = options.prefix;
		}

		return metadata;
	}

	let { name, prefix, filename } = options;
	if(!name) {
		name = (target as Function).name;

		if(!name) {
			throw new Error(`unable to get controller name from target.name`);
		}

		if(name.endsWith('Controller')) {
			name = name.substring(0, name.length - 'Controller'.length);
		}
	}

	if(!prefix) {
		prefix = paramCase(pluralize(name));
	}

	const parentMetadata: ControllerMetadata | undefined = Reflect.getMetadata(ControllerMetadataKey, target);
	if(parentMetadata) {
		metadata = {
			filename: filename!,
			name, 
			prefix,
			actions: new Map<string, ActionMetadata>(parentMetadata.actions)
		}
	}
	else {
		metadata = {
			filename: filename!,
			name, 
			prefix,
			actions: new Map<string, ActionMetadata>()
		}

		const properties = reflection.getClassPropertyList(target);
		for(const property of properties) {
			const action = Reflect.getMetadata(ActionMetadataKey, target, property);
			metadata.actions.set(property, action);
		}
	}

	Reflect.defineMetadata(ControllerMetadataKey, metadata, target);
	return metadata;
}

export function controllerDecorator(options?: Partial<ControllerMetadata>): ClassDecorator {
	options = options ?? {};
	if(!options.filename) {
		const filename = getControllerFileName();
		if(!filename) {
			throw new Error(`unable to get controller filename`);
		}

		options.filename = filename;
	}

	return function(target: Object) {
		// target is always constructor
		defineControllerMetadata(target, options!);
	}
}

export function actionDecorator(method?: HttpMethod, path?: string): PropertyDecorator {
	const filename = getControllerFileName();
	if(!filename) {
		throw new Error(`unable to get controller filename`);
	}

	return function(target: Object, property: string | Symbol) {
		// might be class constructor or prototype
		target = reflection.getConstructor(target);

		let name: string;

		if(typeof property === 'symbol') {
			name = property.description ?? '';
		}
		else {
			name = property as string;
		}

		// determine method and path
		// base on conventions
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
					path = '/create';
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
					path = '/:id/edit';
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
					path = '/:id/delete';
					break;

				case 'deleteDone':
					method = 'get';
					path = '/delete/done';
					break;

				default:
					method = method ?? 'get';
					path = name;
			}
		}

		if(!method) {
			method = 'get';
		}

		if(!path) {
			path = paramCase(name);
		}

		const metadata: ActionMetadata = {
			name,
			method,
			path
		}
		const controller = defineControllerMetadata(target, { filename });
		controller.actions.set(name, metadata);

		reflection.addClassProperty(target, name);
		Reflect.defineMetadata(ActionMetadataKey, metadata, target, name);
	}
}