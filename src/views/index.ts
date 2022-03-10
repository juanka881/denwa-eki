import React from 'react';
import { Request, Response } from 'express';
import { RouteInfo } from '../controllers/types';

export interface ViewProps<T = any> {
	request: Request;
	response: Response;
	data: T;
	user?: any;
	locals: {
		[key: string]: any
	},
	route?: RouteInfo;
}

export const ViewContext = React.createContext<ViewProps | undefined>(undefined);