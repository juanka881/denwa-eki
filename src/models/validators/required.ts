import { Validator, ValidationContext } from '../validation';

export class RequiredValidator implements Validator {
	validate(ctx: ValidationContext): void {
		if(ctx.value === null || ctx.value === undefined || ctx.value === '') {
			ctx.errors.add({
				name: 'required',
				property: ctx.property.name,
				message: `${ctx.property.label} is required`
			})
		}
	}
}

let instance: RequiredValidator;
export function required(): RequiredValidator {
	if(!instance) {
		instance = new RequiredValidator();
	}

	return instance;
}