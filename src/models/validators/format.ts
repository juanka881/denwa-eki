import { Validator, ValidationContext } from '../validation';

// https://github.com/ajv-validator/ajv-formats/blob/4dd65447575b35d0187c6b125383366969e6267e/src/formats.ts
export const EMAIL = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
export const URL = /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
export const RELATIVE_URL = /^\/[a-zA-Z0-9\-\.\_\~\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]*$/i;
export const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const ZIPCODE = /^\d{5}(?:[-\s]\d{4})?$/;

export type FormatType = 'email' | 'url' | 'relative-url' | 'uuid' | 'zip' | RegExp;

export class FormatValidator implements Validator {
	type: FormatType;
	message?: string;

	constructor(type: FormatType, message?: string) {
		this.type = type;
		this.message = message;
	}

	validate(ctx: ValidationContext): void {
		const value = ctx.value;

		if(value === null || value === undefined || value === '') {
			return;
		}

		switch(this.type) {
			case 'email': {
				this.validateEmail(ctx);
				break;
			}

			case 'url': {
				this.validateUrl(ctx);
				break;
			}

			case 'relative-url': {
				this.validateRelativeUrl(ctx);
				break;
			}

			case 'uuid': {
				this.validateUUID(ctx);
				break;
			}

			case 'zip': {
				this.validateZip(ctx);
				break;
			}

			default: {
				this.validateRegex(ctx);
				break;
			}
		}
	}

	validateEmail(ctx: ValidationContext): void {
		if(!EMAIL.test(ctx.value)) {
			ctx.errors.add({
				name: 'format',
				property: ctx.property.name,
				message: this.message ?? `${ctx.property.label} must be email address`
			})
		}
	}

	validateUrl(ctx: ValidationContext): void {
		if(!URL.test(ctx.value)) {
			ctx.errors.add({
				name: 'format',
				property: ctx.property.name,
				message: this.message ?? `${ctx.property.label} must be URL`
			})
		}
	}

	validateRelativeUrl(ctx: ValidationContext): void {
		if(!RELATIVE_URL.test(ctx.value)) {
			ctx.errors.add({
				name: 'format',
				property: ctx.property.name,
				message: this.message ?? `${ctx.property.label} must be relative URL`
			})
		}
	}

	validateUUID(ctx: ValidationContext): void {
		if(!UUID.test(ctx.value)) {
			ctx.errors.add({
				name: 'format',
				property: ctx.property.name,
				message: this.message ?? `${ctx.property.label} must be UUID`
			})
		}
	}

	validateZip(ctx: ValidationContext): void {
		if(!ZIPCODE.test(ctx.value)) {
			ctx.errors.add({
				name: 'format',
				property: ctx.property.name,
				message: this.message ?? `${ctx.property.label} must be zipcode, format = #####`
			})
		}
	}

	validateRegex(ctx: ValidationContext): void {
		if(this.type instanceof RegExp && !this.type.test(ctx.value)) {
			ctx.errors.add({
				name: 'format',
				property: ctx.property.name,
				message: this.message ?? `${ctx.property.label} must match pattern`
			})
		}
	}
}

export function formatOf(type: FormatType, message?: string): Validator {
	return new FormatValidator(type, message);
}