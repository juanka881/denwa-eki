import { getBindingLabel } from '../metadata';
import { ModelErrorList } from '../model';
import { Validator, ValidatorBuilder } from '../validation';

// https://github.com/ajv-validator/ajv-formats/blob/4dd65447575b35d0187c6b125383366969e6267e/src/formats.ts
export const EMAIL = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
export const URL = /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
export const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const ZIPCODE = /^\d{5}(?:[-\s]\d{4})?$/;

export type FormatType = 'email' | 'url' | 'uuid' | 'zip' | RegExp;

export class FormatValidator implements Validator {
	property: string;
	type: FormatType;
	message?: string;

	constructor(property: string, type: FormatType, message?: string) {
		this.property = property;
		this.type = type;
		this.message = message;
	}

	validate(model: any, errors: ModelErrorList): void {
		const label = getBindingLabel(model, this.property);
		const value = model[this.property];

		if(value === null || value === undefined || value === '') {
			return;
		}

		switch(this.type) {
			case 'email': {
				this.validateEmail(label, value, errors);
				break;
			}

			case 'url': {
				this.validateUrl(label, value, errors);
				break;
			}

			case 'uuid': {
				this.validateUUID(label, value, errors);
				break;
			}

			case 'zip': {
				this.validateZip(label, value, errors);
				break;
			}

			default: {
				this.validateRegex(label, value, errors);
				break;
			}
		}
	}

	validateEmail(label: string, value: any, errors: ModelErrorList): void {
		if(!EMAIL.test(value)) {
			errors.add({
				name: 'format',
				property: this.property,
				message: this.message ?? `${label} must be email address`
			})
		}
	}

	validateUrl(label: string, value: any, errors: ModelErrorList): void {
		if(!URL.test(value)) {
			errors.add({
				name: 'format',
				property: this.property,
				message: this.message ?? `${label} must be URL`
			})
		}
	}

	validateUUID(label: string, value: any, errors: ModelErrorList): void {
		if(!UUID.test(value)) {
			errors.add({
				name: 'format',
				property: this.property,
				message: this.message ?? `${label} must be UUID`
			})
		}
	}

	validateZip(label: string, value: any, errors: ModelErrorList): void {
		if(!ZIPCODE.test(value)) {
			errors.add({
				name: 'format',
				property: this.property,
				message: this.message ?? `${label} must be zipcode, format = #####`
			})
		}
	}

	validateRegex(label: string, value: any, errors: ModelErrorList): void {
		if(this.type instanceof RegExp && !this.type.test(value)) {
			errors.add({
				name: 'format',
				property: this.property,
				message: this.message ?? `${label} must match pattern`
			})
		}
	}
}

export function formatOf(type: FormatType, message?: string): ValidatorBuilder {
	return function(property) {
		return new FormatValidator(property, type, message);
	}
}