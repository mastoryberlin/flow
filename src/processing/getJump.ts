//@ts-nocheck
export function getGlobalJumpEvent(fqPath: String, visitor) {
    // console.log('Fqpath:', fqPath, ((!fqPath.startsWith('Episode')) && fqPath.split('.').length !== 1))
    // if ((fqPath.startsWith('Episode') && (fqPath.split('.').length !== 2)) || ((!fqPath.startsWith('Episode')) && fqPath.split('.').length !== 1)) {
    //     return null
    // }
    // console.log('getGlobalJSON:', fqPath, Object.keys(visitor.stateNodeByPath))
    const allStates = Object.keys(visitor.stateNodeByPath)
    const conditions = []
    for (const state of allStates) {
        let condition = {}
        condition.target = '#' + state
        condition.internal = false
        condition.cond = {}
        condition.cond.type = 'equalsJumpTarget'
        condition.cond.comp = '#' + state
        conditions.push(condition)
    }
    // console.log('conditions:', { _jump: conditions })
    return { _jump: conditions }
}