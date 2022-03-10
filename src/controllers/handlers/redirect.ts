import { Context } from '../context';
import { ActionResult } from '../types';

/**
 * redriects to a new url
 */
export interface RedirectResult extends ActionResult {
	type: 'redirect';
	status: number;
	url: string;
}

/**
 * redirect result helper function, defaults to status 303
 * @param url redirect url
 */
export function redirect(url: string): RedirectResult
export function redirect(status: number, url: string): RedirectResult
export function redirect(...args: any[]): RedirectResult {
	switch (args.length) {
		case 1: {
			return {
				type: 'redirect',
				status: 303,
				url: args[0]
			}
		}

		case 2: {
			return {
				type: 'redirect',
				status: args[0],
				url: args[1]
			}
		}

		default: {
			throw new Error(`invalid arguments length=${args.length}, args=${JSON.stringify(args)}`)
		}
	}
}

export async function redirectHandler(result: RedirectResult, context: Context): Promise<any> {
	return context.response.redirect(result.status, result.url);
}

