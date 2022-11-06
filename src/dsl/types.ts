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
}  

export interface MediaMessage extends BaseMessage {
  title: string
  source?: Uri
}  

export type Message = TextMessage | MediaMessage

export interface NLUContext {
  intents: Intent[]
  regExps: RegExp[]
  includes: FqStateNodePath[]
}

export type Intent = string

export interface VariableAssignment {
  varName: string
  value: string
}

export interface Action {
  name: string
  arg: string
}

export interface StateNode extends SemanticUnit {
  name: string
  path: FqStateNodePath
  label?: string
  message?: Message
  parallel: boolean
  regExp?: RegExp
  assignVariables?: VariableAssignment[]
  actions?: Action[]
  nluContext?: NLUContext
  childNodes: StateNode[]
  transitions: Transition[]
}

export type FqStateNodePath = Array<string>
export type Label = string

export interface TransitionTarget extends SemanticUnit {
  path?: FqStateNodePath
  label?: Label
  unknown: boolean
}

export type TransitionGuard = IfTransitionGuard | WhenTransitionGuard

export interface IfTransitionGuard {
  condition: string
}

export interface WhenTransitionGuard {
  refState: FqStateNodePath
}

export type TransitionType = 'event' | 'after' | 'always'

export interface BaseTransition extends SemanticUnit {
  type: TransitionType
  sourcePath: FqStateNodePath
  target?: TransitionTarget
  guard?: TransitionGuard
}

export type Event = string // TODO: Replace by a list of actually available app events

export interface EventTransition extends BaseTransition {
  eventName: Event
}

export interface AfterTransition extends BaseTransition {
  timeout: Number
}

export interface AlwaysTransition extends BaseTransition {
}

export type Transition = EventTransition | AfterTransition | AlwaysTransition