// ========================================================================================================================
// The Flow DSL Visitor adds a layer of semantic meaning on top of the Concrete Syntax Tree (CST) returned by the Parser.
// Where the output of the Parser is a tree of matched rules which as such don't provide much useful information on a piece
// of Flow DSL code beyond its syntactical correctness, the Visitor translates this tree into a set of easy-to-use fields 
// and functions, like `allStateNodes()` or `transitionBySourcePath`.
// ========================================================================================================================

import * as vscode from "../dsl/vscode";

import type { StateNodeCstChildren, TopLevelSequenceCstChildren, AlwaysTransitionCstChildren, SequenceCstChildren, TransitionTargetCstNode, TransitionTargetCstChildren, TransitionCstChildren, AlwaysTransitionCstNode, StateNodePathCstNode } from "./types";
import { useParser } from "./Parser";
import type * as dsl from "../dsl/types"
import type { CstNodeLocation, IToken } from "chevrotain";
import type { NLUContext } from "../dsl/types";
import { escapeDots, promptStateRegExp, unescapeDots } from "../util";

const parser = useParser()

const BaseVisitorWithDefaults = parser.getBaseCstVisitorConstructorWithDefaults()

const timeRegExpString = '(0|[1-9]\\d*):(\\d{2})|(0|[1-9]\\d*)(\\.\\d+)?(?:\\s*(?:(ms|milli(?:seconds?)?)|(s(?:ec(?:onds?)?)?)|(m(?:in(?:utes?)?)?)|(h(?:ours?)?))?\\b)?'
function toMilliseconds(m: RegExpMatchArray) {
  try {
    if (m[1] && m[2]) {
      return (parseInt(m[1]) * 60 + parseInt(m[2])) * 1000
    } else if (m[3]) {
      const v = parseFloat(m[3] + (m[4] || ''))
      const factor = m[5] ? 1 : m[6] ? 1000 : m[7] ? 60000 : m[8] ? 3600000 : 1
      return Math.floor(v * factor)
    }
  } catch (e) {
    console.warn('Error in toMilliseconds:', e)
    return 0
  }
  return 0 // fallback
}

export class DslVisitorWithDefaults extends BaseVisitorWithDefaults {
  rootNodeId = 'Current Episode'
  stateNodeByPath = {} as Record<string, dsl.StateNode>
  stateNodeByLabel = {} as Record<string, dsl.StateNode>
  transitionsBySourcePath = {} as Record<string, dsl.Transition[]>
  childrenByPath = {} as Record<string, dsl.StateNode[]>
  ambiguousStateNodes = [] as [string, vscode.Range][]
  path = [this.rootNodeId] // array to internally keep track of the currently traversed state node path

  constructor() {
    super()
    this.validateVisitor()
  }

  private getStateNodeNameDefinition(stateNode: StateNodeCstChildren) {
    if (stateNode.Directive) {
      return stateNode.Directive[0]
    } else if (stateNode.Assignment) {
      const assignments = stateNode.Assignment
      const first = assignments[0]
      const last = assignments[assignments.length - 1]
      return {
        image: assignments.map(a => a.image).join(''),
        startOffset: first.startOffset,
        startLine: first.startLine,
        startColumn: first.startColumn,
        endOffset: last.endOffset,
        endLine: last.endLine,
        endColumn: last.endColumn
      } as IToken
    } else if (stateNode.stateNodeName) {
      const ch = stateNode.stateNodeName![0].children
      const stateNodeNameDefinition = ch.StateNodeName || ch.NumberLiteral
      return stateNodeNameDefinition![0]
    }
  }

