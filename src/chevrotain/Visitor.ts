import * as vscode from "../dsl/vscode";

import type { StateNodeCstChildren, TopLevelSequenceCstChildren, AlwaysTransitionCstChildren, SequenceCstChildren, TransitionTargetCstNode, TransitionTargetCstChildren, TransitionCstChildren, AlwaysTransitionCstNode, StateNodePathCstNode } from "./types";
import { useParser } from "./Parser";
import type * as dsl from "../dsl/types"
import type { CstNodeLocation } from "chevrotain";
import type { NLUContext } from "../dsl/types";
import { escapeDots } from "../util";

const parser = useParser()

const BaseVisitorWithDefaults = parser.getBaseCstVisitorConstructorWithDefaults()

const ROOT_NODE_ID = 'Current Episode'

export class DslVisitorWithDefaults extends BaseVisitorWithDefaults {
  stateNodeByPath = {} as Record<string, dsl.StateNode>
  stateNodeByLabel = {} as Record<string, dsl.StateNode>
  transitionsBySourcePath = {} as Record<string, dsl.Transition[]>
  childrenByPath = {} as Record<string, dsl.StateNode[]>
  actionsByPath = {} as Record<string, dsl.Directive[]>
  path = [ROOT_NODE_ID]

  constructor() {
    super()
    this.validateVisitor()
  }

  private getStateNodeNameDefinition(stateNode: StateNodeCstChildren) {
    if (stateNode.Directive) {
      return stateNode.Directive[0]
    } else /* if (stateNode.stateNodeName) */ {
      const ch = stateNode.stateNodeName![0].children
      const stateNodeNameDefinition = ch.StateNodeName || ch.EventName || ch.NumberLiteral
      return stateNodeNameDefinition![0]
    }
  }

  allStateNodes() { return Object.values(this.stateNodeByPath) }
  allTransitions() { return Object.values(this.transitionsBySourcePath).flat() }

  topLevelSequence(ctx: TopLevelSequenceCstChildren) {
    this.stateNodeByPath = {}
    this.stateNodeByLabel = {}
    this.transitionsBySourcePath = {}
    this.path = [ROOT_NODE_ID]
    this.childrenByPath = {}
    this.actionsByPath = {}
    // console.log('Entering topLevelSequence', ctx)
    this.visit(ctx.sequence)
  }

  sequence(ctx: SequenceCstChildren) {
    // console.log('Entering sequence', ctx)
    if (ctx.stateNode) { ctx.stateNode.forEach(n => { this.visit(n) }) }
    if (ctx.transition) { ctx.transition.forEach(n => { this.visit(n) }) }
  }

  stateNode(ctx: StateNodeCstChildren) {
    const nameDef = this.getStateNodeNameDefinition(ctx)

    // Get the name and full path ...
    const name = escapeDots(nameDef.image)
    const curPath = [...this.path]
    const fullPath = curPath.join('.') + '.' + name
    this.path.push(name)

    // ... the range of the name definition ...
    const { startOffset, startLine, startColumn, endLine, endColumn } = nameDef
    const range = new vscode.Range(startLine || 0, startColumn || 0, endLine || 0, endColumn || 0)
    
    // ... the label if applicable ...
    const label = ctx.Label ? ctx.Label[0].image.substring(1) : undefined

    // ... directive details if applicable ...
    let directive, nluContext, message
    if (ctx.Directive) {
      directive = ctx.Directive[0].payload
    } else {
      // ... message details if applicable ...
      const npcNames = ['nick', 'alicia', 'professor', 'victoria', 'maive']
      const mediaTypes = ['image', 'audio', 'video']
      const urlPattern = '\w+://\S+'
      const messagePattern = new RegExp(
        `(?:(${npcNames.join('|')})\\s+)?` +
        `(?:(${mediaTypes.join('|')}|${urlPattern})\\s+)?` +
        `"([^"]*)"\\W*$`,
        'i'
      )
      const messageMatch = name.match(messagePattern)
      if (messageMatch) { 
        const [_, senderString, mediaTypeOrUrl, textOrPlaceholder] = messageMatch
        const sender = senderString ? (senderString.substring(0, 1).toUpperCase() + senderString.substring(1)) as dsl.NPC : undefined

        if (mediaTypeOrUrl) {
          let type: dsl.MessageType, source: vscode.Uri | undefined
          // Media message
          if (mediaTypes.includes(mediaTypeOrUrl?.toLowerCase())) {
            type = mediaTypeOrUrl?.toLowerCase() as dsl.MessageType
          } else {
            type = 'image' // fallback unless overwritten
            const extension = mediaTypeOrUrl.match(/\.(\w+)$/)
            if (extension && extension[1]) {
              if (['png', 'jpg', 'gif'].includes(extension[1])) { type = 'image' }
              else if (['mp3', 'ogg', 'wav'].includes(extension[1])) { type = 'audio' }
              else if (['mp4'].includes(extension[1])) { type = 'video' }
            }
            source = vscode.Uri.parse(mediaTypeOrUrl)
          }
          message = { sender, type, source, title: textOrPlaceholder }
        } else {
          // Text message
          message = { sender, type: 'text' as dsl.MessageType, text: textOrPlaceholder }
        }
      }

      // ... NLU context details if applicable ...
      let nluContext: NLUContext | undefined
      if (ctx.LCurly && ctx.sequence) {
        const ch = ctx.sequence[0].children
        const subNodes = ch.stateNode
        if (subNodes) {
          const firstSubNodeNameDef = this.getStateNodeNameDefinition(subNodes[0].children)
          if (firstSubNodeNameDef.image === '?') {
            const subNodeNameStrings = subNodes.slice(1)
            .map(s => this.getStateNodeNameDefinition(s.children).image)

            const intentPattern = /^"([^"]+)"$/
            const intents = subNodeNameStrings
              .filter(s => intentPattern.test(s))
              .map(s => s.match(intentPattern)![1])

            const regExpPattern = /^\/([^\/]+)\/$/
            const regExps = subNodeNameStrings
              .filter(s => regExpPattern.test(s))
              .map(s => new RegExp(s.match(regExpPattern)![1]))

            nluContext = {
              intents,
              regExps,
              includes: []
            }
          }
        }  
      }  
      
