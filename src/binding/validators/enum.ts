import { getBindingLabel } from '../metadata';
import { ModelErrorList } from '../model';
import { ValidatorBuilder, Validator } from '../validation';

export class EnumValidator implements Validator {
	property: string;
	values: any[];

	constructor(property: string, values: any[]) {
		this.property = property;
		this.values = values;
	}

	validate(model: any, errors: ModelErrorList): void {
		const value = model[this.property];

		if(value === null || value === undefined || value === '') {
			return;
		}

		if(!this.values.includes(value)) {
			const label = getBindingLabel(model, this.property);
			errors.add({
				name: 'enum',
				property: this.property,
				message: `${label} must be one of ${this.values.join(', ')}`
			})
		}
	}
}

export function enumOf(values: any[]): ValidatorBuilder {
	return function(property) {
		return new EnumValidator(property, values);
	}
}