  private fixTransitionTargets() {
    for (const [sourcePathAsString, transitions] of Object.entries(this.transitionsBySourcePath)) {
      const sourcePath = sourcePathAsString.split('.')
      for (const t of transitions) {
        if (t.target && t.target.unknown) {
          if (t.target.path) {
            const relative = t.target.path
            // Determine absolute path from this relative one
            const firstPart = relative[0]
            // console.log('DETERMINING TRANSITION TARGET', sourcePath, relative, firstPart)
            let absolute = [] as Array<string>
            for (let i = sourcePath.length; i > 0; i--) {
              const prefix = sourcePath.slice(0, i)
              const asString = prefix.join('.')
              const ch = this.childrenByPath[asString]
              // console.log(`Iterating through path - i=${i}, path asString=${asString}, ch=`, ch)
              if (ch && ch.some(s => s.name === firstPart)) {
                absolute = sourcePath.slice(0, i)
                // console.log(`Found a match for prefix ${prefix} - setting absolute=`, absolute)
                t.target.path = [...absolute, ...relative]
                t.target.unknown = false
                break
              }
            }
          } else {
            const line = t.range.start.line
            const ancestors = this.allStateNodes().filter(s => s.range.start.line < line && s.range.end.line > line)
            let stateNodeSiblings: dsl.StateNode[]
            let transitionSiblings: dsl.Transition[]
            if (ancestors.length) {
              ancestors.sort((a, b) => b.range.start.line - a.range.start.line)
              const parent = ancestors[0]
              stateNodeSiblings = parent.childNodes
              transitionSiblings = this.transitionsBySourcePath[parent.path.join('.')] || []
            } else {
              stateNodeSiblings = this.topLevelStateNodes()
              transitionSiblings = this.transitionsBySourcePath[''] || []
            }
            // console.log('PROCESSING SHORTCUT TRANSITION', line)
            const siblings = [...stateNodeSiblings, ...transitionSiblings]
            // console.log('Siblings: ', siblings)
            const isTargetOnSameLine = t.type === 'after' && (t as dsl.AfterTransition).dots
            const precedingStateNodeSiblings = stateNodeSiblings.filter(s => s.range.end.line < line)
            const subsequentStateNodeSiblings = stateNodeSiblings.filter(s => s.range.start.line >= (isTargetOnSameLine ? line : line + 1))
            const precedingSiblings = siblings.filter(s => s.range.end.line < line)
            const subsequentSiblings = siblings.filter(s => s.range.start.line >= (isTargetOnSameLine ? line : line + 1))
            const precedingStateNode = precedingStateNodeSiblings.find(s => !precedingSiblings.some(t => t.range.end.line > s.range.end.line))
            const followingStateNode = subsequentStateNodeSiblings.find(s => !subsequentSiblings.some(t => t.range.start.line < s.range.start.line))
            // console.log('Preceding State Node:', precedingStateNode)
            // console.log('Following State Node:', followingStateNode)
            // console.log('Subsequent Siblings: ', subsequentSiblings)
            // console.log('Subsequent State Node Siblings: ', subsequentStateNodeSiblings)
            if (precedingStateNode && followingStateNode) {
              // console.log('SETTING THE SOURCE TO', precedingStateNode.path)
              t.sourcePath = precedingStateNode.path
              // console.log('SETTING THE TARGET TO', followingStateNode.path)
              t.target.path = followingStateNode.path
              t.target.unknown = false
              const asString = t.sourcePath.join('.')
              if (this.transitionsBySourcePath[asString]) {
                this.transitionsBySourcePath[asString].push(t)
              } else {
                this.transitionsBySourcePath[asString] = [t]
              }
            }
          }
        }
      }
    }
  }

  private markLastStateNodeAsFinal() {
    const stateNodes = this.allStateNodes()
    const stateNodeInLastVisitedLine = stateNodes.find(s => {
      const transitions = this.transitionsBySourcePath[s.path.join('.')]
      if (transitions?.length || s.childNodes.length || s.parallel) { return false }
      const line = s.range.start.line
      for (const t of stateNodes) {
        if (t.range.start.line > line) { return false }
      }
      return true
    })

    if (stateNodeInLastVisitedLine) {
      stateNodeInLastVisitedLine.final = true
    }
  }

  allStateNodes() {
    return Object.values(this.stateNodeByPath) as dsl.StateNode[]
  }

  topLevelStateNodes() {
    return this.allStateNodes().filter(s => !s.path || s.path.length <= 2) as dsl.StateNode[]
  }

