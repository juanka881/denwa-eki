import { getCallerPath } from '../src/utils/reflection';
import path from 'path';
import { describe, Suite } from 'mocha';
export { describe, it, Suite } from 'mocha';

export function ts(fn: (this: Suite) => void): Suite
export function ts(unit: string, fn: (this: Suite) => void) : Suite
export function ts(...args: any[]): Suite
{
	let fn: (this: Suite) => void | undefined;
	let unit: string | undefined;

	if(args.length === 1) {
		fn = args[0]
	}
	else if(args.length === 2) {
		unit = args[0];
		fn = args[1];
	}
	else {
		throw new Error(`invalid test() overload call, arguments=${JSON.stringify(args)}`);
	}

	const filename: string | undefined = getCallerPath(); 
	if(!filename) {
		throw new Error(`unable to get test filename`);
	}

	let title = path.relative(process.cwd(), filename);
	if(unit) {
		title = path.join(unit);
	}

	if(title.startsWith('dist' + path.sep)) {
		title = title.substring(('dist' + path.sep).length);
	}

	if(title.startsWith('test' + path.sep)) {
		title = title.substring(('test' + path.sep).length);
	}

	if(title.endsWith('.test.js')) {
		title = title.substring(0, title.length - '.test.js'.length);
	}

	title = title.replace(/\\/g, '/');

	return describe(title, fn);
}