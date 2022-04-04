import path from 'path';
import React from 'react';
import { renderToStaticNodeStream } from 'react-dom/server';
import { Context, getData, setData } from '../context';
import { RouteInfo } from '../types';
import { ViewPropsContext, ViewProps } from '../../views';
import { Response } from 'express';
import { ActionResult } from '../types';
import { RenderTimingInfoKey, RouteInfoKey, TimingInfo } from '../middleware';

/**
 * renders a view as html
 */
export interface ViewResult extends ActionResult {
	type: 'view';
	name: string;
	data?: any;
}

/**
 * view result helper functions
 * @param status http status code, defaults to 200
 * @param name view name in the controller's views folder
 * @param data view data 
 */
export function view(name: string, data: any): ViewResult
export function view(name: string): ViewResult
export function view(...args: any[]): ViewResult {
	switch (args.length) {
		// (name: string)
		case 1: {
			return {
				type: 'view',
				name: args[0],
				data: undefined
			}
		}

		// (name: string, data: any)
		case 2: {
			return {
				type: 'view',
				name: args[0],
				data: args[1]
			}
		}

		default: {
			throw new Error(`invalid arguments length=${args.length}, args=${JSON.stringify(args)}`)
		}
	}
}

export async function renderView(response: Response, result: ViewResult): Promise<any> {
	const request = response.req;
	let viewPath: string = '';

	if(result.name.startsWith('views:')) {
		const viewsDir = request.app.get('views');
		if (!viewsDir) {
			throw new Error(`unable to get views dirname path from request.app.get('views')`);
		}

		const name = result.name.substring('views:'.length);
		viewPath = path.join(viewsDir, name);
	}
	else if(!result.name.startsWith('/') && !result.name.startsWith('./')) {
		const route: RouteInfo = getData(request, RouteInfoKey);
		if(!route.instance) {
			throw new Error(`unable to get route controller instance from route.instance`);
		}

		let controllerDir = (route.instance as any).dirname;
		if(!controllerDir) {
			throw new Error(`unable to get controller dirname from route.instance.dirname, set dirname on controller with "dirname = __dirname"`);
		}

		const name = result.name + '.js';
		viewPath = path.join(controllerDir, 'views', name);
	}
	else {
		throw new Error(`unable to find view name=${result.name}`);
	}

	const viewModule = require(viewPath);
	const viewComponent = viewModule.default;
	if (!viewComponent) {
		throw new Error(`unable to find default view component from file: ${viewPath}`);
	}

	const viewProps: ViewProps = {
		request,
		response,
		data: result.data,
		locals: response.locals,
		user: (request as any).user,
		route: getData(request, RouteInfoKey),

	}
	const viewElement = React.createElement(ViewPropsContext.Provider, { 
		value: viewProps, 
		children: React.createElement(viewComponent, viewProps)
	});

	response.type('html');
	response.write('<!DOCTYPE html>');

	const promise = new Promise<void>((resolve, reject) => {
		const stream = renderToStaticNodeStream(viewElement);
		stream.on('end', () => resolve());
		stream.on('error', error => reject(error));
		stream.pipe(response);
	});

	await promise;
}

export async function viewHandler(result: ViewResult, context: Context): Promise<any> {
	const timing = new TimingInfo();
	try {
		setData(context.request, RenderTimingInfoKey, timing);
		await renderView(context.response, result);
	}
	finally {
		timing.end();
	}
}