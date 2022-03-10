import { assert } from 'chai';
import { action, controller } from '../../src';
import * as metadata from '../../src/controllers/metadata';
import { ts, it } from '../test';

function sut() {
	class TestController {
		@action()
		async index() {
			return 200
		}
	}

	class EmptyController {

	}

	return {
		TestController,
		EmptyController
	}
}

ts(() => {
	it('can set/get controller info', function() {
		const { TestController } = sut();
		metadata.setControllerInfo(TestController);
		const info = metadata.tryGetControllerInfo(TestController);

		assert.isOk(info);
		assert.strictEqual(info?.name, 'TestController');
		assert.strictEqual(info?.actions.size, 1);
		assert.strictEqual(info?.constructor, TestController);
		assert.strictEqual(info?.prefix, 'tests');
	});

	it('getControllerInfo() throws if controller info is not set', function() {
		const { EmptyController } = sut();
		assert.throws(() => metadata.getControllerInfo(EmptyController));
	});

	it('can override controller prefix', function() {
		const prefix = 'foobar';
		const { TestController } = sut();
		metadata.setControllerInfo(TestController, { prefix });
		const info = metadata.tryGetControllerInfo(TestController);

		assert.isOk(info);
		assert.strictEqual(info?.name, 'TestController');
		assert.strictEqual(info?.actions.size, 1);
		assert.strictEqual(info?.constructor, TestController);
		assert.strictEqual(info?.prefix, prefix);
	});

	it('prefix is not overriden if not set', function() {
		const { TestController } = sut();
		metadata.setControllerInfo(TestController, {});
		const info = metadata.tryGetControllerInfo(TestController);

		assert.isOk(info);
		assert.strictEqual(info?.name, 'TestController');
		assert.strictEqual(info?.actions.size, 1);
		assert.strictEqual(info?.constructor, TestController);
		assert.strictEqual(info?.prefix, 'tests');
	});

	it('can get known http method & action', function() {
		const result = {
			show: metadata.getKnownAction('show'),
			index: metadata.getKnownAction('index'),
			create: metadata.getKnownAction('create'),
			doCreate: metadata.getKnownAction('doCreate'),
			createDone: metadata.getKnownAction('createDone'),
			edit: metadata.getKnownAction('edit'),
			doEdit: metadata.getKnownAction('doEdit'),
			editDone: metadata.getKnownAction('editDone'),
			delete: metadata.getKnownAction('delete'),
			doDelete: metadata.getKnownAction('doDelete'),
			deleteDone: metadata.getKnownAction('deleteDone'),
			unknown: metadata.getKnownAction('unknown'),
		}

		assert.deepEqual(result.show, ['get', '/:id']);
		assert.deepEqual(result.index, ['get', '/']);
		assert.deepEqual(result.create, ['get', '/create']);
		assert.deepEqual(result.doCreate, ['post', '/create']);
		assert.deepEqual(result.createDone, ['get', '/create/done']);
		assert.deepEqual(result.edit, ['get', '/:id/edit']);
		assert.deepEqual(result.doEdit, ['patch', '/:id/edit']);
		assert.deepEqual(result.editDone, ['get', '/edit/done']);
		assert.deepEqual(result.delete, ['get', '/:id/delete']);
		assert.deepEqual(result.doDelete, ['delete', '/:id/delete']);
		assert.deepEqual(result.deleteDone, ['get', '/delete/done']);
		assert.deepEqual(result.unknown, [undefined, undefined]);
	});

	it('controller() decorator sets prefix', function() {
		@controller()
		class UserController {

		}

		@controller('foobar')
		class FooController {

		}

		const userInfo = metadata.tryGetControllerInfo(UserController);
		const fooInfo = metadata.tryGetControllerInfo(FooController);

		assert.isOk(userInfo);
		assert.strictEqual(userInfo?.name, 'UserController');
		assert.strictEqual(userInfo?.actions.size, 0);
		assert.strictEqual(userInfo?.constructor, UserController);
		assert.strictEqual(userInfo?.prefix, 'users');

		assert.isOk(fooInfo);
		assert.strictEqual(fooInfo?.name, 'FooController');
		assert.strictEqual(fooInfo?.actions.size, 0);
		assert.strictEqual(fooInfo?.constructor, FooController);
		assert.strictEqual(fooInfo?.prefix, 'foobar');
	});

	it('action() can override method and path', function() {
		class UserController {
			@action('post')
			async list() {

			}

			@action('head', 'headers')
			async getHeaders() {

			}
		}

		const info = metadata.tryGetControllerInfo(UserController);
		assert.isOk(info);
		assert.strictEqual(info?.actions.size, 2);
		assert.deepEqual(info?.actions.get('list'), {
			method: 'post',
			name: 'list',
			path: 'list'
		});
		assert.deepEqual(info?.actions.get('getHeaders'), {
			method: 'head',
			name: 'getHeaders',
			path: 'headers'
		});
	});
});