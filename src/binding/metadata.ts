import 'reflect-metadata';
import * as reflection from '../utils/reflection';
import { capitalCase } from 'change-case';
import { Validation } from './validation';

/**
 * model binding metadata
 */
export interface BindingMetadata {
	/**
	 * property name
	 */
	property: string;

	/**
	 * field type
	 */
	type: 'string' | 'number' | 'int' | 'bool' | 'date';

	/**
	 * field label
	 */
	label: string;
}

/**
 * model metadata
 */
export interface ModelMetadata {
	/**
	 * model property bindings
	 */
	properties: Map<string, BindingMetadata>;

	/**
	 * model validation
	 */
	validation?: Validation;
}

/**
 * model metadata reflection key
 */
export const ModelMetadataKey = Symbol('eki:modelMetadata');

/**
 * bind metadata reflection key
 */
export const BindingMetadataKey = Symbol('eki:BindMetadata');

/**
 * checks if the given target type has metadata
 * @param target target type
 * @returns boolean value
 */
export function hasModelMetadata(target: Object): boolean {
	target = reflection.getConstructor(target);	
	return Reflect.getMetadata(ModelMetadataKey, target) !== undefined;
}

/**
 * gets a models metadata object, if it does not exists it throws an error
 * @param target target class type
 * @returns model metadata object
 */
export function getModelMetadata(target: Object): ModelMetadata {
	target = reflection.getConstructor(target);
	
	const metadata = Reflect.getMetadata(ModelMetadataKey, target);
	if(!metadata) {
		throw new Error(`class=${target} requires @model() decorator or inheriting from a class with @model() decorator`);
	}

	return metadata;
}

/**
 * get a model's field metadata object, if it does not exists
 * it throws an error
 * @param target target class type
 * @param property property name
 * @returns mode's field metadata object
 */
export function getBindMetadata(target: Object, property: string): BindingMetadata {
	target = reflection.getConstructor(target);
	const metadata = Reflect.getMetadata(BindingMetadataKey, target, property);
	if(!metadata) {
		throw new Error(`class=${target} property=${property} requires @bind decorator`);
	}

	return metadata;
}

export function getBindingLabel(target: Object, property: string): string {
	const metadata = getBindMetadata(target, property);
	return metadata.label;
}

/**
 * defines a models metadata object on the given target,
 * inherits and merges metadata from parent class if it exists
 * @param target target type
 * @returns model metadata object
 */
export function defineModelMetadata(target: Object): ModelMetadata {
	let metadata: ModelMetadata | undefined = Reflect.getOwnMetadata(ModelMetadataKey, target);
	if(metadata) {
		return metadata;
	}

	const parentMetadata: ModelMetadata | undefined = Reflect.getMetadata(ModelMetadataKey, target);
	if(parentMetadata) {
		metadata = {
			properties: new Map<string, BindingMetadata>(parentMetadata.properties),
			validation: parentMetadata.validation ? parentMetadata.validation.clone() : undefined
		}
	}
	else {
		metadata = {
			properties: new Map<string, BindingMetadata>(),
			validation: undefined
		}

		const properties = reflection.getClassPropertyList(target);
		for(const property of properties) {
			const binding = getBindMetadata(target, property);
			metadata.properties.set(property, binding);
		}
	}

	Reflect.defineMetadata(ModelMetadataKey, metadata, target);
	return metadata;
}

/**
 * decorates a class as a model instance, metadata
 * will be use when parsing and validating a model instanc
 * @returns class decorator
 */
export function modelDecorator(): ClassDecorator {
	return function(target: Object) {
		// target is always constructor
		defineModelMetadata(target);
	}
}

/**
 * decorates a class property as a model property binding, binding metadata will be
 * using when parsing model from request
 * @param metadata field metadata options
 * @returns property decorator
 */
export function bindDecorator(type: BindingMetadata['type']): PropertyDecorator {
	return function(target: Object, property: string | Symbol) {
		// might be class constructor or prototype
		target = reflection.getConstructor(target);

		let propertyName: string;
		if(typeof property === 'symbol') {
			propertyName = property.description ?? '';
		}
		else {
			propertyName = property as string;
		}
		
		const metadata: BindingMetadata = {
			property: propertyName,
			type: type,
			label: capitalCase(propertyName)
		};

		const model = defineModelMetadata(target);
		model.properties.set(propertyName, metadata);
		
		reflection.addClassProperty(target, propertyName);
		Reflect.defineMetadata(BindingMetadataKey, metadata, target, propertyName);
	}
}

