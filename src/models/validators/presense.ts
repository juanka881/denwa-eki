import { ClassKeys } from '../../utils/reflection';
import { EachValidator, EachValidatorOptions, format, ValidatesContext, ValidatorResult } from '../validation';

export class PresenseValidator extends EachValidator {
	name = 'presense';

	constructor(options: EachValidatorOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		if(value === null || value === undefined) {
			const message = this.options.message ?? '{label} is required';
			return [{
				name: this.name,
				property,
				message: format(message, this.options),
				validator: this
			}]
		}
	}
}

export function presense<T extends Function>(ctx: ValidatesContext<T>, properties: ClassKeys<T>[]): void {
	ctx.schema.add(new PresenseValidator({ 
		properties: properties as string[]
	}));
}