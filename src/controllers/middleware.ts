import { Tiny } from '@denwa/tiny';
import { Request, Response, NextFunction, RequestHandler, IRouter } from 'express';
import { Context, ContextInstance, ContextKey, deleteData, getContext, getData, setData } from './context';
import { RouteConfig } from './types';
import * as results from './results';

/**
 * context data tiny instance key
 */
export const TinyKey = 'tiny';

/**
 * controller route key
 */
export const RouteKey = 'eki:route';

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
export function setContextInstance(tiny?: Tiny): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		if(!tiny) {
			tiny = request.app.get(TinyKey);
			if(!tiny) {
				throw new Error(`unable to get key=${tiny} from request.app.get()`);
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
export function setControllerRoute(route: RouteConfig): RequestHandler {
	return function(request: Request, response: Response, next: NextFunction) {
		const context = getContext(request);
		const controllerInstance = context.resolve(route.controller);

		setData(request, RouteKey, route);
		setData(request, ControllerInstanceKey, controllerInstance);
		
		next();
	}
}

/**
 * clears controller values from request
 * @param request express request
 * @param response express response
 * @param next express next fucntion
 */
export function clearController(request: Request, response: Response, next: NextFunction): void {
	deleteData(request, RouteKey);
	deleteData(request, ControllerInstanceKey);
	next();
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
		const controller: any = getData(request, ControllerInstanceKey);
		if(!controller) {
			throw new Error(`unable to find controller instance in request.data, key=${ControllerInstanceKey}`);
		}

		const route: RouteConfig = getData(request, RouteKey);
		if(!route) {
			throw new Error(`unable to find controller route in request.data, key=${RouteKey}`);
		}

		const action = route.action;
		const result = await controller[action](context);
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
	const result = getData(request, ActionResultKey);
	if(!result) {
		return next();
	}

	const context = getContext(request);

	try {
		switch(result.type) {
			case 'view': {
				return await results.viewHandler(result, context);
			}

			case 'redirect': {
				return await results.redirectHandler(result, context);
			}

			default:
				return next();
		}
	}
	catch(error) {
		next(error)
	}
}