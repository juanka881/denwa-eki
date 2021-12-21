import { Log } from '@denwa/log';
import { IRouter } from 'express';
import urlJoin from 'url-join';
import { ClassType } from '../utils/reflection';
import { getControllerMetadata } from './metadata';
import { clearController, executeAction, handleResult, setControllerRoute } from './middleware';
import { OnlyOptions, RouteConfig } from './types';

/**
 * resource options
 */
export interface ResourceOptions {
	/**
	 * resource prefix
	 */
	prefix?: string;

	/**
	 * resource action limit list
	 */
	only?: OnlyOptions[];
}

/**
 * resource builder
 */
export interface ResourceBuilder {
	/**
	 * router instance
	 */
	router: IRouter;

	/**
	 * register funciton
	 */
	(type: ClassType, options?: ResourceOptions): void;
}

/**
 * creates a resource builder function
 * @param router router instance
 * @param log logger
 * @returns resource builder
 */
export function createResourceBuilder(router: IRouter, log: Log): ResourceBuilder {
	const builder: ResourceBuilder = function(type: ClassType, options?: ResourceOptions) {
		registerResource(router, log, type, options);
	}
	builder.router = router;

	return builder;
}

/**
 * register resource 
 * @param router router instance
 * @param log log instance
 * @param target target class type
 * @param options resource options
 */
export function registerResource(router: IRouter, log: Log, target: ClassType, options?: ResourceOptions): void {
	const controller = getControllerMetadata(target);
	let { prefix, only = [] } = options ?? {};

	for(const key of controller.actions.keys()) {
		if(only && only.includes(key)) {
			continue;
		}

		const action = controller.actions.get(key);
		if(!action) {
			throw new Error(`unable to get action metadata from controller.actions, cotnroller=${target} action=${key}`);
		}

		if(!prefix) {
			prefix = controller.prefix;
		}

		let routePath = urlJoin('/', prefix, action.path);
		if(routePath.startsWith('//')) {
			routePath = routePath.substring(1);
		}

		if(routePath.endsWith('/')) {
			routePath = routePath.substring(0, routePath.length - 1);
		}

		const config: RouteConfig = {
			controller: target,
			name: controller.name,
			action: action.name,
			filename: controller.filename,
			method: action.method,
			prefix,
			path: action.path,
			route: routePath
		}

		log.debug(`register route: ${target.name}#${config.name} ${config.method} ${config.route}`, {
			controller: target.name,
			action: config.action,
			method: config.method,
			route: config.route
		});

		router[config.method](
			config.route, 
			setControllerRoute(config),
			executeAction, 
			handleResult, 
			clearController
		);
	}
}