import { assert } from 'chai';
import { bind, model } from '../../src';
import { getModelMetadata, hasModelMetadata } from '../../src/binding/metadata';
import { bindModel } from '../../src/binding/binding';

function sut() {
	class EmptyClass {

	}

	@model()
	class ModelDecorator {

	}

	@model()
	class ModelAndFieldsDecorators {
		@bind('string')
		prop1a!: string;

		@bind('string')
		prop1b!: string;
	}

	class ExtEmptyClass extends EmptyClass {

	}

	class ExtModelDecorator extends ModelDecorator {

	}

	class ExtModelAndFieldsDecorators extends ModelAndFieldsDecorators {

	}

	class ExtModelAndFieldsDecoratorsWithProp extends ModelAndFieldsDecorators {
		@bind('string')
		prop2a!: string;
	}

	@model()
	class ExtModelAndFieldsDecoratorsWithModelDecorator extends ModelAndFieldsDecorators {
		@bind('string')
		prop2a!: string;
	}

	class ExtModelDecoratorLevel3 extends ExtModelDecorator {

	}

	class ExtModelAndFieldsDecoratorsLevel3 extends ExtModelAndFieldsDecorators {
		
	}

	class ExtModelAndFieldsDecoratorsWithPropLevel3 extends ExtModelAndFieldsDecoratorsWithProp {
		@bind('string')
		prop3a!: string;
	}

	@model()
	class ExtModelAndFieldsDecoratorsWithModelDecoratorLevel3 extends ExtModelAndFieldsDecoratorsWithModelDecorator {
		@bind('string')
		prop3a!: string;
	}

	@model()
	class IgnoreNonDecoratedFields {
		@bind('string')
		prop1a!: string;

		prop1b!: string;
	}

	class ExtIgnoreNonDecoratedFields extends IgnoreNonDecoratedFields {

	}

	class ExtIgnoreNonDecoratedFieldsWithProps extends IgnoreNonDecoratedFields {
		@bind('string')
		prop2a!: string;

		prop2b!: string;
	}

	@model()
	class ExtIgnoreNonDecoratedFieldsWithModelDecorator extends IgnoreNonDecoratedFields {

	}

	class ExtIgnoreNonDecoratedFieldsLevel3 extends ExtIgnoreNonDecoratedFields {

	}

	@model()
	class Base {
		@bind('string')
		prop1!: string;

		@bind('number')
		prop2!: number;
	}

	class Child extends Base {
		@bind('string')
		prop3!: string;
	}

	return {
		EmptyClass, 
		ModelDecorator,
		ModelAndFieldsDecorators,
		ExtEmptyClass,
		ExtModelDecorator,
		ExtModelAndFieldsDecorators,
		ExtModelAndFieldsDecoratorsWithProp,
		ExtModelAndFieldsDecoratorsWithModelDecorator,
		ExtModelDecoratorLevel3,
		ExtModelAndFieldsDecoratorsLevel3,
		ExtModelAndFieldsDecoratorsWithPropLevel3,
		ExtModelAndFieldsDecoratorsWithModelDecoratorLevel3,
		IgnoreNonDecoratedFields,
		ExtIgnoreNonDecoratedFields,
		ExtIgnoreNonDecoratedFieldsWithProps,
		ExtIgnoreNonDecoratedFieldsWithModelDecorator,
		ExtIgnoreNonDecoratedFieldsLevel3,
		Base,
		Child
	}
}

