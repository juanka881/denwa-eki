import { ClassType } from './types';

export interface GetCallsiteOptions {
	depth?: number;
}

export function getCallsites(): any[] {
	if((Error as any).prepareStackTrace) {
		const _prepareStackTrace = (Error as any).prepareStackTrace;
		(Error as any).prepareStackTrace = (_: any, stack: any) => stack;
		const stack = (new Error().stack as any).slice(1); 
		(Error as any).prepareStackTrace = _prepareStackTrace;
		return stack;
	}
	return [];
}

export function getCallsite(options?: GetCallsiteOptions) {
	const callers = [];
	const callerFileSet = new Set();

	for (const callsite of getCallsites()) {
		const fileName = callsite.getFileName();
		const hasReceiver = callsite.getTypeName() !== null && fileName !== null;

		if (!callerFileSet.has(fileName)) {
			callerFileSet.add(fileName);
			callers.unshift(callsite);
		}

		if (hasReceiver) {
			return callers[options?.depth ?? 0];
		}
	}
}

export function getCallerPath(options?: GetCallsiteOptions) {
	const callsite = getCallsite(options);
	return callsite && callsite.getFileName();
}

export function getClassPropertyList(type: ClassType, listKey: Symbol): string[] {
	let list: string[] = Reflect.getOwnMetadata(listKey, type);
	if(!list) {
		if(Reflect.hasMetadata(listKey, type)) {
			list = [...Reflect.getMetadata(listKey, type)]
		}
		else {
			list = [];
		}

		Reflect.defineMetadata(listKey, list, type);
	}

	return list;
}