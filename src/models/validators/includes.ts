import { createError, EachValidator, EachValidatorOptions, ValidatorBuilder, ValidatorResult } from '../validation';

export interface IncludesOptions extends EachValidatorOptions {
	values: any[];
}

export class IncludesValidator extends EachValidator<IncludesOptions> {
	name =  'includes';

	constructor(options: IncludesOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		if(this.options.values.includes(value)) {
			return;
		}

		return [
			createError(this.name, property, '{label} must be onde of {values}', this.options)
		]
	}
}

export function includes(values: any[]): ValidatorBuilder {
	return function(options) {
		return new IncludesValidator({
			...options,
			values
		});
	}
}