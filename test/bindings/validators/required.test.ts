// import { assert } from 'chai';
// import { bind, Model, ModelErrorList } from '../../../src';
// import { RequiredValidator } from '../../../src/binding/validators/required';

// function sut() {
// 	class TestModel extends Model {
// 		@bind('string')
// 		value?: string;
// 	}
// 	const model = new TestModel();
// 	model.value = 'hello';
// 	const errors = new ModelErrorList();
// 	const validator = new RequiredValidator('value');

// 	return {
// 		model,
// 		errors,
// 		validator,
// 	}
// }

// describe('binding/validators/required', function() {
// 	it('valid', function() {
// 		const s = sut();
// 		s.validator.validate(s.model, s.errors);

// 		assert.strictEqual(s.errors.count, 0);
// 	});

// 	it('invalid', function() {
// 		const s = sut();
// 		s.model.value = undefined as any;
// 		s.validator.validate(s.model, s.errors);

// 		assert.strictEqual(s.errors.count, 1);
// 		assert.strictEqual(s.errors.get('value')[0].name, 'required');
// 	});
// });