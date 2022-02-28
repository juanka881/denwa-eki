import { ClassType } from '../utils/reflection';

/**
 * controller http methods
 */
export type HttpMethod = 'get' | 'post' | 'delete' | 'patch' | 'put' | 'head' | 'options';

 /**
  * controller resource assignment only limit type
  */
export type OnlyOptions = 'index' | 'show' | 'create' | 'edit' | 'delete' | string;

/**
 * route config information
 */
export interface RouteConfig {
	/**
	 * controller clas
	 */
	controllerType: ClassType;

	/**
	 * controller name
	 */
	name: string;

	/**
	 * action name
	 */
	action: string;

	/**
	 * controller filename
	 */
	filename: string;

	/**
	 * http method
	 */
	method: HttpMethod;

	/**
	 * controller prefix
	 */
	prefix: string;

	/**
	 * route path
	 */
	path: string;

	/**
	 * full route string, as registered
	 * in express
	 */
	route: string;	
}