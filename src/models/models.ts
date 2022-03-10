import { capitalCase } from 'change-case';
import { Constructor } from '../utils/reflection';
import { mergeModelInfo, setModelInfo, tryGetModelInfo } from './metadata';
import { validateModel, Validator } from './validation';
import { required } from './validators/required';

/**
 * model property types
 */
export type PropertyType = 'int' | 'number' | 'string' | 'bool' | 'date' | 'array' | 'object' | Constructor;

/**
 * model property information
 */
export interface PropertyInfo {
	type: PropertyType;
	name: string;
	require: boolean;
	label: string;
	rules: Validator[];
}

/**
 * model information
 */
export interface ModelInfo {
	name: string;
	constructor: Constructor;
	properties: Map<string, PropertyInfo>;
}

/**
 * model property info options
 */
export interface PropertyOptions {
	type: PropertyType;
	require?: boolean;
	label?: string;
	rules?: Validator | Validator[];
}

/**
 * model info options
 */
export interface ModelOptions<T> {
	properties: {
		[key in keyof T]?: PropertyType | PropertyOptions
	}
}

/**
 * sets a models information 
 * @param constructor model class constructor
 * @param options model information options
 */
export function model<T>(constructor: Constructor<T>, options: ModelOptions<T>) {
	const existing = tryGetModelInfo(constructor);
	if(existing) {
		throw new Error(`attempted to call model() multiple times on the same class=${constructor}`);
	}

	// crate starting model info object
	const modelInfo: ModelInfo = {
		constructor,
		name: constructor.name,
		properties: new Map<string, PropertyInfo>()
	}

	// merge parent properties if any
	mergeModelInfo(constructor, modelInfo);

	// build property info from current properties options
	for(const key of Object.keys(options.properties)) {
		let property: PropertyType | PropertyOptions = (options.properties as any)[key];
		let propertyInfo: PropertyInfo;

		if(typeof property === 'string') {
			propertyInfo = {
				type: property,
				label: capitalCase(key),
				name: key,
				require: false,
				rules: []
			}
		}
		else if(typeof property === 'object') {
			let rules: Validator[];
			if(property.rules) {
				if(Array.isArray(property.rules)) {
					rules = property.rules;
				}
				else {
					rules = [property.rules];
				}
			}
			else {
				rules = [];
			}

			if(property.require) {
				rules = [required(), ...rules];
			}

			propertyInfo = {
				type: property.type,
				label: property.label ?? capitalCase(key),
				name: key,
				require: property.require ?? false,
				rules
			};
		}
		else {
			throw new Error(`invalid property=${JSON.stringify(property)}`);
		}

		modelInfo.properties.set(key, propertyInfo);
	}

	setModelInfo(constructor, modelInfo);
}

/**
 * model error
 */
export interface ModelError {
	/**
	 * error type name
	 */
	name: string;

	/**
	 * property name, undefined if the error
	 * relates to the model as a whole
	 */
	property?: string;

	/**
	 * error message
	 */
	message: string;
}

/**
 * model error list
 */
export class ModelErrorList {
	private _count: number;
	private _modelErrors: ModelError[];
	private _propertyErrors: Map<string, ModelError[]>;

	constructor() {
		this._count = 0;
		this._modelErrors = [];
		this._propertyErrors = new Map<string, ModelError[]>();
	}

	get count(): number {
		return this._count;
	}

	messages(): string[] {
		let errors: string[] = this._modelErrors.map(x => x.message ?? '');
		
		for(const list of this._propertyErrors.values()) {
			if(list && list.length > 0) {
				errors = errors.concat(list.map(x => x.message ?? ''));
			}
		}

		return errors;
	}

	for(property?: string): string[] {
		if(!property) {
			const messages = this._modelErrors.map(x => x.message ?? '');
			return messages;
		}

		const list = this._propertyErrors.get(property);
		if(!list) {
			return [];
		}

		const messages = list.map(x => x.message ?? '');
		return messages;
	}

	get(property?: string): ModelError[] {
		if(!property) {
			return this._modelErrors;
		}

		const list = this._propertyErrors.get(property) ?? [];
		return list;
	}

	add(error: ModelError): void {
		if(!error.property) {
			this._modelErrors.push(error);
			return;
		}

		let list = this._propertyErrors.get(error.property);
		if(!list) {
			list = [];
			this._propertyErrors.set(error.property, list);
		}

		list.push(error);
		this._count += 1;
	}

	merge(errors: ModelErrorList): void {
		for(const error of errors._modelErrors) {
			this._modelErrors.push(error);
		}

		for(const property of errors._propertyErrors.keys()) {
			const list = errors._propertyErrors.get(property);
			if(!list || list.length === 0) {
				continue;
			}

			for(const error of list) {
				this.add(error);
			}
		}
	}

	valid(property?: string): boolean {
		if(!property) {
			return this._modelErrors.length === 0;
		}

		const len = this._propertyErrors.get(property)?.length ?? 0;
		return len === 0;
	}

	clear(): void {
		this._propertyErrors.clear();
		this._modelErrors = [];
	}
}

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
		this.validated = false;
		this.errors.clear();

		const errors = validateModel(this);
		this.errors.merge(errors);
		
		this.validated = true;
		return this.errors.count === 0;
	}

	get valid(): boolean {
		if(!this.validated) {
			this.validate();
		}

		return this.errors.count === 0;
	}

	get invalid(): boolean {
		return !this.valid;
	}
}