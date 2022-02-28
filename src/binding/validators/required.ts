import { getBindingLabel } from '../metadata';
import { ValidatorBuilder, Validator } from '../validation';
import { ModelErrorList } from '../model';

export class RequiredValidator implements Validator {
	property: string;

	constructor(property: string) {
		this.property = property;
	}

	validate(model: any, errors: ModelErrorList): void {
		const value = model[this.property];

		if(value === null || value === undefined) {
			const label = getBindingLabel(model, this.property);
			errors.add({
				name: 'required',
				property: this.property,
				message: `${label} is required`
			})
		}
	}
}

export function required(): ValidatorBuilder {
	return function(property) {
		return new RequiredValidator(property);
	}
}