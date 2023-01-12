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

###  State Nodes

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|✅|✅|✅|✅|✅|❌

To define a [→state node](https://xstate.js.org/docs/guides/statenodes.html), just write its name on a line of its own.
Names of state nodes may contain any word, non-word or whitespace characters except `|`, `{`, `[`.
Special syntax like `//` or `->` is also not permitted.
```swift
My 1st State (couldn't think of a better name) // normal parentheses are allowed, too

```

A [→compound state](https://xstate.js.org/docs/guides/hierarchical.html) is denoted by a pair of braces {}.
State nodes nested inside the braces are considered child nodes
```swift
State 2 {
    State 2a // The first child state will be automatically deemed the "initial" one
    State 2b // This one won't be auto-selected
}

```

Using brackets [] instead of curly braces defines a [→"parallel" compound state](https://xstate.js.org/docs/guides/statenodes.html#state-node-types)
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
|✅|✅|✅|✅|✅|✅|❌

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
|◔|◔|◔|◔|◔|◔|❌

```swift

```

Inside Flow scripts, you have access to two kinds of variables:
1. [Global variables](#global-variables) like `userName`
2. Variables in the current [Episode Scope](#episode-scope)
```swift

```

All available variables can be used for message interpolation by preceding their name with a `$` sign:
```swift
Intro {
        Nick "Hello, $userName"
}

```

You can also modify variable values using inline TypeScript expressions by wrapping them in `${...}`:
```swift
VZ "We are ${classSize + 2} people (including Nick and myself)"

```

#### Global Variables
In every Flow you have access to a fixed set of global variables which are listed below. 
These are not called "constants" since their value may change dynamically, but they are managed automatically and you cannot assign them, 
e.g. `userName` will always be set based on the profile of the logged-on user.
```swift

```

##### `userName` (string)
The first name of the current user. E.g. if a user's profile has stored a name of *Alex Baldwin*, `VZ "Hi, $userName!"` will have VZ send out "Hi, Alex!"
```swift

```

##### `className` (string)
TBD
```swift

```

##### `classSize` (number)
The number of students in the class currently signed in.
```swift

```

#### Episode Scope
Each episode may define "its own" variables that are set at one point of execution, and checked in another. 
These variables "belong" to the episode, so that other episodes' flows and challenges do not in general know of their existence.
```swift

```

The episode scope is, however, shared between the episode's main flow, all [subflows](#subflows) and challenge flows, 
so you can rely on the same set of variables across all parts of an episode.
```swift

```

For this to work, all variables in the episode scope have to be declared and default-initialized in the special "episode config" file:
1. Create a TypeScript file, called after the episode's name + `.ts`, in the corresponding subfolder of `episodes` (or open it if it already exists).
2. In that file, `export default` an object with a `variables` option and list all episode-scope variables with their default values as key-value pairs under that option.
```swift

```

For instance, if the episode *e17* needs a special `groupSize` variable that defaults to 0, this is how `~/episodes/e17/e17.ts` might look:
```ts
export default {
variables: {
groupSize: 0,
// ... other variables ...
},
// ... other options ...
}
```
```swift

```

##### Assigning Variables
If a state node name is of the form
```swift
varname := expression
```

it will be interpreted as a variable assignment in the current episode scope.
- `varname` must be declared in the episode config file as described above,
- `expression` can be any valid TypeScript expression that will be evaluated in the current episode scope.
```swift

```

> Note: Despite their "actionable" character, variable assignments are **not** sequential commands!
> Apart from their side-effects, variable assignments are just ordinary states, so it is possible and in fact necessary to
connect them to other states with transitions.
```swift

```

After assigning a value to it, `varname` can be used in message interpolation or [conditional transitions](#conditional-transitions).
```swift

```

Example:
```swift
State A {
    groupSize := classSize / 5
    .. Do something else
    .. Switch {
        if groupSize < 3 -> State B
        -> State C
    }
}

```

#### Conditional Transitions
If a transition definition contains an `if` clause, it becomes a [→"guarded" (conditional) transition](https://xstate.js.org/docs/guides/guards.html).
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
|✅|✅|✅|✅|✅|✅|❌

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

The most frequent case of timeout transitions in a flow is the "fast succession" *A, then B* - where "then"
is a placeholder for a short period of time. For this special case, the `after` statement from above can be
abbreviated even more to an *ellipsis prefix* of 2, 3, or 4 dots in the same line as the target state:
```swift
State A
.. State B     // 2 dots means "after 2s"
... State C    // 3 dots means "after 3s"
.... State D // 4 dots means "after 4s"
```


###  Directives

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|◔|❌|✅|✅|✅|◔|❌|

When composing a flow, some state nodes are merely useful for the logical order of things while others carry out
side effects - e.g., we can send messages and listen to user input just by following the naming conventions for
[messenger conversations](#messenger-conversations).

However, there are situations where one needs to trigger more specific side-effects, like displaying a video in full-screen
cinema mode or loading up a math challenge in the Wire app. These and similar effects can be achieved through Flow *directives*,
which are single-word commands (similar to function names in other programming languages) preceded by one leading dot:
```swift
beware of the dog! {
    .biteUser
}

```

Some directives have *arguments* that modify or specify their behavior. Everything following a
directive's name on the same line (except comments) is considered its argument(s), but the concrete format and meaning
depends entirely on the directive in question. This is much like the way command-line tools work: Each
command has its own way of interpreting the command line, and ideally, that way is the most convenient
one for its specific use-case. Here are some examples for directives with arguments:
```swift
.showApp Dictionary
.loadChallenge Drone {droneProp: 3.5}
.let VZ appear in Wire
.let VZ jump

```

> Note: Despite their "actionable" character, directives are **not** sequential commands!
> Apart from their side-effects, directives are just ordinary states, so it is possible and in fact necessary to
connect them to other states with transitions.
```swift

```

Just like with other states, shortcut syntax can be used to make the flow more readable:
```swift
Beware of the dog! {
    .bark
    after 3s
    .bark louder
    on SELF_DEFENSE
    .bite burglar
}

```

> Careful when using ellipses in combination with directives! You need to separate the transition part from the directive with
> whitespace, or else the directive will not be recognized as such.
```swift
.bark
.. .bark louder // this works
....even louder    // but this doesn't!
```

> In the example above, the 4 sequential dots will be interpreted as a shortcut for "after 4s", and the rest of the line
> becomes an ordinary state node named "even louder", with no side-effects attached.
```swift

```

Here is a list of all directives currently supported by the Mastory app.
Optional arguments are denoted by [brackets]; all other listed arguments are mandatory.

- [actorPoints](#actorpoints)
- [alert](#alert)
- [cinema](#cinema)
- [done](#done)
- [focusApp](#focusapp)
- [inChallenge](#inchallenge)
- [loadChallenge](#loadchallenge)
- [loadSubflow](#loadsubflow)
- [reach](#reach)
- [subflow](#subflow)
- [unloadChallenge](#unloadchallenge)
- [unloadSubflow](#unloadsubflow)

#### `.actorPoints`
```swift
.actorPoints {at: UIElementDataId}
```

- `UIElementDataId` – a string identifying a UI element that the avatar pointer should point at.

Displays an "avatar mouse pointer" animation, faking to the user that one of the NPCs is interacting with the app UI.

`UIElementDataId` should match the `data-avatar-target` attribute of some HTML element visible at the time this
directive is executing. For example, if there is a button UI element defined like
```html
<button data-avatar-target="closeButton"> Close! </button>
```
then you could fake an effect as if an NPC was clicking on that button via:
```swift
.actorPoints {at: 'closeButton'}
```

An animation will only be displayed if the event that led to the state of this directive has an `_pretendCausedByNpc` parameter.
In this case, the "actor" (avatar) performing the fake operation will be chosen based on this parameter, matching up with any
episode flow [.inChallenge](#inchallenge) directives that may have caused the current directive.

If `_pretendCausedByNpc` is unset, it is assumed that the current directive was caused by some actual user interaction,
and it will have no effect.

#### `.alert`
```swift
.alert {text: MessageText, title: PopupWindowTitle}
```

- `MessageText` – a string to be displayed by the alert overlay.
- `PopupWindowTitle` – the overlay popup window's title.

Displays a popup overlay dialog with a title and a (text) message, similar to JS's native `alert()` function.

#### `.cinema`
```swift
.cinema VideoUrl
```

- `VideoUrl` – a URL pointing to a video file.

Loads the video specified with `VideoUrl` and displays it in "cinema mode", i.e. in a full-screen overlay that essentially blocks all other interaction with the app and requires the user's undivided attention. 

Although the video can be jumped using a slider bar (to re-watch missed parts, for example), there is no close button provided and the overlay remains open until the video was watched to the end.

#### `.done`
```swift
.done
```


This directive is internally translated into a "final" state; reaching it will immediately terminate execution of the flow.

`.done` is most useful in subflows loaded using [`.loadSubflow`](#loadsubflow) or [`.subflow`](#subflow).

Using it in a main episode flow will mark the episode itself as finished and cause the Mastory app to return to the overview page (TBD).

#### `.focusApp`
```swift
.focusApp AppName
```

- `AppName` – one of the available apps-in-the-app: `home`, `wire`, `messenger`, or `vlog`

Ensures that `AppName` is visible for the user, switching the "currently selected app" to `AppName` if necessary.

#### `.inChallenge`
```swift
.inChallenge [ActorName] EventName OptionsObject
```

- `ActorName` (*optional*) – the name of an NPC which can be used to fake a UI interaction, see [.actorPoints](#actorpoints).
- `EventName` – the name of an event that can be interpreted by the currently loaded challenge state machine.
- `OptionsObject` – a JavaScript object of the form `{option1: value1, option2: value2, ...}` containing any
additional event-related data to be forwarded to the challenge state machine.

This directive can be used to dynamically influence the current challenge from the Flow script.
Each challenge defines the unique list of events that its [→Challenge State Machine](https://github.com/mastoryberlin/app/tree/master/challenges)
"understands", many times by transitioning to a different state. To manipulate `SomeChallenge`'s UI or internal
data in a certain way, check its specs in the `app` project's hierarchy at `challenges/SomeChallenge/README.md`.

Note that `EventName` must *exactly* match the event name defined by the challenge state machine, as no automatic case-translations will be performed.
Likewise, the `OptionsObject` will be passed to the challenge state machine's `send()` function as-is, so make sure to also
match the expected data format to reach the intended result.

If `ActorName` is given, the NPC name will be forwarded to the event sent to the challenge via an additional parameter `_pretendCausedByNpc`.
Then, if the event leads to an [.actorPoints](#actorpoints) directive in the challenge flow, a UI interaction by this NPC
will be displayed.

#### `.loadChallenge`
```swift
.loadChallenge ChallengeId
```

- `ChallengeId` – the ID of the challenge to load, i.e. the name of the `app` project's subfolder it is contained in under `challenges`.

Loads the challenge `ChallengeId` in the Wire, including its Vue component, challenge store, and challenge
state machine. `ChallengeId` will be matched against all available challenge names in a case-insensitive
manner.

Note that `.loadChallenge` does not automatically focus the Wire app. To do so, you will need to additionally include
a [`.focusApp`](#focusapp) directive after loading the challenge.

#### `.loadSubflow`
```swift
.loadSubflow SubflowId
```

- `SubflowId` – the ID of the subflow to load, which has to match the name of another `.flow` file residing in the same folder like the current flow.

Loads the subflow `SubflowId` and runs it in a separate state machine. `SubflowId` will be matched against all available subflow names in a case-insensitive
manner.

> `.loadSubflow` will run the subflow *asynchronously*, i.e. the current flow will keep running in parallel to the subflow.
> To load and *wait* for a subflow to finish, use [`.subflow`](#subflow) instead.

#### `.reach`
```swift
.reach SkeletonPart [EntryId]
```

- `SkeletonPart` – the ID of one of the possible sections in an episode skeleton. Currently, the following values are accepted: `mission`, `input`, `whatItMeans`, `actionPlan`, `toDos`, `results`, `conclusion`.
- `EntryId` – an ID to further specify the item to be activated. Can be either a string, a "JSON path" (dot-separated string), or left out entirely, depending on the selected `SkeletonPart`.

Enables one of the entries on the Log page, indicating that a particular goal has been reached.
The exact usage depends on what piece of the current episode's skeleton (as defined in the episode config file) should be enabled:
- For the episode's `mission`, `EntryId` is ignored and can be left out.
- For the episode's `actionPlan`, `EntryId` is interpreted as a "JSON path" (dot-separated string, e.g. `firstGoal.analyze.solveSecret`) to identify the nesting position of the entry that should be enabled.
- For any other value passed as `SkeletonPart`, `EntryId` is expected to be a simple string, which is interpreted as the key identifying the entry to be enabled within the respective section object.

#### `.subflow`
```swift
.subflow SubflowId
```

- `SubflowId` – the ID of the subflow to load, which has to match the name of another `.flow` file residing in the same folder like the current flow.

Loads the subflow `SubflowId` and runs it in a separate state machine. 
The current flow will wait until the subflow reaches its final state (last state node or a `.done` directive).
`SubflowId` will be matched against all available subflow names in a case-insensitive manner.

> To run a subflow without stopping the current flow, use [`.loadSubflow`](#loadsubflow) instead.

#### `.unloadChallenge`
```swift
.unloadChallenge
```


Unloads any currently loaded challenge, leaving the Wire app in the state where it reads "No challenge available".

#### `.unloadSubflow`
```swift
.unloadSubflow
```


Unloads any currently loaded subflow. 
Use this directive to abort a subflow that was loaded with [`.loadSubflow`](#loadsubflow) before it reaches its final state.
```swift

```

## Timing Directives
TBD


###  Messenger Conversations

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|❌|✅|✅|✅|✅|✅|❌

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
                                                                                                 // Besides $userName, you can use $className and $teacherName
    on RESTART -> @how
}

```

Interactive conversations ("NLU contexts") can be defined by adding a state node called ? as the initial child of a compound state:
```swift
VZ "Hi, did you also get Alicia's messages?" {
    ? // This will wait for user input, process it, and select the best match among the provided intents
    "yes" {
        -> @omg // This is an "always transition": As soon as the state is entered, it is "redirected" to @omg
    }
    "no" {
        VZ "Here, look."
        .. VZ AUDIO "Challenge intro 1" // This syntax indicates an audio message to be added later through the visual Content Editor.
                                                                        // The quoted string is just an (optional) description in this case.
                                                                        // Once the media source is added, the above line of code will be changed into something like:
                                                                        // .. VZ http://url-to-audio-file.mp3 "Challenge intro 1"
                                                                        // (the fact that is it an AUDIO source will then be derived from the URL file extension)
        after 5s
        VZ IMAGE "cloud message" // ... same thing can be done for an image source ...
        after 5s
        _
        // ... and a video message:
        VZ VIDEO "Challenge intro 2" = introVideo {
            // with the "= ..." syntax, the media file / URL is linked with an identifier (constant) for reference
            // wherever the assigned identifier appears throughout the flow script, it will be replaced by the actual URL
            _ // auxiliary child states are needed to chain multiple transitions - it is recommended to call them _, __, ___
            on PLAY if lastPlayedMedia == introVideo
            __
            after length(introVideo) + 5s -> @omg // you can use the length() pseudo-function to refer to the duration of an audio or video file
                                                                                        // if needed, combine it with a fixed time span via + ... or - ...
        }
    }
    * -> ?    // An optional wildcard state * within a conversation context provides a catch-all option,
                    // which is selected when the user input doesn't match any of the other.
}
@omg VZ "OMG!"

on SOME_EVENT // transition shortcuts also work on the root level: on the SOME_EVENT event, transition to the next state node

```

In conversations, regular expressions can also be used as "intents" - those will be tested before any NLU processing takes place
```swift
Nick "Any idea what point this could be?"
.. @askPoint _ {
    ?
    // Match tuples of the form (x, y) where x and y are both numbers.
    // In case of a match, parts of the input can be retrieved using named capturing groups:
    /\((?<x>[-+]?[0-9.])\s*,\s*(?<y>[-+]?[0-9.])\)/ {
        _
        after 30s
        __ {
            // After a regexp match, the retrieved variables can be accessed e.g. in conditional transitions
            if x == 2.5 && y == -1 -> @correct
            -> @wrong // "else" transition
        }
    }
    * {
        1 { Nick "Hm?" -> ? }
        2 { Nick "I don't really get you ..." -> ? }
        3 {    
            Nick "Hey ... could it be (2.5, 1)? Give me a sec, I'll check that" {
                Set Variables [
                    x := 2.5
                    y := 1
                ]
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
    // Re-entry substates have just a plain integer as their name
    1 { "Hi!" } // This child state will be selected when Greeting is entered for the first time ...
    2 { "Great to meet you." } // ... for the second time ...
    * { "Welcome." } // ... and any subsequent times (optional)
    // If no * default substate is provided, the sequence will start over after the last child (1 -> 2 -> 1 -> 2 ...)
}
```


###  Subflows

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
|✅|❌|✅|✅|✅|✅|❌

With larger episode flows, managing the entire flow in one file quickly becomes tedious.
It is therefore recommended to author episodes in a modular manner, organized around a single main episode flow
as entry point and many "subflows" which make up its parts, and which are invoked one by one from the main flow
using [`.subflow`](#subflow) or [`.loadSubflow`](#loadsubflow) directives:
```
(app project root directory)
└─ episodes
└─ MyEpisode
├─ Intro.flow
├─ Main.flow
├─ MyEpisode.flow
├─ MyEpisode.ts   <-- episode config file
├─ Outro.flow
└─ meta.json      <-- metadata
```
In the above example structure, `MyEpisode.flow` defines the main flow for the *MyEpisode* episode, and it could look something like this:
```swift
Intro {
    .cinema some_starter_video
    .. .subflow Intro // run the subflow defined in Intro.flow - this state will remain active until the subflow completes
    .. -> Main
}
Main {
    .subflow Main // run the subflow defined in Main.flow - this state will remain active until the subflow completes
    .. -> Outro
}
Outro {
    .subflow Outro // run the subflow defined in Outro.flow - this state will remain active until the subflow completes
    .. .done
}

```

Just like with main episode flows, it is important to make sure that every subflow comes to an end under all circumstances.
Use [`.done`](#done) in subflow definitions to end execution before the last line of code.
```swift

```

The file `meta.json` contains metadata on the episode, and as part of that, a `mainFlow` property which you may use to 
customize the main flow (entry point) for the episode. This can be convenient if you need to switch between different structures
(for user tests etc.), but still want to refer to the same set of subflows. 
```swift

```

For instance, to define that *MyEpisode* should run a file `MyEpisode-variant.flow`
instead of the default `MyEpisode.flow`, your `meta.json` might look like this:
```json
{
"title": "My Episode",
"mainFlow": "MyEpisode-variant"
}
```
