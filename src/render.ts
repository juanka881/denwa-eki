import React from 'react';
import { Request, Response } from 'express';

export interface ViewProps<T = any> {
	request: Request;
	response: Response;
	data: T;
}

export interface AppProps {
	ViewComponent: React.ComponentType<any>;	
	viewProps: ViewProps;
}

export interface LayoutProps {
	children: React.ReactNode;
}

export const AppContext = React.createContext<AppProps | undefined>(undefined);