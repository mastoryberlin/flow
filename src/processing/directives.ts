type TransitionTargetFunction<A extends DirectiveArgumentsTypes> = (args: A, root: string) => string
type TransitionDef<A extends DirectiveArgumentsTypes> = TransitionTargetFunction<A> | {
  target: TransitionTargetFunction<A>
  cond: ImplementationRef<A>
}

type ImplementationRef<A extends DirectiveArgumentsTypes> = {
  type: string
} | {
  [other: string]: (args: A) => any
  [notAnArrayLike: number]: never;
} | ((args: A) => {
  type: string
} | {
  [other: string]: any
  [notAnArrayLike: number]: never;
})

type DirectiveArgumentInfo<T> = T | {
  value: T
  optional?: boolean
}
export type DirectiveArgumentsTypes = object
type DirectiveArgumentProcessor<A extends DirectiveArgumentsTypes> = (s: string) => { [name in keyof A]: DirectiveArgumentInfo<A[name]> }

export type DirectiveInfo<A extends DirectiveArgumentsTypes> = {
  args: DirectiveArgumentProcessor<A>
  always?: TransitionDef<A>
  entry?: ImplementationRef<A>
  exit?: ImplementationRef<A>
  invoke?: ImplementationRef<A>
}

export function defineDirective<A extends DirectiveArgumentsTypes>(d: DirectiveInfo<A>) {
  return d
}