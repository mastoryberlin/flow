import type * as vscode from './vscode'

export type Range = vscode.Range
export type Position = vscode.Position
export type Uri = vscode.Uri

export interface SemanticUnit {
  range: Range
  offset: number
}

export type NPC = 'Alicia' | 'Nick' | 'Victoria' | 'Professor' | 'Maive'

export type MessageType = 'text' | 'image' | 'audio' | 'video'

export interface BaseMessage {
  sender?: NPC
  type: MessageType
}

export interface TextMessage extends BaseMessage {
  text: string
  startOffset: number
  endOffset: number
}

export interface MediaMessage extends BaseMessage {
  title: string
  source?: Uri
  showcase?: number
}  

export type Message = TextMessage | MediaMessage

export interface NLUContext {
  intents: Intent[]
  keepIntentsEnabled: boolean
  regExps: RegExp[]
  includes: FqStateNodePath[]
}

export type Intent = string

export interface VariableAssignment {
  varName: string
  value: string
}

export interface Directive {
  name: string
  arg: string
}

export interface StateNode extends SemanticUnit {
  name: string
  path: FqStateNodePath
  parallel: boolean
  label?: string
  directive?: Directive
  assignVariables?: VariableAssignment[]
  message?: Message
  regExp?: RegExp
  nluContext?: NLUContext
  childNodes: StateNode[]
  transitions: Transition[]
  final?: boolean
}

export type FqStateNodePath = Array<string>
export type Label = string

export interface TargetStateRef extends SemanticUnit {
  path?: FqStateNodePath
  label?: Label
}

export interface TransitionTarget extends TargetStateRef {
  unknown: boolean
}

export type TransitionGuard = IfTransitionGuard | WhenTransitionGuard

export interface IfTransitionGuard {
  condition: string
}

export interface WhenTransitionGuard {
  refState: TargetStateRef
}

export type TransitionType = 'event' | 'after' | 'always'

export interface BaseTransition extends SemanticUnit {
  type: TransitionType
  sourcePath?: FqStateNodePath
  target?: TransitionTarget
  guard?: TransitionGuard
}

export type Event = string // TODO: Replace by a list of actually available app events

export interface EventTransition extends BaseTransition {
  eventName: Event
}

export interface AfterTransition extends BaseTransition {
  timeout: number
  dots: boolean
}

export interface AlwaysTransition extends BaseTransition {
}

export type Transition = EventTransition | AfterTransition | AlwaysTransition