import { ModelErrorList } from '../model';
import { Validator, ValidatorBuilder } from '../validation';
import { getBindingLabel } from '../metadata';

export class PasswordConfirmationValidator implements Validator {
	property: string;
	
	constructor(property: string) {
		this.property = property;
	}

	validate(model: any, errors: ModelErrorList): void {
		const value = model[this.property];
		const confirmProperty = `${this.property}Confirmation`;
		const confirmValue = model[confirmProperty];

		const propertyLabel = getBindingLabel(model, this.property);
		const confirmLabel = getBindingLabel(model, confirmProperty);

		if(value === null || value === undefined || value === '') {
			errors.add({
				name: 'passwordConfirmation',
				property: this.property,
				message: `${propertyLabel} is required`
			})
		}

		if(confirmValue === null || confirmValue === undefined || confirmValue === '') {
			errors.add({
				name: 'passwordConfirmation',
				property: confirmProperty,
				message: `${confirmLabel} is required`
			})
		}
		
		if(value !== confirmValue) {
			errors.add({
				name: 'passwordConfirmation',
				property: this.property,
				message: `${propertyLabel} must match ${confirmLabel}`
			})			
		}
	}
}

export function passwordConfirmation(): ValidatorBuilder {
	return function(property) {
		return new PasswordConfirmationValidator(property);
	}
}