      if (ctx.sequence && ctx.sequence.length) {
        this.visit(ctx.sequence[0])
      }
    }

    const stateNode: dsl.StateNode = {
      name,
      label,
      directive,
      nluContext,
      message,
      // regExp,
      parallel: !!ctx.LSquare,
      path: [...this.path],
      childNodes: this.childrenByPath[fullPath] || [],
      transitions: [],
      range,
      offset: startOffset
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
    const fullPath = this.path.join('.')
    // console.log('Entering transition', ctx, fullPath)
    let loc: any
    const type: dsl.TransitionType = ctx.eventTransition ? 'event' : ctx.afterTransition ? 'after' : 'always'

    const eventOrAfterTransition = ctx.eventTransition || ctx.afterTransition
    const isShortcutSyntax = eventOrAfterTransition && undefined === eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax[0].children.Arrow
    if (isShortcutSyntax) {
      // console.log('Encountered shortcut transition - skipping for now')
    } else {
      // console.log('Encountered -> transition:', fullPath, eventOrAfterTransition, isShortcutSyntax)
      let ch: TransitionTargetCstChildren
      if (eventOrAfterTransition) {
        ch = (eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax[0].children.transitionTarget as TransitionTargetCstNode[])[0].children
        loc = eventOrAfterTransition[0].location
      } else {
        const alwaysTransition = (ctx.alwaysTransition as AlwaysTransitionCstNode[])[0]
        ch = alwaysTransition.children.transitionTarget[0].children
        loc = alwaysTransition.location
      }
      let target: dsl.TransitionTarget
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
          const t = c.StateNodeName || c.EventName || c.TimeSpan || c.NumberLiteral
          return t ? t[0].image : ''
        })
        
        // Determine absolute path from this relative one
        const firstPart = relative[0]
        let absolute = [] as Array<string>
        for (let i = this.path.length; i > 1; i--) {
          const prefix = this.path.slice(0, i)
          const asString = prefix.join('.')
          const ch = this.childrenByPath[asString]
          if (ch && ch.some(s => s.name === firstPart)) {
            absolute = this.path.slice(0, i)
          }
        }

        const first = p[0].location as CstNodeLocation, last = p[p.length - 1].location as CstNodeLocation
        target = {
          path: [...absolute, ...relative],
          unknown: absolute.length < 1,
          range: new vscode.Range(first.startLine || 0, first.startColumn || 0, last.endLine || 0, last.endColumn || 0),
          offset: first.startOffset
        }
      } else {
        target = {
          unknown: true,
          range: new vscode.Range(0, 0, 0, 0),
          offset: 0,
        }
      }

      const range = new vscode.Range(loc.startLine, loc.startColumn, loc.endLine, loc.endColumn)
      const transition = {
        type,
        sourcePath: this.path,
        target,
        offset: loc.startOffset,
        range
      } as dsl.Transition

      switch (type) {
        case 'event':
          (transition as dsl.EventTransition).eventName = ctx.eventTransition![0].children.EventName[0].image
          break
        case 'after':
          {
            const c = ctx.afterTransition![0].children
            let ms = 3000 // fallback
            if (c.Ellipsis) {
              // Set timeout to multiple of 4sec, depending on the number of dots in the ellipsis
              ms = (c.Ellipsis[0].image.length - 1) * 4000
            } else if (c.LengthFunction) {
              // !!! TBD !!!
            } else if (c.NumberLiteral) {
              ms = parseInt(c.NumberLiteral[0].image)
            } else if (c.TimeSpan) {
              const image = c.TimeSpan[0].image
              const m = image.match(
                /(0|[1-9]\d*):(\d{2})|(0|[1-9]\d*)(\.\d+)?(?:\s*(?:(ms|milli(?:seconds?)?)|(s(?:ec(?:onds?)?)?)|(m(?:in(?:utes?)?)?)|(h(?:ours?)?))?\b)?/
              )
              if (m) {
                if (m[1] && m[2]) {
                  ms = (parseInt(m[1]) * 60 + parseInt(m[2])) * 1000
                } else if (m[3]) {
                  const v = parseFloat(m[3] + (m[4] || ''))
                  const factor = m[5] ? 1 : m[6] ? 1000 : m[7] ? 60000 : m[8] ? 3600000 : 1
                  ms = Math.floor(v * factor)
                }
              } else {
                ms = parseInt(image)
              }
            }
            (transition as dsl.AfterTransition).timeout = ms
          }
          break
        default: break
      }

      if (this.transitionsBySourcePath[fullPath]) {
        this.transitionsBySourcePath[fullPath].push(transition)
      } else {
        this.transitionsBySourcePath[fullPath] = [transition]
      }
    }
  }
}

const reusableVisitor = new DslVisitorWithDefaults()
export const useVisitor = () => reusableVisitor