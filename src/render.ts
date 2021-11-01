import React from 'react';
import { Request, Response } from 'express';

export interface ViewProps<T = any> {
	request: Request;
	response: Response;
	data?: T;
}

export interface AppProps {
	viewComponent: React.ComponentType<any>;	
	viewProps: ViewProps;
	layout?: GetLayout;
}

export interface LayoutProps {
	viewProps: ViewProps;
	children: React.ReactNode;
}

export type GetLayout = (props: AppProps) => React.ReactNode;