# Mastory Flow DSL Specification
## What the Flow?
“Flow” is Mastory's Domain Specific Language (DSL) to define each episode’s game flow.

The Flow language is kept as simple as possible to facilitate content development
in the context of Mastory's complex episodic story game. 

Although Flow can be seen as a certain kind of code, it is *not* a programming language
as it is not executable as-is. 
In fact, Flow scripts are nothing but a convenient way to author State Machine definitions,
suitable for use with the [XState library](https://xstate.js.org/docs/).
These so-called “statecharts”, in turn, *can* be executed in the very specific context of the Mastory app,
or more precisely, can be loaded up and interpreted by an integrated instance of XState.

It is therefore highly recommended to get familiar with
the basic notions of [statecharts](https://xstate.js.org/docs/guides/introduction-to-state-machines-and-statecharts/)
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
`on <EVENT>` or `after <TIME>` used to define event or timeout transitions, it is interpreted as a [**shortcut transition**](#shortcut-transitions). 
Source and target state nodes of this transition are assumed to be defined by the immediately preceding and immediately following lines, respectively.
- Everything else is interpreted as the name of a **state node** (potentially with side-effects, depending on the specific form of the state node name).

TODO: Describe paths

## DSL Features

###  Comments

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|✅|✅|✅|N/A|N/A|❌

Line comments start with double-slashes like in JS/TS


###  State Nodes

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|✅|✅|✅|✅|✅|❌

To define a [state node](https://xstate.js.org/docs/guides/statenodes.html), just write its name on a line of its own.
Names of state nodes may contain any word, non-word or whitespace characters except `|`, `{`, `[`.
Special syntax like `//` or `->` is also not permitted.
```swift
My 1st State (couldn't think of a "better" name) // normal parentheses and quotation marks are allowed, too
```

A [compound state](https://xstate.js.org/docs/guides/hierarchical.html) is denoted by a pair of braces {}.
State nodes nested inside the braces are considered child nodes
```swift
State 2 {
    State 2a // The first child state will be automatically deemed the "initial" one
    State 2b // This one won't be auto-selected
}
```

Using brackets [] instead of curly braces defines a ["parallel" compound state](https://xstate.js.org/docs/guides/statenodes.html#state-node-types)
```swift
Parallel State [
    I will be selected ...
    I will, too { // any combinations of [] and {} are valid, too
        A // auto-selected as soon as "Parallel State" is entered
        B // unselected by default
        C // unselected by default
    }
]
```


###  Transitions

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|✅|✅|✅|❌|✅|❌

Inside a state's braces (or brackets), use the arrow syntax `->` to define a transition to another state.
Transition targets are looked up within the current compound state's scope first;
if no matching target is found, the search continues one level higher until a match is found.

Combine `->` with the `on` keyword to define an event transition triggered by `SOME_EVENT`
```swift
Some State {
    on SOME_EVENT -> Another State 
}
```

You can also define "after transitions" based on a timeout with the `after` keyword.
Valid units for the time span are ms|milliseconds?|s|sec(ond)?s?|m|min(ute)?s?|h|hours?
Omitting the unit means milliseconds by default.
As a convenience, the format m:ss can be used to specify a combination of mins and secs: 3:25 is equivalent to 205s
```swift
Some Other State { 
    after 20s -> Another State
    after 3:25 -> Yet another state
}
Another State // This will be selected after 20 seconds
Yet another state // This will be selected after 3 minutes and 25 seconds
```

Transitions without `on` or `after` become ["always transitions"](https://xstate.js.org/docs/guides/transitions.html#eventless-always-transitions):
As soon as the state is entered, it is "redirected" to @omg
```swift
Transitory {
    -> @omg
}
```

Nested transition targets can be qualified by separating the scopes with a pipe `|` sign
```swift
Unrelated State {
    after 2min -> Parallel State | I will, too | C // this will only transition if someGuard evaluates to true
}
C // If the above transition target had just been specified as `-> C`, this would have been selected instead
```

#### Labels
Prepend a state node definition with `@someLabel` to assign `someLabel` to the state node for easier reference in transitions
```swift
@short This state has a very long name ...
Good we don't have to type all that again {
    on MY_EVENT -> @short
}
```

Labels provide an *absolute* alternative to referencing a state through its (relative) path.
They have to be unique across a Flow file, and they must not be mixed with path information,
i.e. a reference like `-> State name | @label` will lead to an error.

###  Conditions and Variables

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|✅|✅|❌|❌|❌|❌

Inside Flow scripts, you have access to three kinds of variables:
1. [Global variables](#global-variables) like `userName`
2. Utility variables in the current [Flow Scope](#flow-scope)
3. Shared [Challenge Data]

All available variables can be used for message interpolation by preceding their name with a `$` sign:
```bash
Intro {
    Nick "Hello, $userName"
}
```
When used in string interpolation, 

#### Global Variables
In every Flow you have access to a fixed set of global variables which are listed below. These variables are managed automatically, e.g. the `userName` will always be set based on the profile of the logged-on user.

##### `userName` (string)
The first name of the current user. E.g. if a user's profile has stored a name of *Alex Baldwin*, `VZ "Hi, $userName!"` will have VZ send out "Hi, Alex!"

##### `className` (string)
TBD

##### `classSize` (number)
The number of students in the class currently signed in.

#### Flow Scope
Each Flow may define its "own" variables that are set at one point of execution, and checked in another. These variables belong to the scope of the current Flow, so you cannot access them from other Flows.

If a state node name begins with an exclamation mark `!`, it will be interpreted as a variable assignment. The assignment is expected to be of the form `varname = expression`, where `varname` and `expression` can be any valid JS variable name and expression, respectively. `varname` will be either defined or re-assigned within the current Flow scope, and can then be used in message interpolation or [conditional transitions](#conditional-transitions).

Example:
```swift
State A {
    ! groupSize = classSize / 5
    // ...
    -> State B if groupSize < 3
}
State B {
    // ...
}
``` 

#### Conditional Transitions
If a transition definition contains an `if` clause, it becomes a ["guarded" (conditional) transition](https://xstate.js.org/docs/guides/guards.html).
The condition can be either the name of a (globally predefined) guard 
or any JS expression referring to the current Flow variables
```swift
after 2min if someCondition -> Target // this will only transition if `someCondition` evaluates to true
on MY_EVENT if a == 3 || userName != 'phil' -> Target // assuming `a` is defined somewhere
```

Replacing `if` by `when` + a state node reference will check if that state is (also) selected; only then the transition will happen
```swift
after 5min when Parallel State | I will, too | A -> Talkative
```


###  Shortcut Syntax

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|✅|❌|❌|❌|❌|❌

To define a sequence of states where two subsequent states are connected by exactly one transition,
you can use a special shortcut syntax without `->`
```swift
State A
after 1s
State B
on PLAY if x < 0.5
State C
```

The above is equivalent to the more verbose definition
```swift
State A {
    after 1s -> State B
}
State B {
    on PLAY if x < 0.5 -> State C
}
State C
```


###  Directives

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|◔|❌|❌|❌|❌|❌|❌|

Next to child state nodes and transitions, you can also define that certain actions should be triggered
once a state is reached. This can be done through Flow *directives*, which are single-word commands
(similar to function names in other programming languages) preceded by a leading dot:
```swift
Beware of the dog! {
    .biteUser
}
```

Many times, directives have *arguments* that modify or specify its behavior. Everything following a
directive's name on the same line (except comments) is considered its argument(s), but the concrete format and meaning
depends entirely on the directive in question. This is much like the way command-line tools work: Each
one has its own way of interpreting the command line, and ideally, that way is the most convenient
one for its specific use-case. Here are some examples:
```swift
.showApp Dictionary
.loadChallenge Drone
.let VZ appear in Wire
.let VZ jump
```

It is possible to place directives directly after `on` or `after` statements (without the
`->` transition marker). The event or timeout will trigger the specified action just like
it would otherwise trigger a transition when used with a target state. Keep in mind that when using `on`
or `after` in this way, the surrounding state will not be left! Continuing the example from above:
```swift
Beware of the dog! {
    .bark
    after 3s .bark louder
    on SELF_DEFENSE .bite burglar
}
```

Here is a list of all directives currently supported by the Mastory app.
Optional arguments are denoted by [brackets]; all other listed arguments are mandatory.

#### `.focusApp`
```swift
.focusApp AppName
```

- `AppName` – one of the available apps-in-the-app: `home`, `wire`, `messenger`, or `vlog`

Ensures that `AppName` is visible for the user, switching the "currently selected app" to `AppName` if necessary.

#### `.inChallenge`
```swift
.inChallenge [Character] EventName OptionsObject
```

- `Character` *optional* – the name of an NPC (`Nick`, `VZ`, `Alicia`, or `Professor`) which will be merged with any options passed in the `OptionsObject` and can be used by the Challenge State Machine to implement an animation that pretends that NPC interacting with the challenge UI. Will match character names case-insensitively.
- `EventName` – the name of an event that can be interpreted by the currently loaded challenge state machine.
- `OptionsObject` – a JavaScript object of the form `{option1: value1, option2: value2, ...}` containing any
additional event-related data to be forwarded to the Challenge State Machine. If a `Character` argument is given, then the options object will contain an additional key `_pretendCausedByNpc` with the name of that NPC (normalized with respect to casing).

This directive can be used to dynamically influence the current challenge from the Flow script.
Each challenge defines the unique list of events that its [→Challenge State Machine](https://github.com/mastoryberlin/app/tree/master/challenges)
"understands", many times by transitioning to a different state. To manipulate `SomeChallenge`'s UI or internal
data in a certain way, check its specs in the `app` project's hierarchy at `challenges/SomeChallenge/README.md`.

Note that `EventName` must *exactly* match the event name defined by the challenge state machine, as no automatic case-translations will be performed.
Likewise, the `OptionsObject` will be passed to the challenge state machine's `send()` function as-is, so make sure to also
match the expected data format to reach the intended result.

#### `.loadChallenge`
```swift
.loadChallenge ChallengeName
```

- `ChallengeName` – the name or ID of a challenge, i.e. the name of the `app` project's subfolder it is contained in under `challenges`.

Loads the challenge `ChallengeName` in the Wire, including its Vue component, challenge store, and challenge
state machine. `ChallengeName` will be matched against all available challenge names in a case-insensitive
manner.

Note that `.loadChallenge` does not automatically focus the Wire app. To do so, you will need to include
a [`.focusApp`](#focusapp) directive as well.

#### `.unloadChallenge`
```swift
.unloadChallenge
```


Unloads any currently loaded challenge, leaving the Wire app in the state where it reads "No challenge available".


###  Messenger Conversations

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|❌|✅|❌|❌|❌|❌|❌

**IMPORTANT: The following specs are still in development and should not be relied on!**

State names ending with a "quoted" string are interpreted as *messages*:
When they are entered, the message will be sent either in the chat or by the assistant.
```swift
Talkative {
    Alicia "Hi!"    // Specify the name of the sender (NPC) before the message
    after 1s
    "There is a new message available." // A message without a sender is interpreted to be a global message by the assistant.
    after 4sec
    @how Alicia "How are you?"
    ... "I'm not so good today😞" // a shortcut meaning "same sender + default timeout"
    on USER_REACTION
    Alicia "Thank you for listening to me, $userName!" // Within message texts, you can inject the values of contextual variables using $ + varname
```

Besides $userName, you can use $className and $teacherName
```swift
    on RESTART -> @how
}
```

Interactive conversations ("NLU contexts") can be defined by adding a state node called ? as the initial child of a compound state:
```swift
Victoria "Hi, did you also get Alicia's messages?" {
    ? // This will wait for user input, process it, and select the best match among the provided intents
    "yes" {
        -> @omg // This is an "always transition": As soon as the state is entered, it is "redirected" to @omg
    }
    "no" {
        Victoria "Here, look."
        .. Victoria AUDIO "Challenge intro 1" // This syntax indicates an audio message to be added later through the visual Content Editor.
```

The quoted string is just an (optional) description in this case.
Once the media source is added, the above line of code will be changed into something like:
.. Victoria http://url-to-audio-file.mp3 "Challenge intro 1"
(the fact that is it an AUDIO source will then be derived from the URL file extension)
```swift
        after 5s
        Victoria IMAGE "cloud message" // ... same thing can be done for an image source ...
        after 5s
        _
```

... and a video message:
```swift
        Victoria VIDEO "Challenge intro 2" = introVideo {
```

with the "= ..." syntax, the media file / URL is linked with an identifier (constant) for reference
wherever the assigned identifier appears throughout the flow script, it will be replaced by the actual URL
```swift
            _ // auxiliary child states are needed to chain multiple transitions - it is recommended to call them _, __, ___
            on PLAY if lastPlayedMedia == introVideo
            __
            after length(introVideo) + 5s -> @omg // you can use the length() pseudo-function to refer to the duration of an audio or video file
```

if needed, combine it with a fixed time span via + ... or - ...
```swift
        }
    }
    * -> ?    // An optional wildcard state * within a conversation context provides a catch-all option,
```

which is selected when the user input doesn't match any of the other.
```swift
}
@omg Victoria "OMG!"
on SOME_EVENT // transition shortcuts also work on the root level: on the SOME_EVENT event, transition to the next state node
```

In conversations, regular expressions can also be used as "intents" - those will be tested before any NLU processing takes place
```swift
Nick "Any idea what point this could be?"
.. @askPoint _ {
    ?
```

Match tuples of the form (x, y) where x and y are both numbers.
In case of a match, parts of the input can be retrieved using named capturing groups:
```swift
    /\((?<x>[-+]?[0-9.])\s*,\s*(?<y>[-+]?[0-9.])\)/ {
        _
        after 30s
        __ {
```

After a regexp match, the retrieved variables can be accessed e.g. in conditional transitions
```swift
            if x == 2.5 && y == -1 -> @correct
            -> @wrong // "else" transition
        }
    }
    * {
        1 { Nick "Hm?" -> ? }
        2 { Nick "I don't really get you ..." -> ? }
        3 { 
            Nick "Hey ... could it be (2.5, 1)? Give me a sec, I'll check that" {
                ! x = 2.5, y = 1 // States whose names start with "!" can be used to set variable values manually
                -> @correct
            }
        }
    }
}
```

Values of captured/set variables can also be used in (message) strings with the $ + identifier syntax:
```swift
@correct Nick "Okay, I'll check the point ($x, $y)!"
after 1s
@wrong Nick "Hmm, that didn't really work out. Any other ideas?" -> 
```

To avoid repetitive responses, we can define a compound state with a sequence of "time of re-entry" children:
```swift
Greeting {
```

Re-entry substates have just a plain integer as their name
```swift
    1 { "Hi!" } // This child state will be selected when Greeting is entered for the first time ...
    2 { "Great to meet you." } // ... for the second time ...
    * { "Welcome." } // ... and any subsequent times (optional)
```

If no * default substate is provided, the sequence will start over after the last child (1 -> 2 -> 1 -> 2 ...)
```swift
}
```
