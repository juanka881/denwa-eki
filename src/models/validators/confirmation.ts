import { createError, EachValidator, EachValidatorOptions, ValidatorBuilder, ValidatorResult } from '../validation';

export class ConfirmationValidator extends EachValidator {
	name = 'confirmation';

	constructor(options: EachValidatorOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		const confirmProperty = `${property}Confirmation`;
		const confirmValue = target[confirmProperty];

		if(value === confirmValue) {
			return;
		}

		return [
			createError(this.name, property, '{label} must match confirmation', this.options)
		];
	}
}

export function confirmation(): ValidatorBuilder {
	return function(options) {
		return new ConfirmationValidator(options);
	}
}