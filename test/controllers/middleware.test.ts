import { ts, it } from '../test';
import { mockReq, mockRes } from 'sinon-express-mock';
import sinon, { SinonStub } from 'sinon';
import * as middleware from '../../src/controllers/middleware';
import * as context from '../../src/controllers/context';
import { RouteInfo } from '../../src/controllers/types';
import { assert } from 'chai';
import { ActionInfo } from '../../src/controllers/metadata';
import { TinyBuilder } from '@denwa/tiny';
import { nextTick } from '../../src/utils/promise';
import { redirect, view } from '../../src';
import * as handlersView from '../../src/controllers/handlers/view';
import * as handlersRedirect from '../../src/controllers/handlers/redirect';

class TestController {
	async index() {
		return 0;
	}
}

function sut() {
	const req = mockReq();
	const res = mockRes();
	const next = sinon.stub();
	const noop = sinon.stub();
	const route: RouteInfo = {
		controller: {
			constructor: TestController,
			actions: new Map<string, ActionInfo>(),
			name: 'TestController',
			prefix: 'tests'
		},
		action: {
			method: 'get',
			name: 'index',
			path: '/'
		},
		path: '/tests'
	}
	const builder = new TinyBuilder();
	builder.register({
		key: TestController,
		build() { return new TestController() }
	});
	const tiny = builder.getContainer();

	return {
		req,
		res,
		next,
		noop,
		route,
		builder,
		tiny
	}
}

