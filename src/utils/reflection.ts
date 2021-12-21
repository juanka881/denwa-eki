/**
 * class type
 */
export interface ClassType<T = any> {
    new(...args: any[]): T;
}

/**
 * type to extract keys from class type
 */
export type ClassKeys<T extends Function> = keyof T['prototype'];

/**
 * class property list metadadata key
 */
export const ListKey = Symbol('reflection:propertyList');

/**
 * get a list of class properties 
 * that have been assigned metadata via the reflection
 * api
 * @param target class type
 * @returns set of class properties
 */
export function getClassPropertyList(target: Object): Set<string> {
	let set: Set<string> | undefined = Reflect.getOwnMetadata(ListKey, target);
	if(!set) {
		const parentSet = Reflect.getMetadata(ListKey, target);
		if(parentSet) {
			set = new Set(parentSet);
		}
		else {
			set = new Set();
		}

		Reflect.defineMetadata(ListKey, set, target);
	}

	return set;
}

/**
 * add a property to the class property list
 * @param target class type
 * @param property property name
 */
export function addClassPropertyToList(target: Object, property: string): void {
	const list = getClassPropertyList(target);
	list.add(property);
}

export interface GetCallsiteOptions {
	depth?: number;
}

export function getCallsites(): any[] {
	const _prepareStackTrace = (Error as any).prepareStackTrace;
	(Error as any).prepareStackTrace = (_: any, stack: any) => stack;
	const stack = (new Error().stack as any).slice(1); 
	(Error as any).prepareStackTrace = _prepareStackTrace;
	return stack;
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