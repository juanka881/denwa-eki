import * as metadata from './metadata';
import * as validation from './validation';
export { modelDecorator as model } from './metadata';
export { fieldDecorator as field } from './metadata';
export { validates } from './validation';
export { presense } from './validators/presense';
export { format } from './validators/format';
export { includes } from './validators/includes';

@metadata.modelDecorator()
export class Model {
	readonly errors: validation.ValidationErrorList;
	private validated: boolean;

	constructor() {
		this.errors = new validation.ValidationErrorList();
		this.validated = false;
	}

	clear(): void {
		this.validated = false;
		this.errors.clear();
	}

	validate(): boolean {
		this.validated = false;
		this.errors.clear();

		const { schema } = metadata.getModelMetadata(this.constructor);
		if(schema) {
			//TODO build up and parse model
			const errors = schema.validate(this);
			if(errors && errors.length > 0) {
				for(const error of errors) {
					this.errors.add(error);
				}
			}
		}
		
		this.validated = true;
		return this.errors.size === 0;
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