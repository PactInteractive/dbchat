export type DeepPartial<T> = T extends object & { length?: never } ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type ValueOf<T> = T[keyof T];
