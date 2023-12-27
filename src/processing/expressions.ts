import type * as dsl from "../dsl/types"
import type { DslVisitorWithDefaults } from "../chevrotain"

export const interpolationRegexp = /(?<=\$)\w+|(?<=\$\{)[^{}]*(?:(?:\{[^{}]*\}[^{}]*)*)(?=\})/g

export function extractDynamicExpressions(visitor: DslVisitorWithDefaults) {
  const statesWhichMayHaveExpressions = visitor.allStateNodes().filter(state =>
    state.assignVariables?.length
    || (state.transitions?.length && state.transitions.some(t => t.guard && 'condition' in t.guard))
    || (state.message?.type === 'text')
    || (state.directive?.name === 'push')
  )

  const expressions = new Set<string>()
  for (const state of statesWhichMayHaveExpressions) {
    for (const assignment of state.assignVariables ?? []) {
      expressions.add(assignment.value.trim())
    }

    for (const guardedTransition of state.transitions.filter(t => t.guard && 'condition' in t.guard)) {
      expressions.add((guardedTransition.guard as dsl.IfTransitionGuard).condition.trim())
    }

    if (state.message?.type === 'text') {
      const messageText = (state.message as dsl.TextMessage).text.replace(/`([^`]*?)`/g, "$${formula`$1`}")
      const matches = messageText.match(interpolationRegexp)
      for (const m of matches ?? []) {
        expressions.add(m.trim())
      }
    }
    else if (state.directive?.name === 'push') {
      const sepHelper = '&.&'
      const [_, expr] = state.directive.arg.replace(/\w+/, sepHelper).split(sepHelper)
      if (expr) {
        expressions.add(expr)
      }
    }
  }
  if (expressions.has('')) {
    expressions.delete('')
  }

  return Array.from(expressions)
}