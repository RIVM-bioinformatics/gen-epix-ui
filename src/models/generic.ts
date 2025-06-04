// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type UnwrapArray<T> = T extends Array<infer U> ? U : T;
