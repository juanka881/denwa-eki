import { Validator, ValidationContext } from '../validation';

export class PasswordConfirmationValidator implements Validator {
	validate(ctx: ValidationContext): void {
		const value = ctx.value;
		const confirmProperty = `${ctx.property.name}Confirmation`;
		const confirmValue = ctx.model[confirmProperty];		
		const confirmLabel = ctx.modelInfo.properties.get(confirmProperty)?.label ?? 'Password Confirmation';

		if(value === null || value === undefined || value === '') {
			ctx.errors.add({
				name: 'passwordConfirmation',
				property: ctx.property.name,
				message: `${ctx.property.label} is required`
			})
		}

		if(confirmValue === null || confirmValue === undefined || confirmValue === '') {
			ctx.errors.add({
				name: 'passwordConfirmation',
				property: confirmProperty,
				message: `${confirmLabel} is required`
			})
		}
		
		if(value !== confirmValue) {
			ctx.errors.add({
				name: 'passwordConfirmation',
				property: ctx.property.label,
				message: `${ctx.property.label} must match ${confirmLabel}`
			})
		}
	}
}

let instance: PasswordConfirmationValidator;
export function passwordConfirmation(): Validator {
	if(!instance) {
		instance = new PasswordConfirmationValidator()
	}

	return instance;
}