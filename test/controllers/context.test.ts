import { ts, it } from '../test';
import { mockReq, mockRes } from 'sinon-express-mock';
import sinon from 'sinon';
import * as context from '../../src/controllers/context';
import { assert } from 'chai';
import { model } from '../../src';
import { symbolKey, TinyBuilder } from '@denwa/tiny';

class TestModel {
	username!: string;
	password!: string;
}

model(TestModel, {
	properties: {
		username: 'string',
		password: 'string'
	}
})

ts(function() {
	it('can set/get data', function() {
		const req = mockReq();
		const key = 'foo';
		const value = 42;

		context.setData(req, key, value);
		const data = context.getData(req, key);

		assert.strictEqual(data, value);
	});

	it('returns undefined if data is not set', function() {
		const req = mockReq();
		const key = 'foo';

		const data = context.getData(req, key);

		assert.isUndefined(data);
	});

	it('returns undefined, if data is deleted', function() {
		const req = mockReq();
		const key = 'foo';
		const value = 42;

		context.setData(req, key, value);
		const dataAfterSet = context.getData(req, key);

		context.deleteData(req, key);
		const dataAfterDelete = context.deleteData(req, key);

		assert.strictEqual(dataAfterSet, value);
		assert.isUndefined(dataAfterDelete);
	});

	it('noop if delete key does not exists', function() {
		const req = mockReq();
		const key = 'foo';

		context.deleteData(req, key);
	});

	it('throws if context is not found', function() {
		const req = mockReq();
		assert.throws(() => context.getContext(req));
	})

	it('can get context from request', function() {
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();
		const tiny: any = {};
		const expectedContext = new context.ContextInstance(req, res, next, tiny);
		context.setData(req, context.ContextKey, expectedContext);

		const actualContext = context.getContext(req);
		assert.instanceOf(actualContext, context.ContextInstance);
		assert.strictEqual(actualContext, expectedContext);
	});

	it('can bind model', function() {
		const opts = {
			body: {
				username: 'foo',
				password: '42'
			}
		}
		const req = mockReq(opts);
		const res = mockRes();
		const next = sinon.stub();
		const tiny: any = {};
		const ctx = new context.ContextInstance(req, res, next, tiny);

		context.setData(req, context.ContextKey, ctx);

		const model = ctx.bind(TestModel);
		const modelSecondCallValue = ctx.bind(TestModel);

		assert.strictEqual(model.username, opts.body.username);
		assert.strictEqual(model.password, opts.body.password);
		assert.strictEqual(model, modelSecondCallValue);
	});

	it('can resolve value', function() {
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();
		const key = symbolKey<number>('foo');
		const builder = new TinyBuilder();
		const value = 42;
		builder.registerValue(key, value);		
		const tiny = builder.getContainer();
		const ctx = new context.ContextInstance(req, res, next, tiny);

		context.setData(req, context.ContextKey, ctx);

		const actualValue = ctx.resolve(key);

		assert.strictEqual(actualValue, value);
	});
});