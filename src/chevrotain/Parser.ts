import { CstParser, IToken } from 'chevrotain'
import { useTokens, useLexer } from './Lexer';

const tokens = useTokens()
const [ 
  WhiteSpace, LineComment,
  LCurly, RCurly, LSquare, RSquare, Pipe, Newline,
  Ellipsis, Arrow, NumberLiteral, TimeSpan,
  LengthFunction,
  After, OnEvent, IfCondition, When, Label, Directive, Assignment, StateNodeName
] = tokens

export class Parser extends CstParser {
  cst: any = {
    name: 'topLevelSequence',
    children: {
      sequence: []
    }
  }
  comments: IToken[] = []
  
  constructor() {
    super(tokens, {
      nodeLocationTracking: 'full',
      recoveryEnabled: true
    })

    const $: any = this;

    $.RULE("topLevelSequence", () => {
      $.SUBRULE($.sequence) //TODO: Sort out all transitions except shortcut ones
    })

    $.RULE("sequence", () => {
      $.MANY(() =>
        $.OR([
          { ALT: () => $.SUBRULE($.stateNode) },
          { ALT: () => $.SUBRULE($.transition) },
          { ALT: () => $.SUBRULE($.blanks) },
        ])
      )
    })

    $.RULE("stateNode", () => {
      $.OPTION(() => $.CONSUME(Label))
      $.OR([
        { ALT: () => $.CONSUME(Directive) },
        {
          ALT: () => {
            $.AT_LEAST_ONE(() => 
              $.CONSUME(Assignment)
            )
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.stateNodeName)
            $.OPTION2(() => {
              $.OR2([
                {ALT: () => {
                  $.CONSUME(LCurly)
                  $.SUBRULE($.blanks)
                  $.SUBRULE($.sequence)
                  $.CONSUME(RCurly)
                  $.SUBRULE2($.blanks)
                }},
                {ALT: () => {
                  $.CONSUME(LSquare)
                  $.SUBRULE3($.blanks)
                  $.SUBRULE2($.sequence)
                  $.CONSUME(RSquare)
                  $.SUBRULE4($.blanks)
                }}
              ])
            })
        }}
      ])
    })

    $.RULE("stateNodeName", () => $.OR([
      { ALT: () => $.CONSUME(StateNodeName) },
      { ALT: () => $.CONSUME(NumberLiteral) },
      { ALT: () => $.CONSUME(TimeSpan) },
    ]))

    $.RULE("stateNodePath", () => {
      $.SUBRULE($.stateNodeName)
      $.MANY(() => {
        $.CONSUME(Pipe)
        $.SUBRULE2($.stateNodeName)
      })
    })

    $.RULE("guard", () => {
      $.OR([
        {ALT: () => { $.CONSUME(IfCondition) }},
        {ALT: () => {
          $.CONSUME2(When)
          $.OR3 ([
            { ALT: () => $.SUBRULE($.stateNodePath) },
            { ALT: () => $.CONSUME2(Label) },
          ])
        }}
      ])
    })

    $.RULE("transition", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.eventTransition) },
        { ALT: () => $.SUBRULE($.afterTransition) },
        { ALT: () => $.SUBRULE($.alwaysTransition) },
      ])
    })

    $.RULE("transitionTarget", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.stateNodePath) },
        { ALT: () => $.CONSUME(Label) },
      ])
    })

    $.RULE("eventTransition", () => {
      $.CONSUME(OnEvent)
      $.OPTION(() => $.SUBRULE($.guard))
      $.SUBRULE($.transitionTargetOrShortcutSyntax)
    })

    $.RULE("afterTransition", () => {
      $.OR([
        { ALT: () => $.CONSUME(Ellipsis) },
        {
          ALT: () => {
            $.CONSUME(After)
            $.OPTION(() => $.CONSUME(LengthFunction))
            $.OR2([
              { ALT: () => $.CONSUME(TimeSpan) },
              { ALT: () => $.CONSUME(NumberLiteral) },
            ])
          }
        },
      ])
      $.OPTION2(() => $.SUBRULE($.guard))
      $.SUBRULE($.transitionTargetOrShortcutSyntax)
    })

    $.RULE("alwaysTransition", () => {
      $.OPTION(() => $.SUBRULE($.guard))
      $.CONSUME(Arrow)
      $.SUBRULE($.transitionTarget)
      $.SUBRULE($.blanks)
    })

    $.RULE("blanks", () => $.MANY(() => $.CONSUME(Newline)))

    $.RULE("transitionTargetOrShortcutSyntax", () =>
      $.OR([
        {
          ALT: () => {
            $.CONSUME(Arrow)
            $.SUBRULE($.transitionTarget)
            $.SUBRULE($.blanks)
          }
        },
        {
          ALT: () => {
            $.SUBRULE2($.blanks)
          }
        }
      ])
    )

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
  }

  parse(code: string) {
    const lexer = useLexer()
    const lexerResult = lexer.tokenize(code)
    this.input = lexerResult.tokens
    this.comments = lexerResult.groups['comments']
    this.cst = (this as any).topLevelSequence()
  }
}

const reusableParser = new Parser()
export const useParser = () => reusableParser
