import React from 'react';
import { Request, Response } from 'express';

export interface ViewProps<T = any> {
	request: Request;
	response: Response;
	data?: T;
}

export interface AppProps {
	view: React.ComponentType<any>;
	layout?: GetLayout;
	props: ViewProps;
}

export interface LayoutProps {
	props: ViewProps;
	children: React.ReactNode;
}

export type GetLayout = (view: React.ReactNode, props: ViewProps) => React.ReactNode;