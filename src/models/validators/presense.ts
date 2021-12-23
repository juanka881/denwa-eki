import { createError, EachValidator, EachValidatorOptions, formatText, ValidatorBuilder, ValidatorResult } from '../validation';

export class PresenseValidator extends EachValidator {
	name = 'presense';

	constructor(options: EachValidatorOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		if(!(value === null || value === undefined)) {
			return;
		}

		return [
			createError(this.name, property, '{label} is required', this.options)
		];
	}
}

export function presense(): ValidatorBuilder {
	return function(options) {
		return new PresenseValidator(options);
	}
}