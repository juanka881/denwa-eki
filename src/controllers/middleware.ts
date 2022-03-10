import { Tiny } from '@denwa/tiny';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Context, ContextInstance, ContextKey, getContext, getData, setData } from './context';
import { RouteInfo } from './types';
import * as handlers from './handlers';

/**
 * context data tiny instance key
 */
export const TinyKey = 'tiny';

/**
 * controller route key
 */
export const RouteInfoKey = 'eki:routeInfo';

/**
 * controller instance key
 */
export const ControllerInstanceKey = 'eki:controllerInstance';

/**
 * controller action result key
 */
export const ActionResultKey = 'eki:actionResult';

/**
 * wraps a handler so it can handle async functions
 * @param handler async function
 * @returns express handler
 */
export function wrap(handler: (request: Request, response: Response, next: NextFunction) => Promise<any> | any): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		Promise.resolve(handler(request, response, next)).catch(next);
	}
}

/**
 * sets the context instance on the request, 
 * uses provided tiny instance, if not 
 * gets tiny instance from request.app.get('tiny');
 * @param tiny tiny instance to use, optional
 * @returns express middleware handler
 */
export function setRequestContext(tiny?: Tiny): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		if(!tiny) {
			tiny = request.app.get(TinyKey);
			if(!tiny) {
				throw new Error(`unable to get tiny from request.app.get(${TinyKey}), and no tiny instance was passed to setContextInstance() middleware`);
			}
		}
		const context: Context = new ContextInstance(request, response, next, tiny);
		setData(request, ContextKey, context);
		
		next();
	}
}

/**
 * sets controller values on request
 * @param route route config
 * @returns express middleware handler
 */
export function setControllerRoute(route: RouteInfo): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		const context = getContext(request);
		const instance = context.resolve(route.controller.constructor);
		if(!instance) {
			throw new Error(`unable to get controller instance, context.resolve(route.controller.constructor) return undefined`);
		}

		route.instance = instance;
		setData(request, RouteInfoKey, route);
		setData(request, ControllerInstanceKey, instance);
		
		next();
	}
}

/**
 * execute controller action, and stores the action's result
 * @param request express request
 * @param response express response
 * @param next express next function
 */
export async function executeAction(request: Request, response: Response, next: NextFunction): Promise<any> {
	try {
		const context = getContext(request);
		const instance: any = getData(request, ControllerInstanceKey);
		if(!instance) {
			throw new Error(`unable to find controller instance in request.data, key=${ControllerInstanceKey}`);
		}

		const route: RouteInfo = getData(request, RouteInfoKey);
		if(!route) {
			throw new Error(`unable to find controller route info in request.data, key=${RouteInfoKey}`);
		}

		const result = await instance[route.action.name](context);
		setData(request, ActionResultKey, result);
		next();
	}
	catch(error) {
		next(error);
	}
}

/**
 * handle action result, if not result is found, moves to the next
 * handler by calling next()
 * @param request express request
 * @param response  express response
 * @param next express next function
 * @returns 
 */
export async function handleResult(request: Request, response: Response, next: NextFunction): Promise<any> {
	let results = getData(request, ActionResultKey);
	if(!results) {
		return next();
	}

	if(!Array.isArray(results)) {
		results = [results];
	}

	const context = getContext(request);
	for(const result of results) {
		try {
			if(typeof result === 'number') {
				context.response.status(result);
			}
			else if(typeof result === 'object' && 'type' in result) {
				switch(result.type) {
					case 'view': {
						await handlers.viewHandler(result, context);
						break;
					}
		
					case 'redirect': {
						await handlers.redirectHandler(result, context);
						break;
					}
				}
			}
			else if(result === undefined || result === null) {
				continue;
			}
			else {
				throw new Error(`invalid result, result=${JSON.stringify(result)}`);
			}
		}
		catch(error) {
			return next(error);
		}
	}

	if(!context.response.statusCode) {
		context.response.status(200);
	}

	next();
}