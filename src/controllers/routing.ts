import { Log } from '@denwa/log';
import { IRouter } from 'express';
import urlJoin from 'url-join';
import { Constructor } from '../utils/reflection';
import { getControllerInfo } from './metadata';
import { executeAction, handleResult, setControllerRoute } from './middleware';
import { RouteInfo } from './types';

/**
 * route builder
 */
export interface RouteBuilder {
	/**
	 * router instance
	 */
	router: IRouter;


	/**
	 * register controller in routes
	 * @param type controller class contructor
	 */
	controller(type: Constructor): void;
}

/**
 * creates a resource builder function
 * @param router router instance
 * @param log logger
 * @returns resource builder
 */
export function createRouteBuilder(router: IRouter, log: Log): RouteBuilder {
	const builder: RouteBuilder = {
		router,
		controller(type) {
			registerController(router, log, type);
		}
	}

	return builder;
}

/**
 * gets the route path for using a prefix and action path
 * @param prefix prefix path
 * @param action action path
 * @returns relative url string with route path
 */
export function getRoutePath(prefix: string, action: string): string {
	let path = urlJoin('/', prefix, action);
	if(path.startsWith('//')) {
		path = path.substring(1);
	}

	if(path.endsWith('/') && path !== '/') {
		path = path.substring(0, path.length - 1);
	}

	return path;
}

/**
 * register controller routes 
 * @param router router instance
 * @param log log instance
 * @param type target class type
 * @param options resource options
 */
export function registerController(router: IRouter, log: Log, type: Constructor): void {
	const controller = getControllerInfo(type);
	
	for(const key of controller.actions.keys()) {
		const action = controller.actions.get(key)!;
		const prefix = controller.prefix;
		const path = getRoutePath(prefix, action.path);
		const route: RouteInfo = {
			controller,
			action,
			path
		}

		log.debug(`register route: ${type.name}#${action.name} -> ${route.action.method} ${route.path}`, {
			controller: type.name,
			action: route.action.name,
			method: route.action.method,
			path: route.path
		});

		router[route.action.method](
			route.path, 
			setControllerRoute(route),
			executeAction, 
			handleResult
		);
	}
}