import { ClassKeys } from '../utils/reflection';
import { getModelValidationSchema, setModelValidationSchema } from './metadata';
/**
 * validation error object
 */
 export interface ValidationError {
	/**
	 * validator friendly name for debugging
	 */
	name: string;

	/**
	 * property that was validated or undefined for base
	 */
	property?: string;

	/**
	 * validation error message
	 */
	message: string;

	/**
	 * validator that generated the error
	 */
	validator: Validator<any>;
}

/**
 * validator result
 */
export type ValidatorResult = ValidationError[] | undefined;

/**
 * validator base options
 */
export interface ValidatorOptions {
	/**
	 * property label
	 */
	label?: string;

	/**
	 * override validator message
	 */
	message?: string;

	/**
	 * additional validator options
	 */
	[key: string]: any
}

/**
 * validator object, implemented by classes
 * that perform validations
 */
export interface Validator<TOptions extends ValidatorOptions = ValidatorOptions> {
	options?: TOptions;

	/**
	 * validation implementation
	 * @param context validation context object
	 */
	validate(target: any): ValidatorResult;
}

/**
 * each validator options
 */
export interface EachValidatorOptions extends ValidatorOptions {
	properties: string[];
}

/**
 * validator that validates each property of a target object
 */
export class EachValidator<TOptions extends EachValidatorOptions = EachValidatorOptions> implements Validator<TOptions> {
	options: TOptions;

	constructor(options: TOptions) {
		this.options = options;
	}

	validate(target: any): ValidatorResult {
		let result: ValidatorResult;
		for(const property of this.options.properties) {
			const value = target[property];
			const errors = this.validateEach(target, property, value);
			if(errors && errors.length > 0) {
				result = result ? result.concat(errors) : errors;
			}
		}

		return result;
	}

	validateEach(target: any, property: string, value: any): ValidatorResult {
		throw new Error('not implemented, method must be overriden in subclass');
	}
}

/**
 * validation error list
 */
export class ValidationErrorList {
	private properties: Map<string | undefined, ValidationError[]>;

	constructor() {
		this.properties = new Map<string, ValidationError[]>();
	}

	messages(): string[] {
		let errors: string[] = [];

		for(const list of this.properties.values()) {
			if(list && list.length > 0) {
				errors = errors.concat(list.map(x => x.message));
			}
		}

		return errors;
	}

	for(property?: string): string[] {
		const list = this.properties.get(property) ?? [];
		const messages = list.map(x => x.message);
		return messages;
	}

	get(property?: string): ValidationError[] {
		return this.properties.get(property) ?? [];
	}

	add(error: ValidationError) {
		let list = this.properties.get(error.property);
		if(!list) {
			list = [];
			this.properties.set(error.property, list);
		}

		list.push(error);
	}

	valid(property?: string): boolean {
		const length = this.properties.get(property)?.length ?? 0;
		return length === 0;
	}

	clear() {
		this.properties.clear();
	}

	get size(): number {
		return [...this.properties.values()]
			.map(x => x.length)
			.reduce((total, value) => total + value);
	}
}

/**
 * validation schema object. use as container to 
 * map validators to list of class properties
 */
export class ValidationSchema {
	private properties: Map<string | undefined, Validator[]>;

	constructor() {
		this.properties = new Map<string, Validator[]>();
	}

	clear() {
		this.properties.clear();
	}

	add(validator: Validator): void;
	add(property: string, validator: Validator): void;
	add(...args: any[]): any {
		let property: string | undefined;
		let validator: Validator;

		switch(args.length) {
			case 1: {
				property = undefined;
				validator = args[0];
				break;
			}

			case 2: {
				property = args[0];
				validator = args[1];
				break;
			}

			default: {
				throw new Error(`invalid method overload call, arguments: ${JSON.stringify(args)}`);
			}
		}

		let list = this.properties.get(property);
		if(!list) {
			list = [];
			this.properties.set(property, list);
		}

		list.push(validator);
	}

	validate(target: any): ValidatorResult {
		let result: ValidatorResult;

		for(const property of this.properties.keys()) {
			const validators = this.properties.get(property);
			if(!validators || validators.length === 0) {
				continue;
			}

			for(const validator of validators) {
				const errors = validator.validate(target);
				if(errors && errors.length > 0) {
					result = result ? result.concat(errors) : errors;
				}
			}
		}

		return result;
	}
}

/**
 * validator builder type
 */
export type ValidatorBuilder = (properties: string[]) => Validator;

/**
 * validate builder callback, takes a list
 */
export type ValidateBuilder<T extends Function> = (properties: ClassKeys<T> | ClassKeys<T>[], builder: ValidatorBuilder) => void;

/**
 * validation builder, takes a callback that uses the validate
 * function to register validation for class properties
 * @param target class type
 * @param builder validate builder 
 */
export function validation<T extends Function>(target: T, builder: (validate: ValidateBuilder<T>) => void): void {
	let schema = getModelValidationSchema(target);
	if(!schema) {
		schema = new ValidationSchema();
		setModelValidationSchema(target, schema);
	}

	function validate<T extends Function>(properties: ClassKeys<T> | ClassKeys<T>[], builder: ValidatorBuilder): void {
		if(!Array.isArray(properties)) {
			properties = [properties]
		}

		const validator = builder(properties as string[]);
		schema!.add(validator);
	}

	builder(validate);
}

export const TOKEN_FORMAT = /\{([0-9a-zA-Z_]+)\}/g;
export function format(template: string, options: { [key: string]: any }): string {
	function replace(match: string, p1: string, offset: number) {
        let result = '';

        if (template[offset - 1] === '{' &&
            template[offset + match.length] === '}') {
            return p1
        } 
		else {
            result = options && options.hasOwnProperty(p1) ? options[p1] : null
            if (result === null || result === undefined) {
                return ''
            }

			if(Array.isArray(result)) {
				result = result.join(', ');
			}

            return result;
        }
	}

	const text = template.replace(TOKEN_FORMAT, replace);
	return text;
}