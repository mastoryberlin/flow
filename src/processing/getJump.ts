import type { DslVisitorWithDefaults } from "../chevrotain"

type ConditionalJumpTarget = {
    target: string
    internal: boolean
    cond: {
        type: 'equalsJumpTarget'
        comp: string
    }
}

export function getGlobalJumpEvent(fqPath: String, visitor: DslVisitorWithDefaults) {
    const allStates = visitor.allStateNodes()
    const conditionalJumpTargets: ConditionalJumpTarget[] = []
    for (const state of allStates) {
        let target = '#'
        if (state.label) {
            target += state.label
        } else {
            target += state.path.join('.')
        }

        const t: ConditionalJumpTarget = {
            target,
            internal: false,
            cond: {
                type: 'equalsJumpTarget',
                comp: target,
            },
        }            
        conditionalJumpTargets.push(t)
    }
    // console.log('conditions:', { _jump: conditions })
    return { _jump: conditionalJumpTargets }
}