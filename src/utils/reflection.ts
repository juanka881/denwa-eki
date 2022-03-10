/**
 * class constructor function type
 */
export interface Constructor<T = any> {
    new(...args: any[]): T;
}

/**
 * type to extract keys from class type
 */
export type ClassKeys<T extends Function> = keyof T['prototype'];

/**
 * class property list metadadata key
 */
export const PropertyListKey = Symbol('reflection:propertyList');

/**
 * checks if a target value is a class constructor
 * @param target target value to check
 * @returns true if its a constructor
 */
export function isConstructor(target: Object) {
    return target 
		&& typeof target === 'function' 
		&& target.prototype 
		&& target.prototype.constructor === target;
}

/**
 * checks if a target value is a class prototype
 * @param target target value to check
 * @returns true if its a prototype, otherwise false
 */
export function isPrototype(target: Object) {
	return target 
		&& typeof target === 'object' 
		&& target.constructor 
		&& typeof target.constructor === 'function' 
		&& target.constructor.prototype
		&& target.constructor.prototype === target;
}

/**
 * inspects a value and if its a constructor returns it, 
 * otherwise if its a prototype returns the prototype's contructor
 * else throws error
 * @param target target value to check
 * @returns class constructor
 */
export function getConstructor(target: Object): Function {
	if(isConstructor(target))  {
		return target as Function;
	}
	else if(isPrototype(target)) {
		return target.constructor;
	}
	else if(target && target.constructor) {
		return target.constructor;
	}
	else {
		throw new Error(`unable to get constructor from target=${target}`);
	}
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