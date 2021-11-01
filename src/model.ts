import { getClassPropertyList } from './reflection';
import { ClassType } from './types';
import * as yup from 'yup';

export interface ModelMetadata {
	fields: Map<string, ModelFieldMetadata>;
}

export interface ModelFieldMetadata {
	key?: string;
	from?: 'body' | 'query' | 'params';
	require?: boolean;
	format?: 'email' | 'url' | 'uuid';
	type?: 'string' | 'number' | 'bool' | 'date' | ClassType<any>;
	array?: 'string' | 'number' | 'bool' | 'date' | ClassType<any>;
	trim?: boolean;
	enum?: string[] | number[];
	pattern?: RegExp;
	message?: string;
	label?: string;
	default?: any;
	min?: number | Date;
	max?: number | Date;
	lessThan?: number;
	moreThan?: number;
	positive?: boolean;
	negative?: boolean;
	integer?: boolean;
}

export interface ModelError {
	type?: string;
	property?: string;
	field?: ModelFieldMetadata;
	data?: any;
	message: string;
}

export const ModelMetadataKey = Symbol('model');
export const ModelFieldListMetadataKey = Symbol('modelFieldList');
export const ModelFieldMetadataKey = Symbol('modelField');
export const ModelSchemaMetadataKey = Symbol('modelSchema');

export class Model {
	readonly errors: ModelErrorList;
	private validated: boolean;

	constructor() {
		this.errors = new ModelErrorList();
		this.validated = false;
	}

	clear(): void {
		this.validated = false;
		this.errors.clear();
	}

	validate(): boolean {
		if(this.validated) {
			return this.valid;
		}

		try {
			const schema = getModelSchema(this.constructor);
			schema.validateSync(this, { abortEarly: false });
			this.validated = true;
			return true;
		}
		catch(error) {
			if(error instanceof yup.ValidationError) {
				buildModelErrors((this as any).constructor, this.errors, error);
				this.validated = true;
				return false;
			}
			else {
				throw error;
			}	
		}
	}

	get valid(): boolean {
		if(!this.validated) {
			this.validate();
		}

		return this.errors.size === 0;
	}

	get invalid(): boolean {
		return !this.valid;
	}
}

export class ModelErrorList {
	private model: ModelError[];
	private properties: Map<string, ModelError[]>;

	constructor() {
		this.model = [];
		this.properties = new Map<string, ModelError[]>();
	}

	messages(): string[] {
		let messages = this.model.map(x => x.message);
		for(const list of this.properties.values()) {
			const errors = list.map(x => x.message);
			messages = messages.concat(errors);
		}

		return messages;
	}

	for(property: string): string[] {
		const list = this.properties.get(property) ?? [];
		const messages = list.map(x => x.message);
		return messages;
	}

	get(property: string): ModelError[] {
		return this.properties.get(property) ?? [];
	}

	add(error: ModelError, model?: boolean) {
		if(model) {
			this.model.push(error);
			return;
		}

		if(!error.property) {
			throw new Error(`error.property is required`);
		}

		let list = this.properties.get(error.property);
		if(!list) {
			list = [];
			this.properties.set(error.property, list);
		}

		list.push(error);
	}

	valid(property: string): boolean {
		const list = this.properties.get(property);
		return (list?.length ?? 0) === 0;
	}

	clear() {
		this.model = [];
		this.properties = new Map<string, ModelError[]>();
	}

	get size(): number {
		return this.properties.size;
	}
}

export function model() {
	return function(type: any) {
		let model: ModelMetadata = {
			fields: new Map<string, ModelFieldMetadata>()
		};
		Reflect.defineMetadata(ModelMetadataKey, model, type);

		const props = getClassPropertyList(type.prototype, ModelFieldListMetadataKey);
		for(const prop of props) {
			const field = Reflect.getMetadata(ModelFieldMetadataKey, type.prototype, prop);
			model.fields.set(prop, field);
		}
	}
}

export function field(options?: ModelFieldMetadata) {
	return function(type: any, property: string) {
		Reflect.defineMetadata(ModelFieldMetadataKey, options, type, property);
		
		const props = getClassPropertyList(type, ModelFieldListMetadataKey);
		props.push(property);
	}
}

export function getModelMetadata(type: any): ModelMetadata {
	const metadata: ModelMetadata = Reflect.getMetadata(ModelMetadataKey, type);
	if(!metadata) {
		throw new Error(`${type.name} requires @model() decorator`);
	}

	return metadata;
}

export function getModelSchema(type: any): yup.ObjectSchema<any> {
	let schema: yup.ObjectSchema<any> = Reflect.getMetadata(ModelSchemaMetadataKey, type);
	if(schema) {
		return schema;
	}

	const model: ModelMetadata = getModelMetadata(type);
	const properties: any = {};
	for(const [key, field] of model.fields.entries()) {
		if(!field) {
			continue;
		}
		
		const fieldSchema = getModelFieldSchema(field);
		properties[key] = fieldSchema;
	}

	schema = yup.object().shape(properties);
	Reflect.defineMetadata(ModelSchemaMetadataKey, schema, type);

	return schema;
}

