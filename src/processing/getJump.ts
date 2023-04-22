import type { DslVisitorWithDefaults } from "../chevrotain"

type ConditionalJumpTarget = {
    target: string
    internal: boolean
    cond: {
        type: 'equalsJumpTarget'
        comp: string
    }
}

export function getGlobalJumpEvent(visitor: DslVisitorWithDefaults) {
    const allStates = visitor.allStateNodes()
    const conditionalJumpTargets: ConditionalJumpTarget[] = []
    for (const state of allStates) {
        const p = [...state.path]
        let target = '#' + p.join('.')
        if (p.length > 1) {
            p.shift()
            p.reverse()
            for (let i = 0; i < p.length; i++) {
                const ancestor = visitor.stateNodeByPath[state.path.slice(0, p.length - i + 1).join('.')]
                if (ancestor.label) {
                    target = '#' + ancestor.label + state.path.slice(p.length - i + 1).map(t => '.' + t).join('')
                    break
                }
            }
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
    return { _jump: conditionalJumpTargets }
}