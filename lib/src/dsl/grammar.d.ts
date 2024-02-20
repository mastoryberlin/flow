declare function getTextMateGrammar(): {
    $schema: string;
    name: string;
    patterns: {
        include: string;
    }[];
    repository: {
        comments: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        constants: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        expressions: {
            patterns: {
                match: string;
                captures: {
                    "0": {
                        name: string;
                        patterns: {
                            include: string;
                        }[];
                    };
                };
            }[];
        };
        events: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        variables: {
            patterns: ({
                match: string;
                name: string;
                begin?: undefined;
                end?: undefined;
                patterns?: undefined;
            } | {
                begin: string;
                end: string;
                patterns: {
                    match: string;
                    name: string;
                }[];
                match?: undefined;
                name?: undefined;
            })[];
        };
        functions: {
            patterns: {
                match: string;
                name: string;
            }[];
        };
        keywords: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        messages: {
            name: string;
            begin: string;
            end: string;
            patterns: ({
                name: string;
                match: string;
                begin?: undefined;
                end?: undefined;
                beginCaptures?: undefined;
                endCaptures?: undefined;
                patterns?: undefined;
                captures?: undefined;
            } | {
                begin: string;
                end: string;
                beginCaptures: {
                    "0": {
                        name: string;
                    };
                };
                endCaptures: {
                    "0": {
                        name: string;
                    };
                };
                name: string;
                patterns: {
                    include: string;
                }[];
                match?: undefined;
                captures?: undefined;
            } | {
                match: string;
                captures: {
                    "1": {
                        name: string;
                    };
                    "2": {
                        name: string;
                        patterns: {
                            include: string;
                        }[];
                    };
                };
                name?: undefined;
                begin?: undefined;
                end?: undefined;
                beginCaptures?: undefined;
                endCaptures?: undefined;
                patterns?: undefined;
            })[];
        };
        strings: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        labels: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        checkpoints: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
        directives: {
            patterns: {
                name: string;
                match: string;
            }[];
        };
    };
    scopeName: string;
};
export { getTextMateGrammar };
