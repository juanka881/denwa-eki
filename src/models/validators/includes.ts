import { EachValidator, EachValidatorOptions, format, ValidatorBuilder, ValidatorResult } from '../validation';

export interface IncludesOptions extends EachValidatorOptions {
	values: any[];
}

export class IncludesValidator extends EachValidator<IncludesOptions> {
	name =  'includes';

	constructor(options: IncludesOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		if(!this.options.values.includes(value)) {
			const message = this.options.message ?? '{label} must be one of {values}';
			return [{
				name: this.name,
				property,
				message: format(message, this.options),
				validator: this
			}]
		}
	}
}

export function includes(values: any[]): ValidatorBuilder {
	return function(properties: string[]) {
		return new IncludesValidator({
			properties,
			values
		});
	}
}