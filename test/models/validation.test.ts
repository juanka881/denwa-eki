import { assert } from 'chai';
import { field, Model, presense, validation } from '../../src';
import { parseModel } from '../../src/models/parsing';
import { PresenseValidator } from '../../src/models/validators/presense';

function sut() {
	class Person extends Model {
		@field({ type: 'string' })
		name!: string;

		@field({ type: 'number' })
		age!: number;
	}

	return {
		Person
	}
}

describe('models/validation', function() {
	it('validates presense', function() {
		const { Person } = sut();
		validation(Person, validate => {
			validate('name', presense());
		});

		const modelWithName = parseModel(Person, { 
			body: {
				name: 'hello'
			}
		});

		const modelWithoutName = parseModel(Person, {
			body: {
				name: undefined
			}
		})
		
		assert.isTrue(modelWithName.valid, 'name is present');
		assert.isFalse(modelWithoutName.valid, 'name is not present');

		console.log(modelWithoutName.errors.messages());
	});
});

describe('models/validators/presense', function() {
	it('ok when valid', function() {
		const validator = new PresenseValidator({
			properties: ['value']
		});
		const data = {
			value: 'hello'
		}

		const result = validator.validate(data);

		assert.isUndefined(result);
	});

	it('error when invalid', function() {
		const validator = new PresenseValidator({
			properties: ['value']
		});
		const data = {
			value: undefined
		}

		const result = validator.validate(data);

		assert.isArray(result);
		assert.strictEqual(result![0].name, 'presense');
	});
});