ts(() => {
	const sandbox = sinon.createSandbox();
	afterEach(() => sandbox.restore());

	it('can wrap async function', async function () {
		const handler = sinon.stub().resolves();
		const wrapped = middleware.wrap(handler);
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();

		wrapped(req, res, next);
		await nextTick();

		const call = handler.getCall(0);
		assert.strictEqual(handler.callCount, 1);
		assert.strictEqual(call.args[0], req);
		assert.strictEqual(call.args[1], res);
		assert.strictEqual(call.args[2], next);
	});

	it('can wrap non-async function', async function () {
		const handler = sinon.stub();
		const wrapped = middleware.wrap(handler);
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();

		wrapped(req, res, next);
		await nextTick();
		const call = handler.getCall(0);

		assert.strictEqual(handler.callCount, 1);
		assert.strictEqual(call.args[0], req);
		assert.strictEqual(call.args[1], res);
		assert.strictEqual(call.args[2], next);
	});

	it('wrap() calls next if async function throws', async function () {
		const message = `handler error`;
		async function handler(req: any, res: any, next: any) {
			throw new Error(message);
		}

		const wrapped = middleware.wrap(handler);
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();

		wrapped(req, res, next);
		// need to check the assets on the next tick
		// to let the .catch() callback run		
		await nextTick();

		assert.strictEqual(next.callCount, 1);
		assert.strictEqual(next.getCall(0)?.args[0]?.message, message);
	});

	it('setRequestContext() sets new context on request', async function () {
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();
		const tiny: any = {}
		const handler = middleware.setRequestContext(tiny);

		handler(req, res, next);
		await nextTick();

		const ctx: context.ContextInstance = context.getData(req, context.ContextKey);

		assert.strictEqual(next.callCount, 1);
		assert.instanceOf(ctx, context.ContextInstance);
		assert.strictEqual(ctx.request, req);
		assert.strictEqual(ctx.response, res);
		assert.strictEqual(ctx.next, next);
		assert.strictEqual(ctx.tiny, tiny);
	});

	it('setRequestContext() can pull tiny instance from request.app', async function () {
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();
		const tiny: any = {};
		const handler = middleware.setRequestContext();

		(req as any).app = new Map<string, any>();
		req.app.set('tiny', tiny);

		handler(req, res, next);
		await nextTick();

		const ctx: context.ContextInstance = context.getData(req, context.ContextKey);

		assert.strictEqual(next.callCount, 1);
		assert.instanceOf(ctx, context.ContextInstance);
		assert.strictEqual(ctx.request, req);
		assert.strictEqual(ctx.response, res);
		assert.strictEqual(ctx.next, next);
		assert.strictEqual(ctx.tiny, tiny);

	});

	it('setRequestContext() throws if tiny instance cannot be found', async function () {
		const req = mockReq();
		const res = mockRes();
		const next = sinon.stub();
		const handler = middleware.setRequestContext();
		(req as any).app = new Map<string, any>();

		assert.throws(() => handler(req, res, next));
		await nextTick();

		assert.strictEqual(next.callCount, 0);
	});

	it('setControllerRoute() sets controller instance and route', function () {
		const { req, res, next, noop, route, tiny } = sut();
		const handler = middleware.setControllerRoute(route);

		middleware.setRequestContext(tiny)(req, res, noop);
		handler(req, res, next);

		const setRoute: RouteInfo = context.getData(req, middleware.RouteInfoKey);
		const setInstance: any = context.getData(req, middleware.ControllerInstanceKey);

		assert.strictEqual(next.callCount, 1, 'next() is called');
		assert.strictEqual(setRoute, route);
		assert.strictEqual(setInstance, route.instance);
		assert.instanceOf(setInstance, TestController);
	});

	it('setControllerRoute() throws if tiny returns undefined for resolve', function () {
		const { req, res, next, noop, route, builder } = sut();
		builder.register({
			key: TestController,
			build() { undefined }
		});
		const tiny = builder.getContainer();
		const handler = middleware.setControllerRoute(route);

		middleware.setRequestContext(tiny)(req, res, noop);
		assert.throws(() => handler(req, res, next));

		const setRoute: RouteInfo = context.getData(req, middleware.RouteInfoKey);
		const setInstance: any = context.getData(req, middleware.ControllerInstanceKey);

		assert.strictEqual(next.callCount, 0, 'next() is not called');
		assert.isUndefined(setRoute);
		assert.isUndefined(setInstance);
	});

	it('executeAction() calls controller action', async function () {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		const instance = route.instance as TestController;
		const value = 42;
		const stub = sinon.stub(instance, 'index').resolves(value);

		await middleware.executeAction(req, res, next);

		const result = context.getData(req, middleware.ActionResultKey);

		assert.strictEqual(next.callCount, 1, 'next() is called');
		assert.strictEqual(stub.callCount, 1, 'controller action is called');
		assert.strictEqual(result, value, 'action result is set');
	});

	it('executeAction() throws if controller instance is not set', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		const instance = route.instance as TestController;
		const value = 42;
		const stub = sinon.stub(instance, 'index').resolves(value);

		// delete controller instance
		context.deleteData(req, middleware.ControllerInstanceKey);

		await middleware.executeAction(req, res, next);

		assert.strictEqual(next.callCount, 1, 'next() is called');
		assert.instanceOf(next.getCall(0)?.args[0], Error);
		assert.strictEqual(stub.callCount, 0, 'controller action is called');
	});

	it('executeAction() throws if route info is not set', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		const instance = route.instance as TestController;
		const value = 42;
		const stub = sinon.stub(instance, 'index').resolves(value);

		// delete controller instance
		context.deleteData(req, middleware.RouteInfoKey);

		await middleware.executeAction(req, res, next);

		assert.strictEqual(next.callCount, 1, 'next() is called');
		assert.instanceOf(next.getCall(0)?.args[0], Error);
		assert.strictEqual(stub.callCount, 0, 'controller action is called');
	});

	it('handleResult() returns if not result is set', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);
		await middleware.executeAction(req, res, noop);
		await middleware.handleResult(req, res, next);

		const getContext = sandbox.spy(context, 'getContext');

		assert.strictEqual(next.callCount, 1, 'next() is called');

		// check if get context is not caleld
		// to make sure we are not processing result
		assert.strictEqual(getContext.callCount, 0, 'getContext() is not called');
	});

	it('handleResult() can process status code number', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		// make stub return a 200 status
		const instance = route.instance as TestController;
		const code = 200;
		const stub = sinon.stub(instance, 'index').resolves(code);
		const status = res.status = sinon.stub().callsFake(code => {
			res.statusCode = code;
			return res;
		});

		middleware.executeAction(req, res, noop);
		await nextTick();

		const getContext = sandbox.spy(context, 'getContext');
		middleware.handleResult(req, res, next);
		await nextTick();
		
		assert.strictEqual(stub.callCount, 1, 'action is called');
		assert.strictEqual(getContext.callCount, 1, 'getContext() is called');
		assert.strictEqual(status.callCount, 1, 'res.status() is called');
		assert.strictEqual(status.getCall(0)?.args[0], code, 'status code is set on response');
		assert.strictEqual(next.callCount, 1, 'next() is called');
	});

	it('handleResult() can handle view result', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		// make stub return a 200 status
		const instance = route.instance as TestController;
		const result = view('index');
		const stub = sinon.stub(instance, 'index').resolves(result as any);
		const ctx = context.getContext(req);

		await middleware.executeAction(req, res, noop);

		const getContext = sandbox.spy(context, 'getContext');
		const viewHandler = sandbox.stub(handlersView, 'viewHandler').resolves();
		await middleware.handleResult(req, res, next);
		
		assert.strictEqual(stub.callCount, 1, 'action is called');		
		assert.strictEqual(getContext.callCount, 1, 'getContext() is called');
		assert.strictEqual(viewHandler.callCount, 1, 'viewHandler() is called');

		const call = viewHandler.getCall(0);
		assert.strictEqual(call?.args[0], result, 'handler is passed result');
		assert.strictEqual(call?.args[1], ctx, 'handler is passed context');
		assert.strictEqual(next.callCount, 1, 'next() is called');
	});

	it('handleResult() can handle redirect result', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		// make stub return a 200 status
		const instance = route.instance as TestController;
		const result = redirect('/');
		const stub = sinon.stub(instance, 'index').resolves(result as any);
		const ctx = context.getContext(req);

		await middleware.executeAction(req, res, noop);

		const getContext = sandbox.spy(context, 'getContext');
		const viewHandler = sandbox.stub(handlersRedirect, 'redirectHandler').resolves();
		await middleware.handleResult(req, res, next);
		
		assert.strictEqual(stub.callCount, 1, 'action is called');		
		assert.strictEqual(getContext.callCount, 1, 'getContext() is called');
		assert.strictEqual(viewHandler.callCount, 1, 'viewHandler() is called');

		const call = viewHandler.getCall(0);
		assert.strictEqual(call?.args[0], result, 'handler is passed result');
		assert.strictEqual(call?.args[1], ctx, 'handler is passed context');
		assert.strictEqual(next.callCount, 1, 'next() is called');
	});

	it('handleResult() ignores undefined and null values', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		// make stub return a 200 status
		const instance = route.instance as TestController;
		const result = [undefined, null];
		const stub = sinon.stub(instance, 'index').resolves(result as any);

		await middleware.executeAction(req, res, noop);
		await middleware.handleResult(req, res, next);
		
		assert.strictEqual(stub.callCount, 1, 'action is called');
		assert.strictEqual(next.callCount, 1, 'next() is called');
	});

	it('handleResult() calls next(error) if result is invalid', async function() {
		const { req, res, next, noop, route, tiny } = sut();

		middleware.setRequestContext(tiny)(req, res, noop);
		middleware.setControllerRoute(route)(req, res, noop);

		// make stub return a 200 status
		const instance = route.instance as TestController;
		const result = 'foobar';
		const stub = sinon.stub(instance, 'index').resolves(result as any);
		
		await middleware.executeAction(req, res, noop);
		await middleware.handleResult(req, res, next);
		
		assert.strictEqual(stub.callCount, 1, 'action is called');		
		assert.strictEqual(next.callCount, 1, 'next() is called');
		assert.instanceOf(next.getCall(0)?.args[0], Error, 'next(error) called');
	});
})