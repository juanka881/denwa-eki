import { getModelInfo } from './metadata';
import { ModelInfo, PropertyInfo, ModelErrorList } from './models';

export interface ValidationContext {
	model: any;
	modelInfo: ModelInfo;
	property: PropertyInfo;
	value: any;
	errors: ModelErrorList;
}

export interface Validator {
	validate(context: ValidationContext): void;
}

export function validateModel(model: any): ModelErrorList {
	const modelInfo = getModelInfo(model);
	const errors = new ModelErrorList();

	for(const key of modelInfo.properties.keys()) {
		const property = modelInfo.properties.get(key)!;
		const value = model[property.name];
		const context: ValidationContext = {
			model,
			modelInfo,
			property,
			value,
			errors
		}

		for(const rule of property.rules) {
			rule.validate(context);
		}
	}

	return errors;
}