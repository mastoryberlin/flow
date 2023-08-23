export declare const allPanelIds: readonly ["parser", "visitor", "processing"];
export declare const allNpcs: readonly ["Nick", "Alicia", "VZ", "Professor"];
export declare const allErrors: readonly ["parser error", "state name is used multiple times in the same scope", "message sender unknown", "transition does not come from a state node", "transition target unknown", "reenterable states (with child states 1, 2, ...) must define a * fallback child state", "state node names must be unique in every scope"];
export declare const allWarnings: readonly ["dead end", "media url undefined", "unresolved TODO", "transition will jump nowhere because the target state includes the transition definition"];
export declare const interpolationSymbolStart = "\u00AB";
export declare const interpolationSymbolEnd = "\u00BB";
export declare const allIssueKinds: ("parser error" | "state name is used multiple times in the same scope" | "message sender unknown" | "transition does not come from a state node" | "transition target unknown" | "reenterable states (with child states 1, 2, ...) must define a * fallback child state" | "state node names must be unique in every scope" | "dead end" | "media url undefined" | "unresolved TODO" | "transition will jump nowhere because the target state includes the transition definition")[];
export declare const allStatechartVariants: readonly ["mainflow", "subflow", "ui"];