  allTransitions() {
    // Due to the way it is created, this.transitionsBySourcePath may contain a value for the empty string key ''.
    // When indexing this.transitionsBySourcePath directly that doesn't hurt, but here we have to filter it out.
    const withSource = Object.fromEntries(
      Object.entries(this.transitionsBySourcePath)
        .filter(([sourcePath]) => sourcePath !== '')
    )
    return Object.values(withSource).flat() as dsl.Transition[]
  }

  topLevelSequence(ctx: TopLevelSequenceCstChildren) {
    this.stateNodeByPath = {}
    this.stateNodeByLabel = {}
    this.ambiguousStateNodes = []
    this.transitionsBySourcePath = {}
    this.path = [this.rootNodeId]
    this.childrenByPath = {}
    this.visit(ctx.sequence)
    this.fixTransitionTargets()
    this.markLastStateNodeAsFinal()
  }

  sequence(ctx: SequenceCstChildren) {
    // console.log('Entering sequence', ctx)
    if (ctx.stateNode) { ctx.stateNode.forEach(n => { this.visit(n) }) }
    if (ctx.transition) { ctx.transition.forEach(n => { this.visit(n) }) }
  }

  stateNode(ctx: StateNodeCstChildren) {
    const nameDef = this.getStateNodeNameDefinition(ctx)

    if (!nameDef) { return }
    // Get the name and full path ...
    const name = escapeDots(nameDef.image)
    const curPath = [...this.path]
    const fullPath = curPath.join('.') + '.' + name
    this.path.push(name)

    // ... the range of the name definition ...
    let { startOffset, startLine, startColumn, endLine, endColumn } = nameDef
    const closing = ctx.RCurly || ctx.RSquare
    if (closing) {
      endLine = closing[0].endLine
      endColumn = closing[0].endColumn
    }
    const range = new vscode.Range(startLine || 0, startColumn || 0, endLine || 0, endColumn || 0)

    // ... the label if applicable ...
    const label = ctx.Label ? ctx.Label[0].image.substring(1) : undefined

    // ... directive details if applicable ...
    let directive, nluContext: NLUContext | undefined, message, assignVariables
    if (ctx.Directive) {
      directive = ctx.Directive[0].payload
    } else if (ctx.Assignment) {
      assignVariables = ctx.Assignment.map(a => a.payload)
    } else {
      // ... message details if applicable ...
      const allSenderAliases = {
        'Nick': ['nick', 'nic', 'nik'],
        'Alicia': ['alicia', 'alcia', 'ali'],
        'VZ': ['vz', 'vz|', 'victoria'],
        'Professor': ['dr camarena', 'prof', 'dr| camarena', 'prof|', 'professor']
      }
      const mediaTypes = ['image', 'audio', 'video']
      const urlPattern = '\\w+://\\S+'
      const messagePattern = new RegExp(
        `^(?:((?:(?!"|${mediaTypes.join('|')})(?:\\S(?!://))+\\s+)+))?` +
        `(?:(${mediaTypes.join('|')}|${urlPattern})\\s+)?` +
        `"([^"]*)"(?:\\s+(${timeRegExpString}))?$`,
        'di'
      )
      const messageMatch = name.match(messagePattern)
      if (messageMatch) {
        const [_, alias, mediaTypeOrUrl, textOrPlaceholder, showcaseTimeout] = messageMatch
        const sender = alias ? Object.entries(allSenderAliases).find(([_, aliases]) => aliases.includes(alias.trim().toLowerCase()))?.[0] as dsl.NPC : undefined

        if (mediaTypeOrUrl) {
          let type: dsl.MessageType, source: vscode.Uri | undefined, showcase: number | undefined
          // Media message
          if (mediaTypes.includes(mediaTypeOrUrl.toLowerCase())) {
            type = mediaTypeOrUrl.toLowerCase() as dsl.MessageType
          } else {
            type = 'image' // fallback unless overwritten
            
            const url = unescapeDots(mediaTypeOrUrl)
            const extension = url.match(/\.(\w+)$/)
            
            if (extension && extension[1]) {
              if (['png', 'jpg', 'gif'].includes(extension[1])) { type = 'image' }
              else if (['mp3', 'ogg', 'wav'].includes(extension[1])) { type = 'audio' }
              else if (['mp4'].includes(extension[1])) { type = 'video' }
            }
            
            if (showcaseTimeout) {
              const showcaseMatch = showcaseTimeout.match(new RegExp(timeRegExpString))
              showcase = toMilliseconds(showcaseMatch!)
            }
            
            source = vscode.Uri.parse(url)
          }
          message = { sender, type, source, title: unescapeDots(textOrPlaceholder), showcase }
        } else {
          // Text message
          //@ts-ignore
          const [startOffset, endOffset] = messageMatch.indices![3]
          message = {
            sender,
            type: 'text' as dsl.MessageType,
            text: unescapeDots(textOrPlaceholder),
            startOffset, endOffset
          }
        }
      }

      // ... NLU context details if applicable ...
      if (ctx.LCurly && ctx.sequence) {
        const ch = ctx.sequence[0].children
        const subNodes = ch.stateNode
        if (subNodes) {
          const firstSubNodeNameDef = this.getStateNodeNameDefinition(subNodes[0].children)
          if (firstSubNodeNameDef && promptStateRegExp.test(firstSubNodeNameDef.image)) {
            const subNodeNameStrings = subNodes.slice(1)
              .map(s => this.getStateNodeNameDefinition(s.children)?.image)

            const intentPattern = /^"([^"]+)"$/
            const intents = subNodeNameStrings
              .filter(s => s && intentPattern.test(s))
              .map(s => s!.match(intentPattern)![1])

            const regExpPattern = /^\/([^\/]+)\/$/
            const regExps = subNodeNameStrings
              .filter(s => s && regExpPattern.test(s))
              .map(s => new RegExp(s!.match(regExpPattern)![1]))

            nluContext = {
              intents,
              keepIntentsEnabled: firstSubNodeNameDef.image === '??',
              regExps,
              includes: []
            }
          }
        }
      }
    }

    if (ctx.sequence && ctx.sequence.length) {
      this.visit(ctx.sequence[0])
    }

    const stateNode: dsl.StateNode = {
      name,
      label,
      directive,
      nluContext,
      message,
      assignVariables,
      // regExp,
      parallel: !!ctx.LSquare,
      path: [...this.path],
      childNodes: this.childrenByPath[fullPath] || [],
      transitions: this.transitionsBySourcePath[fullPath] || [],
      range,
      offset: startOffset
    }

    if (this.stateNodeByPath[fullPath]) {
      this.ambiguousStateNodes.push([fullPath, range])
    }
    this.stateNodeByPath[fullPath] = stateNode
    if (label) {
      this.stateNodeByLabel[label] = stateNode
    }

    const curPathAsString = curPath.join('.')
    if (this.childrenByPath[curPathAsString]) {
      this.childrenByPath[curPathAsString].push(stateNode)
    } else {
      this.childrenByPath[curPathAsString] = [stateNode]
    }

    this.path = curPath
  }

  transition(ctx: TransitionCstChildren) {
    const type: dsl.TransitionType = ctx.eventTransition ? 'event' : ctx.afterTransition ? 'after' : 'always'
    const eventOrAfterTransition = ctx.eventTransition || ctx.afterTransition
    const loc = (eventOrAfterTransition || ctx.alwaysTransition!)[0].location!
    const isShortcutSyntax = eventOrAfterTransition && eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax?.[0].children.Arrow === undefined
    let sourcePath: dsl.FqStateNodePath | undefined
    let target: dsl.TransitionTarget
    let byPathKey: string
    if (isShortcutSyntax) {
      target = {
        unknown: true,
        range: new vscode.Range(0, 0, 0, 0),
        offset: 0,
      }
      byPathKey = ''
    } else {
      sourcePath = this.path
      byPathKey = sourcePath.join('.')
      let ch: TransitionTargetCstChildren
      if (eventOrAfterTransition) {
        ch = eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax[0].children.transitionTarget![0].children
      } else {
        ch = ctx.alwaysTransition![0].children.transitionTarget[0].children
      }
      if (ch.Label) {
        const l = ch.Label[0]
        target = {
          label: l.image.substring(1),
          unknown: false,
          range: new vscode.Range(l.startLine || 0, l.startColumn || 0, l.endLine || 0, l.endColumn || 0),
          offset: l.startOffset
        }
      } else if (ch.stateNodePath) {
        const p = (ch.stateNodePath as StateNodePathCstNode[])[0].children.stateNodeName
        const relative = p.map(part => {
          const c = part.children
          const t = c.StateNodeName || c.TimeSpan || c.NumberLiteral
          return t ? t[0].image : ''
        })

        const first = p[0].location as CstNodeLocation, last = p[p.length - 1].location as CstNodeLocation
        target = {
          path: relative,
          unknown: true,
          range: new vscode.Range(first.startLine!, first.startColumn!, last.endLine!, last.endColumn!),
          offset: first.startOffset
        }
      } else {
        target = {
          unknown: true,
          range: new vscode.Range(0, 0, 0, 0),
          offset: 0,
        }
      }
    }
    let guard: dsl.TransitionGuard | undefined
    const guardNode = (eventOrAfterTransition ? eventOrAfterTransition[0] : ctx.alwaysTransition![0]).children.guard?.[0].children
    if (guardNode) {
      if (guardNode.When) {
        if (guardNode.Label) {
          guard = { refState: { label: guardNode.Label![0].image.substring(1) } } as dsl.WhenTransitionGuard
        } else if (guardNode.stateNodePath) {
          const ch = guardNode.stateNodePath[0].children.stateNodeName[0].children
          const sub = ch.NumberLiteral || ch.TimeSpan || ch.StateNodeName
          if (sub) {
            const path = sub[0].image.split(/\s*\|\s*/)
            guard = { refState: { path } } as dsl.WhenTransitionGuard
          }
        }
      } else if (guardNode.IfCondition) {
        const condition = guardNode.IfCondition[0].image.replace(/^if\s*/, '')
        guard = { condition } as dsl.IfTransitionGuard
      }
    }

    const range = new vscode.Range(loc.startLine!, loc.startColumn!, loc.endLine!, loc.endColumn!)
    const transition = {
      type,
      sourcePath,
      target,
      guard,
      offset: loc.startOffset,
      range
    } as dsl.Transition

    switch (type) {
      case 'event':
        {
          const m = ctx.eventTransition![0].children.OnEvent[0].image.match(/\bon\s+(\S+)\b/)
          if (m) {
            (transition as dsl.EventTransition).eventName = m[1]
          }
        }
        break
      case 'after':
        {
          const c = ctx.afterTransition![0].children
          let ms = 3000 // fallback
          if (c.Ellipsis) {
            // Set timeout to multiple of 4sec, depending on the number of dots in the ellipsis
            const factor = c.Ellipsis[0].image.length - 1
            if (factor) {
              ms = factor * 4000
            } else {
              ms = 80
            }
          } else if (c.LengthFunction) {
            // !!! TBD !!!
          } else if (c.NumberLiteral) {
            ms = parseInt(c.NumberLiteral[0].image)
          } else if (c.TimeSpan) {
            const image = c.TimeSpan[0].image
            const m = image.match(new RegExp(timeRegExpString))
            if (m) {
              ms = toMilliseconds(m)
            } else {
              ms = parseInt(image)
            }
          }
          (transition as dsl.AfterTransition).dots = !!c.Ellipsis;
          (transition as dsl.AfterTransition).timeout = ms
        }
        break
      default: break
    }

    if (this.transitionsBySourcePath[byPathKey]) {
      this.transitionsBySourcePath[byPathKey].push(transition)
    } else {
      this.transitionsBySourcePath[byPathKey] = [transition]
    }
  }
}

const reusableVisitor = new DslVisitorWithDefaults()
export const useVisitor = () => reusableVisitor