import { ResolveKey } from '@denwa/tiny';
import { Request, Response, NextFunction } from 'express';

export interface ActionResult {
	type: string;
}

export interface ViewResult extends ActionResult {
	type: 'view'
	name: string;
	data?: any;
}

export interface RedirectResult extends ActionResult {
	type: 'redirect';
	status: number;
	url: string;
}

export interface ViewProps {
	request: Request;
	response: Response;
	locals: any;
	data: any;
}

export interface AppProps {
	view: any;
	viewProps: ViewProps;
}

export interface DocumentProps {
	viewProps: ViewProps
	children: React.ReactNode;
}

export interface Context {
	request: Request;
	response: Response;
	next: NextFunction;
	model<T>(type: ClassType<T>): T;
	resolve<T>(key: ResolveKey<T>): T;
}

export interface ControllerMetadata {
	filename: string;
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

export interface MountOptions<T> {
	type: ClassType<T>;
	prefix: string;
	action?: keyof T;
	path?: string;
	method?: HttpMethod;
	only?: OnlyOptions[];
}

export interface ModelMetadata {
	fields: Map<string, ModelFieldMetadata>;
}

export interface ModelFieldMetadata {
	key?: string;
	from?: 'body' | 'query' | 'params';
	require?: boolean;
	format?: 'email' | 'url' | 'uuid';
	type?: 'string' | 'number' | 'bool' | 'date' | ClassType<any>;
	array?: 'string' | 'number' | 'bool' | 'date' | ClassType<any>;
	trim?: boolean;
	enum?: string[];
	pattern?: RegExp;
	message?: string;
	label?: string;
	default?: any;
	min?: number;
	max?: number;
	lessThan?: number;
	moreThan?: number;
	positive?: boolean;
	negative?: boolean;
	integer?: boolean;
}

export interface ClassType<T = any> {
    new(...args: any[]): T;
}

export type HttpMethod = 'get' | 'post' | 'delete' | 'patch' | 'put' | 'head' | 'options';
export type OnlyOptions = 'index' | 'show' | 'create' | 'edit' | 'delete' | string;

export const ControllerMetadataKey = Symbol('controller');
export const ControllerActionMetadataKey = Symbol('action');
export const ControllerActionListMetadataKey = Symbol('controllerActionList');

export const ModelMetadataKey = Symbol('model');
export const ModelFieldListMetadataKey = Symbol('modelFieldList');
export const ModelFieldMetadataKey = Symbol('modelField');
export const ModelSchemaMetadataKey = Symbol('modelSchema');