import { ActionInfo, ControllerInfo } from './metadata';

/**
 * controller http methods
 */
export type HttpMethod = 'get' | 'post' | 'delete' | 'patch' | 'put' | 'head' | 'options';

/**
 * route config information
 */
export interface RouteInfo {
	/**
	 * controller info
	 */
	controller: ControllerInfo;

	/**
	 * action info
	 */
	action: ActionInfo;

	/**
	 * controller instance
	 */
	instance?: Object;

	/**
	 * route full path as registered
	 * in express
	 */
	path: string;
}

/**
 * action result
 */
export interface ActionResult {
	/**
	 * result type
	 */
	type: string;
}