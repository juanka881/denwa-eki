export interface ActionResult {
	type: string;
}

export interface ViewResult extends ActionResult {
	type: 'view';
	status: number;
	name: string;
	data?: any;
}

export interface RedirectResult extends ActionResult {
	type: 'redirect';
	status: number;
	url: string;
}

export function view(status: number, name: string, data?: any): ViewResult;
export function view(name: string, data?: any): ViewResult;
export function view(...args: any[]): ViewResult {
	switch(args.length) {
		// (name: string)
		case 1: {
			return {
				type: 'view',
				status: 200,
				name: args[0],
				data: undefined
			}
		}

		// (status: number, name: string)
		// (name: string, data?: any)
		case 2: {
			// (status: number, name: string)
			if(typeof args[0] === 'number') {
				return {
					type: 'view',
					status: args[0],
					name: args[1],
					data: undefined
				}
			}

			// (name: string, data?: any)
			if(typeof args[0] === 'string') {
				return {
					type: 'view',
					status: 200,
					name: args[0],
					data: args[1]
				}
			}
		}

		// (status: number, name: string, data?: any)
		case 3: {
			return {
				type: 'view',
				status: args[0],
				name: args[1],
				data: args[2]
			}
		}
	}

	throw new Error(`invalid arguments length=${args.length}, args=${JSON.stringify(args)}`)
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