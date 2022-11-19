// ====================================================================
// DO NOT MODIFY THIS FILE MANUALLY!
// These type definitions are auto-generated based on Parser.ts
// To regenerate, run the "gen-types" script from package.json
// ====================================================================

import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface TopLevelSequenceCstNode extends CstNode {
  name: "topLevelSequence";
  children: TopLevelSequenceCstChildren;
}

export type TopLevelSequenceCstChildren = {
  sequence: SequenceCstNode[];
};

export interface SequenceCstNode extends CstNode {
  name: "sequence";
  children: SequenceCstChildren;
}

export type SequenceCstChildren = {
  stateNode?: StateNodeCstNode[];
  transition?: TransitionCstNode[];
  blanks?: BlanksCstNode[];
};

export interface StateNodeCstNode extends CstNode {
  name: "stateNode";
  children: StateNodeCstChildren;
}

export type StateNodeCstChildren = {
  Label?: IToken[];
  Directive?: IToken[];
  stateNodeName?: StateNodeNameCstNode[];
  LCurly?: IToken[];
  blanks?: (BlanksCstNode)[];
  sequence?: (SequenceCstNode)[];
  RCurly?: IToken[];
  LSquare?: IToken[];
  RSquare?: IToken[];
};

export interface StateNodeNameCstNode extends CstNode {
  name: "stateNodeName";
  children: StateNodeNameCstChildren;
}

export type StateNodeNameCstChildren = {
  StateNodeName?: IToken[];
  NumberLiteral?: IToken[];
  TimeSpan?: IToken[];
};

export interface StateNodePathCstNode extends CstNode {
  name: "stateNodePath";
  children: StateNodePathCstChildren;
}

export type StateNodePathCstChildren = {
  stateNodeName: (StateNodeNameCstNode)[];
  Pipe?: IToken[];
};

export interface GuardCstNode extends CstNode {
  name: "guard";
  children: GuardCstChildren;
}

export type GuardCstChildren = {
  IfCondition?: IToken[];
  When?: IToken[];
  stateNodePath?: StateNodePathCstNode[];
  Label?: IToken[];
};

export interface TransitionCstNode extends CstNode {
  name: "transition";
  children: TransitionCstChildren;
}

export type TransitionCstChildren = {
  eventTransition?: EventTransitionCstNode[];
  afterTransition?: AfterTransitionCstNode[];
  alwaysTransition?: AlwaysTransitionCstNode[];
};

export interface TransitionTargetCstNode extends CstNode {
  name: "transitionTarget";
  children: TransitionTargetCstChildren;
}

export type TransitionTargetCstChildren = {
  stateNodePath?: StateNodePathCstNode[];
  Label?: IToken[];
};

export interface EventTransitionCstNode extends CstNode {
  name: "eventTransition";
  children: EventTransitionCstChildren;
}

export type EventTransitionCstChildren = {
  OnEvent: IToken[];
  guard?: GuardCstNode[];
  transitionTargetOrShortcutSyntax: TransitionTargetOrShortcutSyntaxCstNode[];
};

export interface AfterTransitionCstNode extends CstNode {
  name: "afterTransition";
  children: AfterTransitionCstChildren;
}

export type AfterTransitionCstChildren = {
  Ellipsis?: IToken[];
  After?: IToken[];
  LengthFunction?: IToken[];
  TimeSpan?: IToken[];
  NumberLiteral?: IToken[];
  guard?: GuardCstNode[];
  transitionTargetOrShortcutSyntax: TransitionTargetOrShortcutSyntaxCstNode[];
};

export interface AlwaysTransitionCstNode extends CstNode {
  name: "alwaysTransition";
  children: AlwaysTransitionCstChildren;
}

export type AlwaysTransitionCstChildren = {
  guard?: GuardCstNode[];
  Arrow: IToken[];
  transitionTarget: TransitionTargetCstNode[];
  blanks: BlanksCstNode[];
};

export interface BlanksCstNode extends CstNode {
  name: "blanks";
  children: BlanksCstChildren;
}

export type BlanksCstChildren = {
  Newline?: IToken[];
};

export interface TransitionTargetOrShortcutSyntaxCstNode extends CstNode {
  name: "transitionTargetOrShortcutSyntax";
  children: TransitionTargetOrShortcutSyntaxCstChildren;
}

export type TransitionTargetOrShortcutSyntaxCstChildren = {
  Arrow?: IToken[];
  transitionTarget?: TransitionTargetCstNode[];
  blanks?: (BlanksCstNode)[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  topLevelSequence(children: TopLevelSequenceCstChildren, param?: IN): OUT;
  sequence(children: SequenceCstChildren, param?: IN): OUT;
  stateNode(children: StateNodeCstChildren, param?: IN): OUT;
  stateNodeName(children: StateNodeNameCstChildren, param?: IN): OUT;
  stateNodePath(children: StateNodePathCstChildren, param?: IN): OUT;
  guard(children: GuardCstChildren, param?: IN): OUT;
  transition(children: TransitionCstChildren, param?: IN): OUT;
  transitionTarget(children: TransitionTargetCstChildren, param?: IN): OUT;
  eventTransition(children: EventTransitionCstChildren, param?: IN): OUT;
  afterTransition(children: AfterTransitionCstChildren, param?: IN): OUT;
  alwaysTransition(children: AlwaysTransitionCstChildren, param?: IN): OUT;
  blanks(children: BlanksCstChildren, param?: IN): OUT;
  transitionTargetOrShortcutSyntax(children: TransitionTargetOrShortcutSyntaxCstChildren, param?: IN): OUT;
}
