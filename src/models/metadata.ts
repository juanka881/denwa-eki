import 'reflect-metadata';
import * as reflection from '../utils/reflection';
import { capitalCase } from 'change-case';
import { ValidationSchema } from './validation';

/**
 * model fields metadata
 */
export interface FieldMetadata {
	/**
	 * field key on the source object to read model from
	 */
	key?: string;

	/**
	 * field source on source object to read model from 
	 * defaults to query, params, and body
	 */
	source?: 'body' | 'query' | 'params' | string;

	/**
	 * field type
	 */
	type?: 'string' | 'number' | 'bool' | 'date';
}

/**
 * model metadata
 */
export interface ModelMetadata {
	/**
	 * model fields
	 */
	fields: Map<string, FieldMetadata>;

	/**
	 * model schema
	 */
	 schema?: ValidationSchema;
}

/**
 * model metadata reflection key
 */
export const ModelMetadataKey = Symbol('ModelMetadataKey');

/**
 * field metadata reflection key
 */
export const FieldMetadataKey = Symbol('FieldMetadataKey');

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
export function getFieldMetadata(target: Object, property: string): FieldMetadata {
	target = reflection.getConstructor(target);
	const metadata = Reflect.getMetadata(FieldMetadataKey, target, property);
	if(!metadata) {
		throw new Error(`class=${target} property=${property} requires @field decorator`);
	}

	return metadata;
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
			fields: new Map<string, FieldMetadata>(parentMetadata.fields),
			schema: parentMetadata.schema ? parentMetadata.schema.clone() : undefined
		}
	}
	else {
		metadata = {
			fields: new Map<string, FieldMetadata>(),
			schema: undefined
		}

		const properties = reflection.getClassPropertyList(target);
		for(const property of properties) {
			const field = getFieldMetadata(target, property);
			metadata.fields.set(property, field);
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
 * decorates a class property as a model field, field metadata will be
 * using when parsing and validating model
 * @param metadata field metadata options
 * @returns property decorator
 */
export function fieldDecorator(metadata?: FieldMetadata): PropertyDecorator {
	return function(target: Object, property: string | Symbol) {
		// might be class constructor or prototype
		target = reflection.getConstructor(target);

		metadata = metadata ?? {};
		let name: string;

		if(typeof property === 'symbol') {
			name = property.description ?? '';
		}
		else {
			name = property as string;
		}
		
		if(!metadata.key) {
			metadata.key = name;
		}

		if(!metadata.type) {
			metadata.type = 'string';
		}

		const model = defineModelMetadata(target);
		model.fields.set(name, metadata);
		
		reflection.addClassProperty(target, name);		
		Reflect.defineMetadata(FieldMetadataKey, metadata, target, name);
	}
}

