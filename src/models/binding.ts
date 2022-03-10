import { Request } from 'express';
import { getModelInfo } from './metadata';
import { ModelErrorList } from './models';

export function castTo(value: any, castType: 'string' | 'bool' | 'int' | 'number' | 'date'): [boolean, any] {
	const type = typeof value;
	if(type === castType) {
		return [true, value];
	}

	if(type === 'number' && castType === 'int') {
		return [true, parseInt(value)];
	}

	if(type === 'object' && castType === 'date' && value instanceof Date) {
		return [true, value];
	}

	switch(castType) {
		case 'int': {
			const num = parseInt(value);
			if(isNaN(num)) {
				return [false, value]
			}

			return [true, num]
		}

		case 'number': {
			const num = parseFloat(value);
			if(isNaN(num)) {
				return [false, value]
			}
			
			return [true, num];
		}

		case 'bool': {
			if(value === 'true' || value === 'false') {
				return [true, value === 'true'];
			}

			return [false, value];
		}

		case 'date': {
			const dt = Date.parse(value);
			if(isNaN(dt)) {
				return [false, value];
			}

			return [true, dt];
		}
	}

	return [false, value]
}

export function bindRequest(model: any, request: Request) {
	if(model === undefined || model === null) {
		throw new Error(`invalid model, model=undefined`);
	}

	if(request === undefined || request === null) {
		throw new Error(`invalid request, request=undefined`);
	}

	const modelInfo = getModelInfo(model);
	for(const key of modelInfo.properties.keys()) {
		const property = modelInfo.properties.get(key)!;
		
		let value: any = undefined;
		let name = property.name;

		if(request.query && name in request.query) {
			value = request.query[name];
		}
		else if(request.params && name in request.params) {
			value = request.params[name];
		}
		else if(request.body && name in request.body) {
			value = request.body[name];
		}

		if(value !== null && value !== undefined) {
			let [castOk, castValue] = castTo(value, property.type as any);

			if(castOk) {
				value = castValue;	
			}
			else {
				if(model.errors instanceof ModelErrorList) {
					const errors: ModelErrorList = model.errors;
					errors.add({
						name: 'cast',
						property: property.name,
						message: `invalid cast, value=${value} type=${property.type}`
					})
				}
			}
		}
		
		model[name] = value;
	}
}