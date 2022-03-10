import { Validator, ValidationContext } from '../validation';

export class EnumValidator implements Validator {
	set: Set<any>;

	constructor(values: any[]) {
		this.set = new Set(values);
	}

	validate(ctx: ValidationContext): void {
		const value = ctx.value;

		if(value === null || value === undefined || value === '') {
			return;
		}

		if(!this.set.has(value)) {
			ctx.errors.add({
				name: 'enum',
				property: ctx.property.name,
				message: `${ctx.property.label} must be one of ${[...this.set].join(', ')}`
			})
		}
	}
}

export function enumOf(values: any[]): Validator {
	return new EnumValidator(values);
}