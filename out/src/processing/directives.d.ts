declare type TransitionTargetFunction<A extends DirectiveArgumentsTypes> = (args: A, root: string) => string;
declare type TransitionDef<A extends DirectiveArgumentsTypes> = TransitionTargetFunction<A> | {
    target: TransitionTargetFunction<A>;
    cond: ImplementationRef<A>;
};
declare type ImplementationRef<A extends DirectiveArgumentsTypes> = {
    type: string;
} | {
    [other: string]: (args: A) => any;
    [notAnArrayLike: number]: never;
} | ((args: A) => {
    type: string;
} | {
    [other: string]: any;
    [notAnArrayLike: number]: never;
});
declare type DirectiveArgumentInfo<T> = T | {
    value: T;
    optional?: boolean;
};
export declare type DirectiveArgumentsTypes = object;
declare type DirectiveArgumentProcessor<A extends DirectiveArgumentsTypes> = (s: string) => {
    [name in keyof A]: DirectiveArgumentInfo<A[name]>;
};
export declare type DirectiveInfo<A extends DirectiveArgumentsTypes> = {
    args: DirectiveArgumentProcessor<A>;
    always?: TransitionDef<A>;
    entry?: ImplementationRef<A>;
    exit?: ImplementationRef<A>;
    invoke?: ImplementationRef<A>;
};
export declare function defineDirective<A extends DirectiveArgumentsTypes>(d: DirectiveInfo<A>): DirectiveInfo<A>;
export {};
