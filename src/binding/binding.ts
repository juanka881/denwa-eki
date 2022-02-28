import { Request } from 'express';
import { getModelMetadata } from './metadata';
import { ModelErrorList } from './model';

export function castTo(value: any, type: 'string' | 'bool' | 'int' | 'number' | 'date'): [boolean, any] {
	const valueType = typeof value;
	if(valueType === type) {
		return [true, value];
	}

	if(valueType === 'number' && type === 'int') {
		return [true, value];
	}

	if(valueType === 'object' && type === 'date' && value instanceof Date) {
		return [true, value];
	}

	switch(type) {
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

export function bindModel(model: any, request: Request) {
	if(model === undefined || model === null) {
		throw new Error(`invalid model, model=undefined`);
	}

	if(request === undefined || request === null) {
		throw new Error(`invalid request, request=undefined`);
	}

	const metadata = getModelMetadata(model);
	for(const property of metadata.properties.keys()) {
		const binding = metadata.properties.get(property);
		if(!binding) {
			continue;
		}

		let value: any = undefined;
		if(request.query && property in request.query) {
			value = request.query[property];
		}
		else if(request.params && property in request.params) {
			value = request.params[property];
		}
		else if(request.body && property in request.body) {
			value = request.body[property];
		}

		if(value !== null && value !== undefined) {
			let [result, castedValue] = castTo(value, binding.type);

			if(!result) {
				if(model.errors instanceof ModelErrorList) {
					const errors = model.errors as ModelErrorList;;
					errors.add({
						name: 'cast',
						message: `invalid cast value=${value} type=${binding.type}`
					})
				}
			}

			value = castedValue;
		}
		
		model[property] = value;
	}
	
	return model;
}