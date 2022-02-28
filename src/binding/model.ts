import * as metadata from './metadata';

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

@metadata.modelDecorator()
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

		const modelMetadata = metadata.getModelMetadata(this.constructor);
		if(modelMetadata.validation) {
			const errors = new ModelErrorList();
			modelMetadata.validation.validate(this, errors);
			this.errors.merge(errors);
		}
		
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