describe('bindings/models', function() {	
	it('EmptyClass has no metadata', function() {
		const { EmptyClass } = sut();
		assert.isFalse(hasModelMetadata(EmptyClass));
	});

	it('ModelDecorator has empty metadata', function() {
		const { ModelDecorator } = sut();
		const metadata = getModelMetadata(ModelDecorator);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 0);
	});

	it('ModelAndFieldsDecorators has 2 fields', function() {
		const { ModelAndFieldsDecorators } = sut();
		const metadata = getModelMetadata(ModelAndFieldsDecorators);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 2);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
	});

	it('ExtEmptyClass has no metadata', function() {
		const { ExtEmptyClass } = sut();
		assert.isFalse(hasModelMetadata(ExtEmptyClass));
	});

	it('ExtModelDecorator has empty metadata', function() {
		const { ExtModelDecorator } = sut();
		const metadata = getModelMetadata(ExtModelDecorator);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 0);
	});

	it('ExtModelAndFieldsDecorators has 2 fields', function() {
		const { ExtModelAndFieldsDecorators } = sut();
		const metadata = getModelMetadata(ExtModelAndFieldsDecorators);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 2);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
	});

	it('ExtModelAndFieldsDecoratorsWithProp has 3 fields', function() {
		const { ExtModelAndFieldsDecoratorsWithProp } = sut();
		const metadata = getModelMetadata(ExtModelAndFieldsDecoratorsWithProp);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 3);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
		assert.strictEqual(metadata.properties.get('prop2a')?.property, 'prop2a');
	});

	it('ExtModelAndFieldsDecoratorsWithModelDecorator has 3 fields', function() {
		const { ExtModelAndFieldsDecoratorsWithModelDecorator } = sut();
		const metadata = getModelMetadata(ExtModelAndFieldsDecoratorsWithModelDecorator);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 3);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
		assert.strictEqual(metadata.properties.get('prop2a')?.property, 'prop2a');
	});

	it('ExtModelDecoratorLevel3 has empty metadata', function() {
		const { ExtModelDecoratorLevel3 } = sut();
		const metadata = getModelMetadata(ExtModelDecoratorLevel3);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 0);
	});

	it('ExtModelAndFieldsDecoratorsLevel3 has 2 fields', function() {
		const { ExtModelAndFieldsDecoratorsLevel3 } = sut();
		const metadata = getModelMetadata(ExtModelAndFieldsDecoratorsLevel3);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 2);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
	});

	it('ExtModelAndFieldsDecoratorsWithPropLevel3 has 4 fields', function() {
		const { ExtModelAndFieldsDecoratorsWithPropLevel3 } = sut();
		const metadata = getModelMetadata(ExtModelAndFieldsDecoratorsWithPropLevel3);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 4);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
		assert.strictEqual(metadata.properties.get('prop2a')?.property, 'prop2a');
		assert.strictEqual(metadata.properties.get('prop3a')?.property, 'prop3a');
	});

	it('ExtModelAndFieldsDecoratorsWithModelDecoratorLevel3 has 4 fields', function() {
		const { ExtModelAndFieldsDecoratorsWithModelDecoratorLevel3 } = sut();
		const metadata = getModelMetadata(ExtModelAndFieldsDecoratorsWithModelDecoratorLevel3);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 4);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, 'prop1b');
		assert.strictEqual(metadata.properties.get('prop2a')?.property, 'prop2a');
		assert.strictEqual(metadata.properties.get('prop3a')?.property, 'prop3a');
	});

	it('IgnoreNonDecoratedFields has 1 field', function() {
		const { IgnoreNonDecoratedFields } = sut();
		const metadata = getModelMetadata(IgnoreNonDecoratedFields);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 1);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, undefined);
	});

	it('ExtIgnoreNonDecoratedFields has 1 field', function() {
		const { ExtIgnoreNonDecoratedFields } = sut();
		const metadata = getModelMetadata(ExtIgnoreNonDecoratedFields);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 1);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, undefined);
	});

	it('ExtIgnoreNonDecoratedFieldsWithProps has 2 fields', function() {
		const { ExtIgnoreNonDecoratedFieldsWithProps } = sut();
		const metadata = getModelMetadata(ExtIgnoreNonDecoratedFieldsWithProps);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 2);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, undefined);
		assert.strictEqual(metadata.properties.get('prop2a')?.property, 'prop2a');
		assert.strictEqual(metadata.properties.get('prop2b')?.property, undefined);
	});	

	it('ExtIgnoreNonDecoratedFieldsWithModelDecorator has 1 field', function() {
		const { ExtIgnoreNonDecoratedFieldsWithModelDecorator } = sut();
		const metadata = getModelMetadata(ExtIgnoreNonDecoratedFieldsWithModelDecorator);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 1);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, undefined);
	});

	it('ExtIgnoreNonDecoratedFieldsLevel3 has 1 field', function() {
		const { ExtIgnoreNonDecoratedFieldsLevel3 } = sut();
		const metadata = getModelMetadata(ExtIgnoreNonDecoratedFieldsLevel3);

		assert.isUndefined(metadata.validation);
		assert.strictEqual(metadata.properties.size, 1);
		assert.strictEqual(metadata.properties.get('prop1a')?.property, 'prop1a');
		assert.strictEqual(metadata.properties.get('prop1b')?.property, undefined);
	});

	it('can parse model', function() {
		const { Base } = sut();
		const data = {
			body: {
				prop1: 'hello',
				prop2: 42
			}
		}

		const base = new Base();
		const result = bindModel(base, data as any);
		assert.strictEqual(result.prop1, data.body.prop1);
		assert.strictEqual(result.prop2, data.body.prop2);
	});

	it('can parse child model', function() {
		const { Child } = sut();
		const data = {
			body: {
				prop1: 'hello',
				prop2: 42,
				prop3: 'world'
			}
		}

		const child = new Child();
		const result = bindModel(child, data as any);
		assert.strictEqual(result.prop1, data.body.prop1);
		assert.strictEqual(result.prop2, data.body.prop2);
		assert.strictEqual(result.prop3, data.body.prop3);
	});
});