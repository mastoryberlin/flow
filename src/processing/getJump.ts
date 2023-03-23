//@ts-nocheck
export function getGlobalJumpEvent(json, visitor) {
    console.log('getGlobalJSON:', json, Object.keys(visitor.stateNodeByPath))
    const allStates = Object.keys(visitor.stateNodeByPath)
    const conditions = []
    for (const state of allStates) {
        let condition = {}
        condition.target = '#' + state
        condition.cond = {}
        condition.cond.type = 'equalsJumpTarget'
        condition.cond.comp = '#' + state
        conditions.push(condition)
    }
    console.log('conditions:', { _jump: conditions })
    return { _jump: conditions }
}