import { ClassKeys } from '../utils/reflection';
import { getModelMetadata } from './metadata';
import { Model, ModelErrorList } from './model';

/**
 * model validator
 */
export interface Validator {
	validate(model: any, errors: ModelErrorList): void;
}

/**
 * model validation
 */
export class Validation {
	private _validators: Map<string, Validator[]>;

	constructor() {
		this._validators = new Map<string, Validator[]>();
	}

	add(property: string, validator: Validator): void {
		let list = this._validators.get(property);
		if(!list) {
			list = [];
			this._validators.set(property, list);
		}
		list.push(validator);
	}

	validate(model: Model, errors: ModelErrorList): ModelErrorList {
		for(const property of this._validators.keys()) {
			const list = this._validators.get(property);
			if(!list || list.length === 0) {
				continue;
			}

			for(const validator of list) {
				validator.validate(model, errors)
			}
		}

		return errors;
	}
	
	clear(): void {
		this._validators = new Map<string, Validator[]>();
	}

	clone(): Validation {
		const copy = new Validation();
		copy._validators = new Map<string, Validator[]>(this._validators);

		return copy;
	}
}

/**
 * validator builder, builds a validation
 * object, for the given property
 */
export type ValidatorBuilder = ((property: string) => Validator);

/**
 * builds validation rules for a given
 * property using the builder function provided
 */
export interface ValidationBuilder<TKeys> {
	/**
	 * add a side effect to the validation rules
	 * @param property model property name
	 * @param builder validator builder
	 */
	do(property: TKeys, builder: (property: string) => Validator): void;

	/**
	 * add a validation check to the validation rules
	 * @param property model property name
	 * @param builder validator builder
	 */
	check(property: TKeys, builder: (property: string) => Validator): void;
}

/**
 * sets validation for model, 
 * @param modelType class type
 * @param callback callback that registers validation for the model
 */
export function validation<T extends Function>(modelType: T, callback: (builder: ValidationBuilder<ClassKeys<T> & '*'>) => void): void {
	// set schema
	const metadata = getModelMetadata(modelType);
	if(!metadata.validation) {
		metadata.validation = new Validation();
	}

	const validation = metadata.validation;
	const validationBuilder: ValidationBuilder<ClassKeys<T> & '*'> = {
		do(property, builder) {
			if(property === '*') {
				for(const property of metadata.properties.keys()) {
					validation.add(property, builder(property));
				}
			}
			else {
				validation.add(property as string, builder(property as string));
			}
		},
		check(property, builder) {
			if(property === '*') {
				for(const property of metadata.properties.keys()) {
					validation.add(property, builder(property));
				}
			}
			else {
				validation.add(property as string, builder(property as string));
			}
		}
	} 

	callback(validationBuilder);
}