export function getModelStringFieldSchema(field: ModelFieldMetadata): yup.StringSchema {
	let schema = yup.string();

	if(field.default) {
		schema = schema.default(field.default);
	}

	if(field.label) {
		schema = schema.label(field.label);
	}

	if(field.require) {
		schema = schema.required();
	}
	else {
		schema = schema.notRequired();
	}

	if(field.format) {
		switch(field.format) {
			case 'uuid': {
				schema = schema.uuid()
				break;
			}

			case 'url': {
				schema = schema.url();
				break;
			}

			case 'email': {
				schema = schema.email();
				break;
			}
		}
	}

	if(field.min) {
		schema = schema.min(field.min as number);
	}

	if(field.max) {
		schema = schema.max(field.max as number);
	}

	if(field.trim) {
		schema = schema.trim();
	}

	if(field.enum) {
		schema = schema.oneOf(field.enum as string[]);
	}

	if(field.pattern) {
		schema = schema.matches(field.pattern);
	}

	return schema;
}

export function getModelNumberFieldSchema(field: ModelFieldMetadata): yup.NumberSchema {
	let schema = yup.number();

	if(field.default) {
		schema = schema.default(field.default);
	}

	if(field.label) {
		schema = schema.label(field.label);
	}

	if(field.require) {
		schema = schema.required();
	}
	else {
		schema = schema.notRequired();
	}

	if(field.enum) {
		schema = schema.oneOf(field.enum as number[]);
	}

	if(field.min) {
		schema = schema.min(field.min as number);
	}

	if(field.max) {
		schema = schema.max(field.max as number);
	}

	if(field.lessThan) {
		schema = schema.lessThan(field.lessThan)
	}

	if(field.moreThan) {
		schema = schema.lessThan(field.moreThan);
	}

	if(field.positive) {
		schema = schema.positive();
	}

	if(field.negative) {
		schema = schema.negative();
	}

	if(field.integer) {
		schema = schema.integer();
	}

	return schema;
}

export function getModelBooleanFieldSchema(field: ModelFieldMetadata): yup.BooleanSchema {
	let schema = yup.bool();

	if(field.default) {
		schema = schema.default(field.default);
	}

	if(field.label) {
		schema = schema.label(field.label);
	}

	if(field.require) {
		schema = schema.required();
	}
	else {
		schema = schema.notRequired();
	}

	return schema;
}

export function getModelDateFieldSchema(field: ModelFieldMetadata): yup.DateSchema {
	let schema = yup.date();

	if(field.default) {
		schema = schema.default(field.default);
	}

	if(field.label) {
		schema = schema.label(field.label);
	}

	if(field.require) {
		schema = schema.required();
	}
	else {
		schema = schema.notRequired();
	}

	if(field.min) {
		schema = schema.min(field.min as Date);
	}

	if(field.max) {
		schema = schema.max(field.max as Date);
	}

	return schema;
}

export function getModelObjectFieldSchema(field: ModelFieldMetadata): yup.ObjectSchema<any> {
	let schema = getModelSchema(field.type);

	if(field.require) {
		schema = schema.required();
	}
	else {
		schema = schema.notRequired().default(undefined);
	}

	if(field.default) {
		schema = schema.default(field.default);
	}

	if(field.label) {
		schema = schema.label(field.label);
	}

	return schema;
}

export function getModelArrayFieldSchema(field: ModelFieldMetadata): yup.ArraySchema<any> {
	let schema: yup.ArraySchema<any>;

	switch(field.array) {
		case 'string': {
			schema = yup.array(yup.string());
			break;
		}

		case 'number': {
			schema = yup.array(yup.number());
			break;
		}

		case 'bool': {
			schema = yup.array(yup.bool());
			break;
		}
		
		case 'date': {
			schema = yup.array(yup.date());
			break;
		}

		default: {
			if(typeof field.array === 'function') {
				schema = yup.array(getModelSchema(field.array));
				break;
			}
			else {
				throw new Error(`unknown field.array=${field.array}`);
			}
		}
	}

	if(field.default) {
		schema = schema.default(field.default);
	}

	if(field.label) {
		schema = schema.label(field.label);
	}

	if(field.require) {
		schema = schema.required();
	}
	else {
		schema = schema.notRequired();
	}

	return schema;
}

export function getModelFieldSchema(field: ModelFieldMetadata): yup.BaseSchema {
	let schema: yup.BaseSchema;

	if(field.array) {
		schema = getModelArrayFieldSchema(field);
		return schema;
	}

	let type = field.type;
	if(!type) {
		if(field.format || field.pattern) {
			type = 'string';
		}

		if(field.enum && typeof field.enum[0] === 'string') {
			type = 'string';
		}
	}

	switch(type) {
		case 'string': {
			schema = getModelStringFieldSchema(field);
			break;			
		}

		case 'bool': {
			schema = getModelBooleanFieldSchema(field);
			break;
		}

		case 'date': {
			schema = getModelBooleanFieldSchema(field);
			break;
		}

		case 'number': {
			schema = getModelNumberFieldSchema(field);
			break;
		}

		default: {
			if(typeof type === 'function') {
				schema = getModelObjectFieldSchema(field);
			}
			else {
				throw new Error(`unknown field.type=${type}`);
			}
		}
	}

	return schema;
}

export function buildModelErrors(type: ClassType<any>, list: ModelErrorList, validation: yup.ValidationError): void {
	const metadata = getModelMetadata(type);

	if(validation.inner)  {
		for(const inner of validation.inner) {
			if(!inner.path) {
				throw new Error(`unable to get inner.path, error=${JSON.stringify(inner)}`);
			}

			const property = inner.path;
			const message = inner.message;
			const type = inner.type;
			const data = inner.value;
			const field = metadata.fields.get(property);
			if(!property) {
				throw new Error(`unable to find field=${property} in model metadata.fields`);
			}

			list.add({
				type,
				property,
				message,
				data,
				field
			})
		}
	}
}