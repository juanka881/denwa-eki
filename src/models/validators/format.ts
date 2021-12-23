import { EachValidator, EachValidatorOptions, ValidatorBuilder, ValidatorResult, formatText as formatText, createError} from '../validation';

export interface FormatOptions extends EachValidatorOptions {
	pattern: 'email' | 'url' | 'uuid' | 'us-zipcode' | RegExp;
}

// https://github.com/ajv-validator/ajv-formats/blob/4dd65447575b35d0187c6b125383366969e6267e/src/formats.ts
export const EMAIL_PATTERN = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
export const URL_PATTERN = /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
export const UUID_PATTERN = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const US_ZIPCODE_PATTERN = /^\d{5}(?:[-\s]\d{4})?$/;

export class FormatValidator extends EachValidator<FormatOptions> {
	name = 'format';

	constructor(options: FormatOptions) {
		super(options);
	}

	getPattern(): RegExp | undefined {
		if(this.options.pattern instanceof RegExp) {
			return this.options.pattern;
		}

		if(typeof this.options.pattern === 'string') {

		}

		switch(this.options.pattern) {

		}
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		let template: string = '';
		let pattern: RegExp;

		if(this.options.pattern instanceof RegExp) {
			pattern = this.options.pattern;
			template = '{label} must match {pattern}';
		}
		else if(typeof this.options.pattern === 'string') {
			switch(this.options.pattern) {
				case 'email': {
					pattern = EMAIL_PATTERN;
					template = '{label} must be a email address';
					break;
				}
	
				case 'url': {
					pattern = URL_PATTERN;
					template = '{label} must be a valid URL';
					break;
				}
	
				case 'uuid': {
					pattern = UUID_PATTERN;
					template = '{label} must be a UUID value';
					break;
				}
	
				case 'us-zipcode': {
					pattern = US_ZIPCODE_PATTERN;
					template = '{label} must be a US Zip Code';
					break;
				}
				
				default: {
					throw new Error(`invalid options.pattern, pattern=${this.options.pattern}`);
				}
			}
		}
		else {
			throw new Error(`invalid options.pattern, pattern=${this.options.pattern}`);
		}

		if(pattern.test(value)) {
			return;
		}

		return [
			createError(this.name, property, template, this.options)
		];
	}
}

export function format(pattern: FormatOptions['pattern']): ValidatorBuilder {
	return function(options) {
		return new FormatValidator({
			...options,
			pattern
		});
	}
}