import { ControllerConfigKey, getData } from '../framework';
import { Context, ControllerConfig, ViewResult } from '../types';
import path from 'path';
import React from 'react';
import { renderToStaticNodeStream } from 'react-dom/server';

export default async function viewResultHandler(result: ViewResult, context: Context): Promise<any>  {
	const config: ControllerConfig = getData(context.request, ControllerConfigKey);
	if(!config) {
		throw new Error(`unable to get key=${ControllerConfigKey} from request.data`);
	}

	const { request, response } = context;
	let metadata = response.locals.metadata;
	if(!metadata) {
		metadata = {};
		response.locals.metadata = metadata;
	}

	metadata.controller = config;
	metadata.result = result;

	const view: ViewResult = result;
	const viewsDir = request.app.get('views');
	if(!viewsDir) {
		throw new Error(`unable to get views path from request.app.get('views')`);
	}

	const appPath = path.join(viewsDir, 'app.js');
	const controllerDir = path.dirname(config.filename);
	const viewPath = path.join(controllerDir, 'views', view.name + '.js');

	const appComponent = require(appPath).default;
	if(!appComponent) {
		throw new Error(`unable to find default app component from file: ${appPath}`);
	}

	const viewComponent = require(viewPath).default;
	if(!viewComponent) {
		throw new Error(`unable to find default view component from file: ${viewPath}`);
	}

	const renderedAppView = React.createElement(appComponent, {
		view: viewComponent,
		viewProps: {
			request: request,
			response: response,
			locals: response.locals,
			data: view.data
		}
	});

	if(!response.statusCode) {
		response.status(200);
	}
	
	await new Promise<void>((resolve, reject) => {
		response.write('<!DOCTYPE html>', (error) => {
			if(error) {
				return reject(error);
			}
	
			try {
				renderToStaticNodeStream(renderedAppView)
					.pipe(response)
					.on('error', reject);
			}
			catch(renderError) {
				reject(renderError);
			}
		});
	});
}