import 'reflect-metadata';
import { getConstructor } from '../utils/reflection';
import { ModelInfo } from './models';

/**
 * model info metadata key
 */
export const ModelInfoKey = 'eki:modelInfo';

/**
 * set model info for target object
 * @param object target object
 * @param modelInfo model info object
 */
export function setModelInfo(object: Object, modelInfo: ModelInfo) {
	const constructor = getConstructor(object);
	Reflect.defineMetadata(ModelInfoKey, modelInfo, constructor);
}

/**
 * merges a target objects parent model info properties
 * with the current model info properties, for model inheritance
 */
export function mergeModelInfo(object: Object, modelInfo: ModelInfo): void {
	const constructor = getConstructor(object);
	const parentModelInfo: ModelInfo | undefined = Reflect.getMetadata(ModelInfoKey, constructor);
	if(parentModelInfo) {
		for(const property of parentModelInfo.properties.values()) {
			modelInfo.properties.set(property.name, property);
		}
	}
}

/**
 * gets model info or throws if not found
 * @param object target object
 * @returns model info object
 */
export function getModelInfo(object: Object) {
	const modelInfo = tryGetModelInfo(object);
	if(!modelInfo) {
		throw new Error(`unable to get model info for object=${object}`);
	}

	return modelInfo;
}

/**
 * attempts to get model info
 * @param object target object
 * @returns model info or undefined if not found
 */
export function tryGetModelInfo(object: Object): ModelInfo | undefined {
	const constructor = getConstructor(object);
	if(!constructor) {
		return undefined;
	}

	const modelInfo = Reflect.getMetadata(ModelInfoKey, constructor);
	return modelInfo;
}