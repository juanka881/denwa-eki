import 'reflect-metadata';
import * as reflection from '../utils/reflection';
import { capitalCase } from 'change-case';
import { ValidationSchema } from './validation';

/**
 * model fields metadata
 */
export interface FieldMetadata {
	/**
	 * field label override, defaults to property in capital case
	 */
	label?: string;

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


export function getModelMetadata(target: Object): ModelMetadata {
	const metadata = Reflect.getMetadata(ModelMetadataKey, target);
	if(!metadata) {
		throw new Error(`class=${target} requires @model() decorator`);
	}

	return metadata;
}

export function getFieldMetadata(target: Object, property: string): FieldMetadata {
	const metadata = Reflect.getMetadata(FieldMetadataKey, target, property);
	if(!metadata) {
		throw new Error(`class=${target} property=${property} requires @field decorator`);
	}

	return metadata;
}

export function setFieldMetadata(target: Object, property: string, field: FieldMetadata): void {
	Reflect.defineMetadata(FieldMetadataKey, field, target, property);
}

export function getFieldLabel(target: Object, property: string): string {
	const field = getFieldMetadata(target, property);
	return field.label ?? property;
}

export function getModelValidationSchema(target: Object): ValidationSchema | undefined {
	const metadata = getModelMetadata(target);
	return metadata.schema;
}

export function setModelValidationSchema(target: Object, schema: ValidationSchema): void {
	const metadata = getModelMetadata(target);
	metadata.schema = schema
}

export function modelDecorator(): ClassDecorator {
	return function(target: Object) {
		const metadata: ModelMetadata = {
			fields: new Map<string, FieldMetadata>(),
			schema: undefined
		}

		const properties = reflection.getClassPropertyList(target);
		for(const property of properties) {
			const field = getFieldMetadata(target, property);
			metadata.fields.set(property, field);
		}

		Reflect.defineMetadata(ModelMetadataKey, metadata, target);
	}
}

export function fieldDecorator(metadata?: FieldMetadata): PropertyDecorator {
	return function(target: Object, property: string | Symbol) {
		metadata = metadata ?? {};		
		let name: string;

		if(typeof property === 'symbol') {
			name = property.description ?? '';
		}
		else {
			name = property as string;
		}
		
		if(!metadata.label) {
			metadata.label = capitalCase(name);
		}

		if(!metadata.key) {
			metadata.key = name;
		}

		if(!metadata.type) {
			metadata.type = 'string';
		}

		Reflect.defineMetadata(FieldMetadataKey, metadata, target);
		reflection.addClassPropertyToList(target, name);
	}
}

