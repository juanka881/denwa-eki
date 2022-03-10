import request from 'supertest';
import express from 'express';
import { action, Context, controller, createRouteBuilder, view, setRequestContext, model, Model } from '../../src';
import { Log } from '@denwa/log';
import { TinyBuilder } from '@denwa/tiny';
import path from 'path';

class TestController {
	dirname = __dirname;

	@action()
	async index(ctx: Context) {
		return view('index');
	}

	@action()
	async http404(ctx: Context) {
		return view('res:404');
	}

	@action()
	async doCreate(ctx: Context) {
		const model = ctx.bind(TestModel);
		return view('create', { model });
	}
}

class TestModel extends Model {
	username!: string;
	password!: string;
}

model(TestModel, {
	properties: {
		username: {
			type: 'string',
			require: true
		},
		password: {
			type: 'string',
			require: true
		}
	}
})

describe('controllers/main', function() {
	it('can render index', function(done) {
		const builder = new TinyBuilder();
		builder.register({
			key: TestController, 
			build() { return new TestController() }
		})

		const log = new Log();
		//log.instance.level = 'debug';
		const tiny = builder.getContainer();
		const app = express();
		app.use(setRequestContext(tiny));
		
		const route = createRouteBuilder(app, log);
		route.controller(TestController);

		request(app)
			.get('/tests')
			.expect('Content-Type', /html/)
			.expect(200, done);
	});

	it('can render res:404', function(done) {
		const builder = new TinyBuilder();
		builder.register({
			key: TestController, 
			build() { return new TestController() }
		})

		const log = new Log();
		//log.instance.level = 'debug';
		const tiny = builder.getContainer();
		const app = express();
		app.set('res', path.join(__dirname, 'res'));
		app.use(setRequestContext(tiny));
		
		const route = createRouteBuilder(app, log);
		route.controller(TestController);

		request(app)
			.get('/tests/http404')
			.expect('Content-Type', /html/)
			.expect(200, done);
	});

	it('can bind model', function(done) {
		const builder = new TinyBuilder();
		builder.register({
			key: TestController, 
			build() { return new TestController() }
		})

		const log = new Log();
		//log.instance.level = 'debug';
		const tiny = builder.getContainer();
		const app = express();
		app.set('res', path.join(__dirname, 'res'));
		app.use(setRequestContext(tiny));
		
		const route = createRouteBuilder(app, log);
		route.controller(TestController);

		request(app)
			.post('/tests/create')
			.send({ username: 'juanka', password: 'foo' })
			.expect('Content-Type', /html/)
			.expect(200)
			.then(res => {
				console.log(res.text);
			})
			.then(done);
	});
})