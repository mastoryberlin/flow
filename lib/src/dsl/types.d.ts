import type * as vscode from './vscode';
export declare type Range = vscode.Range;
export declare type Position = vscode.Position;
export declare type Uri = vscode.Uri;
export interface SemanticUnit {
    range: Range;
    offset: number;
}
export declare type MessageType = 'text' | 'image' | 'audio' | 'video';
export interface BaseMessage {
    sender?: string;
    type: MessageType;
}
export interface TextMessage extends BaseMessage {
    text: string;
    startOffset: number;
    endOffset: number;
}
export interface MediaMessage extends BaseMessage {
    title: string;
    source?: Uri;
    showcase?: number;
}
export declare type Message = TextMessage | MediaMessage;
export interface NLUContext {
    intents: Intent[];
    keepIntentsEnabled: boolean;
    freeText?: boolean;
    contextId?: string | null;
    regExps: RegExp[];
    includes: FqStateNodePath[];
}
export declare type Intent = string;
export interface VariableAssignment {
    varName: string;
    value: string;
}
export interface Directive {
    name: string;
    arg: string;
}
export interface StateNode extends SemanticUnit {
    name: string;
    path: FqStateNodePath;
    parallel: boolean;
    label?: string;
    checkpoint?: number;
    directive?: Directive;
    assignVariables?: VariableAssignment[];
    message?: Message;
    regExp?: RegExp;
    nluContext?: NLUContext;
    childNodes: StateNode[];
    transitions: Transition[];
    final?: boolean;
}
export declare type FqStateNodePath = Array<string>;
export declare type Label = string;
export interface TargetStateRef extends SemanticUnit {
    path?: FqStateNodePath;
    label?: Label;
}
export interface TransitionTarget extends TargetStateRef {
    unknown: boolean;
}
export declare type TransitionGuard = IfTransitionGuard | WhenTransitionGuard;
export interface IfTransitionGuard {
    condition: string;
}
export interface WhenTransitionGuard {
    refState: TargetStateRef;
}
export declare type TransitionType = 'event' | 'after' | 'always';
export interface BaseTransition extends SemanticUnit {
    type: TransitionType;
    sourcePath?: FqStateNodePath;
    target?: TransitionTarget;
    guard?: TransitionGuard;
}
export declare type Event = string;
export interface EventTransition extends BaseTransition {
    eventName: Event;
}
export interface AfterTransition extends BaseTransition {
    timeout: number;
    dots: boolean;
}
export interface AlwaysTransition extends BaseTransition {
}
export declare type Transition = EventTransition | AfterTransition | AlwaysTransition;
