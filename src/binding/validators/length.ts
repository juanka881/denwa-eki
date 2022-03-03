import { getBindingLabel } from '../metadata';
import { ModelErrorList } from '../model';
import { ValidatorBuilder, Validator } from '../validation';

export interface LengthValidatorOptions {
	min?: number;
	max?: number;
	range?: [number, number];
	is?: number;
	message?: string;
	allowBlank?: boolean;
}

export class LengthValidator implements Validator {
	property: string;
	options: LengthValidatorOptions;

	constructor(property: string, options: LengthValidatorOptions) {
		this.property = property;
		this.options = options;
	}

	validate(model: any, errors: ModelErrorList): void {
		const value = model[this.property];

		if(value === null || value === undefined || value === '')  {
			return;
		}

		const label = getBindingLabel(model, this.property);
		if(typeof value === 'string') {
			this.validateString(label, value, errors);
		}
		else {
			throw new Error(`invalid value type=${typeof value}, value must be a string`);
		}
	}

	validateString(label: string, value: string, errors: ModelErrorList): void {
		if(this.options.min) {
			if(value.length < this.options.min) {
				errors.add({
					name: 'lengthMin',
					property: this.property,
					message: this.options.message ?? `${label} must be at least ${this.options.min} characters`
				})
			}
		}

		if(this.options.max) {
			if(value.length > this.options.max) {
				errors.add({
					name: 'lengthMax',
					property: this.property,
					message: this.options.message ?? `${label} must be less than ${this.options.min} characters`
				})
			}
		}
		
		if(this.options.range) {
			const [min, max] = this.options.range;
			if(value.length < min || value.length > max) {
				errors.add({
					name: 'lengthRange',
					property: this.property,
					message: this.options.message ?? `${label} must be between ${min} and ${max} characters`
				})
			}
		}

		if(this.options.is) {
			if(value.length !== this.options.is) {
				errors.add({
					name: 'lengthIs',
					property: this.property,
					message: this.options.message ?? `${label} must be ${this.options.is} characters`
				})
			}
		}
	}

	// validateNumber(label: string, value: number, errors: ModelErrorList): void {
	// 	if(this.options.min) {
	// 		if(value < this.options.min) {
	// 			errors.add({
	// 				name: 'lengthMin',
	// 				property: this.property,
	// 				message: this.options.message ?? `${label} must be more than ${this.options.min}`
	// 			})
	// 		}
	// 	}

	// 	if(this.options.max) {
	// 		if(value > this.options.max) {
	// 			errors.add({
	// 				name: 'lengthMax',
	// 				property: this.property,
	// 				message: this.options.message ?? `${label} must be less than ${this.options.min}`
	// 			})
	// 		}
	// 	}
		
	// 	if(this.options.range) {
	// 		const [min, max] = this.options.range;
	// 		if(value < min || value > max) {
	// 			errors.add({
	// 				name: 'lengthRange',
	// 				property: this.property,
	// 				message: this.options.message ?? `${label} must be between ${min} and ${max}`
	// 			})
	// 		}
	// 	}

	// 	if(this.options.is) {
	// 		if(value !== this.options.is) {
	// 			errors.add({
	// 				name: 'lengthIs',
	// 				property: this.property,
	// 				message: this.options.message ?? `${label} must be equal to ${this.options.is}`
	// 			})
	// 		}
	// 	}
	// }
}

export function lengthOf(options: LengthValidatorOptions): ValidatorBuilder {
	return function(property) {
		return new LengthValidator(property, options);
	}
}