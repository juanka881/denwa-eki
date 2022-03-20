import React, { useContext } from 'react';
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

export const ViewPropsContext = React.createContext<ViewProps | undefined>(undefined);

export function useViewProps<T = any>(): ViewProps<T> {
	const props = useContext(ViewPropsContext);
	if(!props) {
		throw new Error(`ViewPropsContext set not, props is undefined`);
	}

	return props;
}