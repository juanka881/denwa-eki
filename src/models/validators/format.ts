import { ClassKeys } from '../../utils/reflection';
import { EachValidator, EachValidatorOptions, ValidatesContext, ValidatorResult, format as formatText} from '../validation';

export interface FormatOptions extends EachValidatorOptions {
	format: 'email' | 'url' | 'uuid' | 'us-zipcode';
}

// https://github.com/ajv-validator/ajv-formats/blob/4dd65447575b35d0187c6b125383366969e6267e/src/formats.ts
export const EMAIL_FORMAT = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
export const URL_FORMAT = /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
export const UUID_FORMAT = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const US_ZIPCODE_FORMAT = /^\d{5}(?:[-\s]\d{4})?$/;

export class FormatValidator extends EachValidator<FormatOptions> {
	name = 'format';

	constructor(options: FormatOptions) {
		super(options);
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		let message: string = '';

		switch(this.options.format) {
			case 'email': {
				if(!EMAIL_FORMAT.test(value)) {
					message = '{label} must be a email address';
				}
				break;
			}

			case 'url': {
				if(!URL_FORMAT.test(value)) {
					message = '{label} must be a url address';
				}
				break;
			}

			case 'uuid': {
				if(UUID_FORMAT.test(value)) {
					message = '{label} must be a UUID value';
				}
				break;
			}

			case 'us-zipcode': {
				if(US_ZIPCODE_FORMAT.test(value)) {
					message = '{label} must be a US Zip Code';
				}
				break;
			}
			
			default: {
				throw new Error(`invalid options.format, format=${this.options.format}`);
			}
		}

		if(this.options.message) {
			message = this.options.message
		}

		return [{
			name: this.name,
			property, 
			message: formatText(message, this.options),
			validator: this
		}]
	}
}

export function format<T extends Function>(ctx: ValidatesContext<T>, options: { properties: ClassKeys<T>[] } & Partial<FormatOptions>): void;
export function format<T extends Function>(ctx: ValidatesContext<T>, properties: ClassKeys<T>[], format: FormatOptions['format']): void;
export function format(...args: any[]): void {
	let ctx: ValidatesContext<any>;
	let options: FormatOptions;

	switch(args.length) {
		case 2: {
			ctx = args[0];
			options = args[1];
			break;
		}

		case 3: {
			ctx = args[0];
			options = {
				properties: args[1],
				format: args[2]
			}
			break;
		}

		default: {
			throw new Error(`invalid method overload call, arguments: ${JSON.stringify(args)}`);
		}
	}

	ctx.schema.add(new FormatValidator(options));
}