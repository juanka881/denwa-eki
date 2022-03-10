// import { assert } from 'chai';
// import { bind, Model, required, validation } from '../../src';

// function sut() {
// 	class PersonModel extends Model {
// 		@bind('string')
// 		name?: string;
	
// 		@bind('int')
// 		age?: number;
// 	}
	
// 	validation(PersonModel, x => {
// 		x.check('name', required());
// 	})

// 	return {
// 		PersonModel
// 	}
// }

// describe('bindings/validation', function() {	
// 	it('can set validation', () => {
// 		const s = sut();
// 		assert.isOk(s.PersonModel);
// 	})
// });