import { ModelErrorList } from '../model';
import { Validator, ValidatorBuilder } from '../validation';

export type WithCallback<T> = (model: T, property: string, errors: ModelErrorList) => void;

export class WithValidator implements Validator {
	property: string;
	callback: WithCallback<any>;

	constructor(property: string, callback: WithCallback<any>) {
		this.property = property;
		this.callback = callback;
	}

	validate(model: any, errors: ModelErrorList): void {
		this.callback(model, this.property, errors);
	}
}

export function validateWith<T = any>(callback: WithCallback<T>): ValidatorBuilder {
	return function(property) {
		return new WithValidator(property, callback);
	}
}