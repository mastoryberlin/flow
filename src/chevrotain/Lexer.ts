import { createToken, Lexer, type CustomPatternMatcherReturn } from 'chevrotain'

const stateNodeNameRegex = /(?:\w+:\/\/|[^-\/\[\{\n@]|-(?!>)|\/(?!\/)|@\W)*/y
const StateNodeName = createToken({
  name: 'StateNodeName',
  pattern: (text: string, startOffset: number) => {
    stateNodeNameRegex.lastIndex = startOffset
    const execResult = stateNodeNameRegex.exec(text)
    if (execResult !== null) { 
      let matched = execResult[0]
      return [matched.trim()]
    }
    return null
  },
  line_breaks: false
})

const directiveRegex = /\.(\w+)(?: +((?:[^\n\/]|\/(?!\/))*))?/y
const Directive = createToken({
  name: 'Directive',
  pattern: (text: string, startOffset: number) => {
    directiveRegex.lastIndex = startOffset
    const execResult = directiveRegex.exec(text)
    if (execResult !== null) {
      const ret = execResult as unknown as CustomPatternMatcherReturn
      ret.payload = {
        name: execResult[1],
        arg: execResult[2]
      }
      return ret
    }
    return null
  },
  line_breaks: false
})

const assignmentRegex = /(\w+)\s*:=\s*([^;\n]+);?/y
const Assignment = createToken({
  name: 'Assignment',
  pattern: (text: string, startOffset: number) => {
    assignmentRegex.lastIndex = startOffset
    const execResult = assignmentRegex.exec(text)
    if (execResult !== null) {
      const ret = execResult as unknown as CustomPatternMatcherReturn
      ret.payload = {
        varName: execResult[1],
        value: execResult[2]
      }
      return ret
    }
    return null
  },
  line_breaks: false
})

const TimeSpan = createToken({ name: 'TimeSpan', pattern: /(?:0|[1-9]\d*):\d{2}|(?:0|[1-9]\d*)(?:\.\d+)?(?:\s*(?:ms|milli(seconds?)?|s(ec(onds?)?)?|m(in(utes?)?)?|h(ours?)?)\b)?/})

const tokenDefinitions = {
  LCurly: /{/,
  RCurly: /}/,
  LSquare: /\[/,
  RSquare: /]/,
  Pipe: /\|/,
  Newline: /\n/,
  Arrow: /->/,
  Ellipsis: /\.{2,4}/,
  LengthFunction: /\blength\([^)]*\)\s*(?:[-+]\s*)?/,
  After: /\bafter\b/,
  OnEvent: /\bon\s+\S+\b/,
  IfCondition: /\bif\b\s*(?:.(?!->))*/,
  When: /\bwhen\b/,
  Label: /@\w+\b/,
  NumberLiteral: { pattern: /(?:0|[1-9]\d*)(?:\.\d+)?/, longer_alt: TimeSpan },
  LineComment: { pattern: /\/\/.*/, group: 'comments' },
  WhiteSpace: { pattern: /[ \t]+/, group: Lexer.SKIPPED },
}

const dslTokens = Object.fromEntries(
  Object.entries(tokenDefinitions).map(([name, definition]) =>
    [name, createToken({ name, ...(definition.constructor === RegExp ? { pattern: definition } : definition) })])
)

const { LCurly, RCurly, LSquare, RSquare, Pipe, Newline, Arrow, Ellipsis, LengthFunction, After, OnEvent, IfCondition, When, Label, NumberLiteral, /* TimeSpan, StateNodeName, Directive, Assignment, */ LineComment, WhiteSpace } = dslTokens

// Labels only affect error messages and Diagrams.
LCurly.LABEL = "'{'";
RCurly.LABEL = "'}'";
LSquare.LABEL = "'['";
RSquare.LABEL = "']'";
Newline.LABEL = "'\\n'"

const allTokens = [
  WhiteSpace, LineComment,
  LCurly, RCurly, LSquare, RSquare, Pipe, Newline,
  Ellipsis, Arrow, NumberLiteral, TimeSpan,
  LengthFunction,
  After, OnEvent, IfCondition, When, Label, Directive, Assignment, StateNodeName,
]
export const useTokens = () => allTokens

const reusableLexer = new Lexer(allTokens)
export const useLexer = () => reusableLexer
