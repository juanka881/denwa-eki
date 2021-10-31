import { field, Model, model } from '../src';

describe('models', () => {
	it('can create model', () => {
		@model()
		class Address extends Model {
			@field({ pattern: /\d{5}/ })
			zip!: string;
		}

		@model()
		class Person extends Model {
			@field({ format: 'email', require: true })
			email!: string;

			@field({ type: 'string', require: true, max: 2, label: 'The Name' })
			name!: string;

			@field({ type: Address })
			address!: Address;
		}

		@model()
		class Foobar extends Model {
			@field({ type: Person, require: true })
			person!: Person;
		}

		const f = new Foobar();
		f.person = new Person();
		f.person.address = new Address();
		f.person.address.zip = 'foo';
		f.person.email = 'jogn@hogn.com';
		f.person.name = 'fxxx';
		
		console.log(f.valid);
		console.log(f.errors.messages());
		console.log(f.errors.for('person.address.zip'));
	});
});