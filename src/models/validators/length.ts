import { createError, EachValidator, EachValidatorOptions, ValidationError, ValidatorBuilder, ValidatorResult } from '../validation';

export interface LengthOptions extends EachValidatorOptions {
	min?: number;
	max?: number;
	range?: [number, number];
	eq?: number;
}

export interface LengthHelperOptions {
	min?: number;
	max?: number;
	range?: [number, number];
	eq?: number;
}

export class LengthValidator extends EachValidator<LengthOptions> {
	name = 'length';

	constructor(options: LengthOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		const errors: ValidationError[] = [];

		if(typeof value !== 'string') {
			throw new Error(`invalid value, expected a string (type=${typeof value}, value=${value})`);
		}

		if(this.options.min && !(value.length > this.options.min)) {
			errors.push(createError(this.name, property, '{label} must be more than {min} characters', this.options));
		}
		
		if(this.options.max && !(value.length < this.options.max)) {
			errors.push(createError(this.name, property, '{label} must be less than {max} characters', this.options));
		}

		if(this.options.range && !(value.length > this.options.range[0] && value.length < this.options.range[1])) {
			errors.push(createError(this.name, property, '{label} must be between {range[0]} and {range[1]} characters', this.options));
		}

		if(this.options.eq && !(value.length === this.options.eq)) {
			errors.push(createError(this.name, property, '{label} must be {eq} characters', this.options));
		}

		return errors;
	}
}

export function length(helperOptions: LengthHelperOptions): ValidatorBuilder {
	return function(options) {
		return new LengthValidator({
			...helperOptions,
			...options
		});
	}
}