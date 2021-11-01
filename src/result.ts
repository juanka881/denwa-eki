export interface ActionResult {
	type: string;
}

export interface ViewResult extends ActionResult {
	type: 'view'
	name: string;
	data?: any;
}

export interface RedirectResult extends ActionResult {
	type: 'redirect';
	status: number;
	url: string;
}

export function view(name: string, data?: any): ViewResult {
	return {
		type: 'view',
		name,
		data
	}
}

export function redirect(url: string): RedirectResult
export function redirect(status: number, url: string): RedirectResult
export function redirect(...args: any[]): RedirectResult {
	switch(args.length) {
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