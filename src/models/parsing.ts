import { ClassType } from '../utils/reflection';
import { getModelMetadata } from './metadata';

export interface ValueParser {
	name: string;
	parse(target: any, property: string): any;
}

export function parseModel<T>(target: ClassType<T>, data: any, parsers?: Map<string, ValueParser>) {
	const model = new target();
	const metadata = getModelMetadata(target);

	for(const fieldName of metadata.fields.keys()) {
		const field = metadata.fields.get(fieldName);
		if(!field) {
			continue;
		}

		const key =  field.key ?? fieldName;
		const source = field.source;
		let value: any = undefined;

		if(source) {
			value = (data as any)[source][key];
		}
		else {
			if(data.query && fieldName in data.query) {
				value = data.query[key];
			}
			else if(data.params && fieldName in data.params) {
				value = data.params[key];
			}
			else if(data.body && fieldName in data.body) {
				value = data.body[key];
			}
		}

		(model as any)[fieldName] = value;
	}
	
	return model;
}