import { ClassKeys } from '../utils/reflection';
import { getModelMetadata } from './metadata';
import { capitalCase } from 'change-case';
import _ from 'lodash';

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
	 * allow null or undefined values
	 * defaults = false
	 */
	allowNull?: boolean;

	/**
	 * allow empty string values
	 * defaults = false
	 */
	allowEmpty?: boolean;

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
	/**
	 * property list for the each validator
	 */
	properties: string[];

	/**
	 * additional validator options
	 */
	[key: string]: any
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
			if(_.isNil(value) && this.options.allowNull) {
				continue;
			}

			const WHITESPACE_PATTERN = /^[\s\n\r]*$/;
			if(this.options.allowEmpty) {
				if(_.isNil(value)) {
					continue;
				}

				if(typeof value === 'string' && WHITESPACE_PATTERN.test(value)) {
					continue;
				}
			}

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
	private _size: number;

	constructor() {
		this.properties = new Map<string, ValidationError[]>();
		this._size = 0;
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
		this._size = this._size + 1;
	}

	valid(property?: string): boolean {
		const length = this.properties.get(property)?.length ?? 0;
		return length === 0;
	}

	clear() {
		this.properties.clear();
		this._size = 0;
	}

	get size(): number {
		return this._size;
	}
}

/**
 * validation schema object. use as container to 
 * map validators to list of class properties
 */
export class ValidationSchema {
	private validators: Validator[];

	constructor() {
		this.validators = [];
	}

	clear() {
		this.validators = [];
	}

	add(validator: Validator): void {
		this.validators.push(validator);
	}
	
	validate(target: any): ValidatorResult {
		let result: ValidatorResult;

		for(const validator of this.validators) {
			const errors = validator.validate(target);
			if(errors && errors.length > 0) {
				result = result ? result.concat(errors) : errors;
			}
		}

		return result;
	}

	clone(): ValidationSchema {
		const copy = new ValidationSchema();
		copy.validators = [...this.validators];
		
		return copy;
	}

	get size(): number {
		return this.validators.length;
	}

	getValidators(): Validator[] {
		return [...this.validators];
	}
}

/**
 * validator builder type
 */
export type ValidatorBuilder = (options: EachValidatorOptions) => Validator;

/**
 * validate builder callback, takes a list
 */
export type ValidateBuilder<T extends Function> = (properties: ClassKeys<T> | ClassKeys<T>[], builder: ValidatorBuilder, overrides?: ValidateOverrideOptions) => void;

/**
 * validate builder options to override label or message
 */
export interface ValidateOverrideOptions {
	/**
	 * label overrides
	 */
	label?: string;

	/**
	  * message overrides
	  */
	message?: string;

	/**
	 * allow null or undefined values
	 * defaults = false
	 */
	allowNull?: boolean;

	/**
	  * allow empty string values
	  * defaults = false
	  */
	allowEmpty?: boolean;
}

/**
 * validation builder, takes a callback that uses the validate
 * function to register validation for class properties
 * @param target class type
 * @param validationBuilder validate builder 
 */
export function validation<T extends Function>(target: T, validationBuilder: (validate: ValidateBuilder<T>) => void): void {
	// set schema
	const metadata = getModelMetadata(target);
	let schema: ValidationSchema | undefined = metadata.schema;
	if(!schema) {
		schema = new ValidationSchema();
		metadata.schema = schema;
	}

	// return validate fn to build schema
	function validate<T extends Function>(properties: ClassKeys<T> | ClassKeys<T>[], validatorBuilder: ValidatorBuilder, overrides?: ValidateOverrideOptions): void {
		if(!Array.isArray(properties)) {
			properties = [properties]
		}

		// build labels
		const options: EachValidatorOptions = {
			...overrides,
			properties: properties as string[]
		}

		const validator = validatorBuilder(options);
		schema!.add(validator);
	}

	validationBuilder(validate);
}

export const TOKEN_PATTERN = /\{([0-9a-zA-Z_]+)\}/g;
export function formatText(template: string, label: string, data: { [key: string]: any }): string {
	function replace(match: string, propertyName: string, offset: number) {
        let result = '';

        if (template[offset - 1] === '{' &&
            template[offset + match.length] === '}') {
            return propertyName
        } 
		else {
			if(propertyName === 'label') {
				return label;
			}

			result = _.get(data, propertyName, undefined);
            if (result === null || result === undefined) {
                return ''
            }

			if(Array.isArray(result)) {
				result = result.join(', ');
			}

            return result;
        }
	}

	const text = template.replace(TOKEN_PATTERN, replace);
	return text;
}

export function createError(name: string, property: string, template: string, options: EachValidatorOptions): ValidationError {
	const label = options.label ?? capitalCase(property);
	const message = options.message ?? formatText(template, label, options);

	return {
		name,
		property,
		message
	}
}