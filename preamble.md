# Mastory Flow DSL Specification
## What the Flow?
“Flow” is Mastory's Domain Specific Language (DSL) to define each episode’s game flow.

The Flow language is kept as simple as possible to facilitate content development
in the context of Mastory's complex episodic story game. 

Although Flow can be seen as a certain kind of code, it is *not* a programming language
as it is not executable as-is. 
In fact, Flow scripts are nothing but a convenient way to author State Machine definitions,
suitable for use with the [→XState library](https://xstate.js.org/docs/).
These so-called “statecharts”, in turn, *can* be executed in the very specific context of the Mastory app,
or more precisely, can be loaded up and interpreted by an integrated instance of XState.

It is therefore highly recommended to get familiar with
the basic notions of [→statecharts](https://xstate.js.org/docs/guides/introduction-to-state-machines-and-statecharts/)
before diving deeper into Flow. 
It is a good idea to keep in mind that every Flow script is ultimately translated into a
statechart, and that Flow statements which may look like imperative commands or logical expressions will become mere
*side-effects* of a state machine once it is run.

## Structure of a Flow Script
A Flow script is structured into (a) individual lines of code (“statements”) and (b) blocks of code (“scopes”), delimited
by either curly braces `{}` or square brackets `[]`. Curly-brace scopes can be nested, leading to a hierarchic tree of scopes.

Each statement denotes (i.e. will be translated into) either a state node OR a transition OR an action of the underlying statechart,
depending on the specific syntax used in that statement:
- If the statement begins with a “dot + verb” sequence (e.g. `.show wire` or `.do something`), it is interpreted as an **action**, triggered on entering the surrounding scope.
- If the statement begins with an exclamation mark, it is interpreted as a special *assign to variable* **action**, triggered on entering the surrounding scope.
- If the statement contains an “arrow” `->`, it is interpreted as a **transition** from the surrounding scope to a target state (RHS of the arrow).
- If the statement does *not* contain an arrow but otherwise matches the patterns
`on <EVENT>` or `after <TIME>` used to define event or timeout transitions, it is interpreted as a [**shortcut transition**](#shortcut-syntax). 
Source and target state nodes of this transition are assumed to be defined by the immediately preceding and immediately following lines, respectively.
- Everything else is interpreted as the name of a **state node** (potentially with side-effects, depending on the specific form of the state node name).

TODO: Describe paths

## DSL Features