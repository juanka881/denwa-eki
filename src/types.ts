export interface ClassType<T = any> {
    new(...args: any[]): T;
}

export const TinyKey = 'tiny';
export const ContextKey = 'context';
export const ControllerConfigKey = 'controllerConfig';
export const ControllerKey = 'controller';
export const ControllerActionResultKey = 'actionResult';