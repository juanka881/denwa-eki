import { Validator, ValidationContext } from '../validation';

export interface LengthValidatorOptions {
	min?: number;
	max?: number;
	range?: [number, number];
	is?: number;
	message?: string;
	allowBlank?: boolean;
}

export class LengthValidator implements Validator {
	options: LengthValidatorOptions;

	constructor(options: LengthValidatorOptions) {
		this.options = options;
	}

	validate(ctx: ValidationContext): void {
		const value = ctx.value;

		if(value === null || value === undefined || value === '')  {
			return;
		}

		if(typeof value === 'string') {
			this.validateString(ctx);
		}
		else {
			throw new Error(`invalid value type=${typeof value}, value must be a string`);
		}
	}

	validateString(ctx: ValidationContext): void {
		const { value, label, property, errors } = ctx.value;

		if(this.options.min) {
			if(value.length < this.options.min) {
				errors.add({
					name: 'lengthMin',
					property: property.name,
					message: this.options.message ?? `${label} must be at least ${this.options.min} characters`
				})
			}
		}

		if(this.options.max) {
			if(value.length > this.options.max) {
				errors.add({
					name: 'lengthMax',
					property: property.name,
					message: this.options.message ?? `${label} must be less than ${this.options.min} characters`
				})
			}
		}
		
		if(this.options.range) {
			const [min, max] = this.options.range;
			if(value.length < min || value.length > max) {
				errors.add({
					name: 'lengthRange',
					property: property.name,
					message: this.options.message ?? `${label} must be between ${min} and ${max} characters`
				})
			}
		}

		if(this.options.is) {
			if(value.length !== this.options.is) {
				errors.add({
					name: 'lengthIs',
					property: property.name,
					message: this.options.message ?? `${label} must be ${this.options.is} characters`
				})
			}
		}
	}
}

export function lengthOf(options: LengthValidatorOptions): Validator {
	return new LengthValidator(options);
}