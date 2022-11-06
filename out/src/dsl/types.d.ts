import type * as vscode from './vscode';
export interface SemanticUnit {
    range: vscode.Range;
    offset: number;
}
export declare type NPC = 'Alicia' | 'Nick' | 'Victoria' | 'Professor' | 'Maive';
export declare type MessageType = 'text' | 'image' | 'audio' | 'video';
export interface BaseMessage {
    sender?: NPC;
    type: MessageType;
}
export interface TextMessage extends BaseMessage {
    text: string;
}
export interface MediaMessage extends BaseMessage {
    title: string;
    source?: vscode.Uri;
}
export declare type Message = TextMessage | MediaMessage;
export interface NLUContext {
    intents: Intent[];
    regExps: RegExp[];
    includes: FqStateNodePath[];
}
export declare type Intent = string;
export interface VariableAssignment {
    varName: string;
    value: string;
}
export interface Action {
    name: string;
    arg: string;
}
export interface StateNode extends SemanticUnit {
    name: string;
    path: FqStateNodePath;
    label?: string;
    message?: Message;
    parallel: boolean;
    regExp?: RegExp;
    assignVariables?: VariableAssignment[];
    actions?: Action[];
    nluContext?: NLUContext;
    childNodes: StateNode[];
    transitions: Transition[];
}
export declare type FqStateNodePath = Array<string>;
export declare type Label = string;
export interface TransitionTarget extends SemanticUnit {
    path?: FqStateNodePath;
    label?: Label;
    unknown: boolean;
}
export declare type TransitionGuard = IfTransitionGuard | WhenTransitionGuard;
export interface IfTransitionGuard {
    condition: string;
}
export interface WhenTransitionGuard {
    refState: FqStateNodePath;
}
export declare type TransitionType = 'event' | 'after' | 'always';
export interface BaseTransition extends SemanticUnit {
    type: TransitionType;
    sourcePath: FqStateNodePath;
    target?: TransitionTarget;
    guard?: TransitionGuard;
}
export declare type Event = string;
export interface EventTransition extends BaseTransition {
    eventName: Event;
}
export interface AfterTransition extends BaseTransition {
    timeout: Number;
}
export interface AlwaysTransition extends BaseTransition {
}
export declare type Transition = EventTransition | AfterTransition | AlwaysTransition;
