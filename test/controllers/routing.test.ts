import { ts, it } from '../test';
import { getRoutePath } from '../../src/controllers/routing';
import { assert } from 'chai';

function path(expected: string, prefix: string, action: string) {
	assert.equal(getRoutePath(prefix, action), expected, `${prefix} + ${action} = ${expected}`);
}

ts(() => {
	it('can create path', function() {
		// no prefix, no action
		path('/', '/', '/');

		// no prefix, action = create
		path('/create', '/', 'create');
		path('/create', '/', '/create');
		path('/create', '/', 'create/');
		path('/create', '/', '/create/');

		// prefix = user, no action
		path('/user', 'user', '/');
		path('/user', '/user', '/');
		path('/user', 'user/', '/');
		path('/user', '/user/', '/');

		// prefix = user, action = create
		path('/user/create', 'user', 'create');
		path('/user/create', 'user', '/create');
		path('/user/create', 'user', 'create/');
		path('/user/create', 'user', '/create/');

		path('/user/create', '/user', 'create');
		path('/user/create', '/user', '/create');
		path('/user/create', '/user', 'create/');
		path('/user/create', '/user', '/create/');

		path('/user/create', 'user/', 'create');
		path('/user/create', 'user/', '/create');
		path('/user/create', 'user/', 'create/');
		path('/user/create', 'user/', '/create/');

		path('/user/create', '/user/', 'create');
		path('/user/create', '/user/', '/create');
		path('/user/create', '/user/', 'create/');
		path('/user/create', '/user/', '/create/');
	});
})