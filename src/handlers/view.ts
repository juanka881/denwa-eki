import path from 'path';
import React from 'react';
import { renderToStaticNodeStream } from 'react-dom/server';
import { Context, getData } from '../context';
import { ControllerConfig } from '../controller';
import { AppProps } from '../render';
import { ViewResult } from '../result';
import { Response } from 'express';
import { ControllerConfigKey } from '../types';

export async function renderView(response: Response, result: ViewResult): Promise<any> {
	const request = response.req;
	const config: ControllerConfig = getData(request, ControllerConfigKey);
	let metadata = response.locals.metadata;
	if(!metadata) {
		metadata = {};
		response.locals.metadata = metadata;
	}

	metadata.controller = config;
	metadata.result = result;
	metadata.user = (request as any).user;

	const viewsDir = request.app.get('views');
	if(!viewsDir) {
		throw new Error(`unable to get views path from request.app.get('views')`);
	}
	
	let viewPath = result.name + '.js';
	if(config) {
		const controllerDir = path.dirname(config.filename);
		viewPath = path.join(controllerDir, 'views', result.name + '.js');
	}

	const appPath = path.join(viewsDir, 'app.js');
	const appComponent = require(appPath).default;
	if(!appComponent) {
		throw new Error(`unable to find default app component from file: ${appPath}`);
	}

	const viewModule = require(viewPath);
	const ViewComponent = viewModule.default;
	if(!ViewComponent) {
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

	if(!response.statusCode && result.status) {
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

export default async function viewResultHandler(result: ViewResult, context: Context): Promise<any>  {
	const config: ControllerConfig = getData(context.request, ControllerConfigKey);
	if(!config) {
		throw new Error(`unable to get key=${ControllerConfigKey} from request.data`);
	}

	const { response } = context;
	await renderView(response, result);
}