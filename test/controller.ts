import { assert } from 'chai';
import { controller, getControllerMetadata } from '../src'


describe('controllers', () => {
	it('can get controller filename', () => {
		@controller()
		class TestController {

		}

		const metadata = getControllerMetadata(TestController);
		assert.equal(metadata.filename, __filename);
	})
})