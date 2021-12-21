import path from 'path';
import React from 'react';
import { renderToStaticNodeStream } from 'react-dom/server';
import { Context, getData } from '../../context';
import { RouteConfig } from '../../types';
import { AppProps } from '../../../views';
import { Response } from 'express';
import { ActionResult } from '../types';
import { RouteKey } from '../../middleware';

/**
 * renders a view as html
 */
export interface ViewResult extends ActionResult {
	type: 'view';
	status: number;
	name: string;
	data?: any;
}

/**
 * view result helper functions
 * @param status http status code, defaults to 200
 * @param name view name in the controller's views folder
 * @param data view data 
 */
export function view(status: number, name: string, data?: any): ViewResult;
export function view(name: string, data?: any): ViewResult;
export function view(...args: any[]): ViewResult {
	switch (args.length) {
		// (name: string)
		case 1: {
			return {
				type: 'view',
				status: 200,
				name: args[0],
				data: undefined
			}
		}

		// (status: number, name: string)
		// (name: string, data?: any)
		case 2: {
			// (status: number, name: string)
			if (typeof args[0] === 'number') {
				return {
					type: 'view',
					status: args[0],
					name: args[1],
					data: undefined
				}
			}

			// (name: string, data?: any)
			if (typeof args[0] === 'string') {
				return {
					type: 'view',
					status: 200,
					name: args[0],
					data: args[1]
				}
			}
		}

		// (status: number, name: string, data?: any)
		case 3: {
			return {
				type: 'view',
				status: args[0],
				name: args[1],
				data: args[2]
			}
		}
	}

	throw new Error(`invalid arguments length=${args.length}, args=${JSON.stringify(args)}`)
}

export async function renderView(response: Response, result: ViewResult): Promise<any> {
	const request = response.req;
	const route: RouteConfig = getData(request, RouteKey);
	let metadata = response.locals.metadata;
	if (!metadata) {
		metadata = {};
		response.locals.metadata = metadata;
	}

	metadata.route = route;
	metadata.result = result;
	metadata.user = (request as any).user;

	const viewsDir = request.app.get('views');
	if (!viewsDir) {
		throw new Error(`unable to get views path from request.app.get('views')`);
	}

	let viewPath = result.name + '.js';
	if (route) {
		const controllerDir = path.dirname(route.filename);
		viewPath = path.join(controllerDir, 'views', result.name + '.js');
	}

	const appPath = path.join(viewsDir, 'app.js');
	const appComponent = require(appPath).default;
	if (!appComponent) {
		throw new Error(`unable to find default app component from file: ${appPath}`);
	}

	const viewModule = require(viewPath);
	const ViewComponent = viewModule.default;
	if (!ViewComponent) {
		throw new Error(`unable to find default view component from file: ${viewPath}`);
	}

	const appProps: AppProps = {
		ViewComponent,
		viewProps: {
			request: request,
			response: response,
			data: result.data
		}
	}
	const renderedAppView = React.createElement(appComponent, appProps);

	if (!response.statusCode && result.status) {
		response.status(result.status);
	}

	response.type('html');
	response.write('<!DOCTYPE html>');

	const promise = new Promise<void>((resolve, reject) => {
		const stream = renderToStaticNodeStream(renderedAppView);
		stream.on('end', () => resolve());
		stream.on('error', error => reject(error));
		stream.pipe(response);
	});

	await promise;
}

export async function viewHandler(result: ViewResult, context: Context): Promise<any> {
	await renderView(context.response, result);
}