define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DASH = exports.COLONS = exports.ARROW = exports.SNATCHED_TEXT = exports.EPISODE_TEXT = exports.SCENE_TEXT = exports.BookState = exports.GameState = exports.MusicState = exports.AnimeState = exports.SharedState = exports.makeSeparatorToken = exports.makeSpecialToken = exports.makeElementToken = exports.makeCompoundToken = exports.makeBasicToken = void 0;
    const makeBasicToken = (text) => ({ type: 'BASIC', text });
    exports.makeBasicToken = makeBasicToken;
    const makeCompoundToken = (left, right) => ({ type: 'COMPOUND', left, right });
    exports.makeCompoundToken = makeCompoundToken;
    const makeElementToken = (element) => ({ type: 'ELEMENT', element });
    exports.makeElementToken = makeElementToken;
    const makeSpecialToken = (special, text) => ({ type: 'SPECIAL', special, text });
    exports.makeSpecialToken = makeSpecialToken;
    const makeSeparatorToken = (sep) => ({ type: 'SEPARATOR', sep });
    exports.makeSeparatorToken = makeSeparatorToken;
    var SharedState;
    (function (SharedState) {
        SharedState[SharedState["ARROW"] = 0] = "ARROW";
        SharedState[SharedState["BBCODE_LEFT"] = 1] = "BBCODE_LEFT";
        SharedState[SharedState["BBCODE_DASH"] = 2] = "BBCODE_DASH";
        SharedState[SharedState["BBCODE_RIGHT"] = 3] = "BBCODE_RIGHT";
        SharedState[SharedState["BBCODE_LBRACKET"] = 4] = "BBCODE_LBRACKET";
        SharedState[SharedState["BBCODE_RBRACKET"] = 5] = "BBCODE_RBRACKET";
        SharedState[SharedState["BBCODE_YEAR"] = 6] = "BBCODE_YEAR";
        SharedState[SharedState["COLONS"] = 7] = "COLONS";
        SharedState[SharedState["BEGIN_PARSE"] = 8] = "BEGIN_PARSE";
        SharedState[SharedState["COMMON_TRAILING_FIELDS"] = 9] = "COMMON_TRAILING_FIELDS";
    })(SharedState || (exports.SharedState = SharedState = {}));
    var AnimeState;
    (function (AnimeState) {
        AnimeState[AnimeState["SOURCE"] = 100] = "SOURCE";
        AnimeState[AnimeState["CONTAINER"] = 101] = "CONTAINER";
        AnimeState[AnimeState["ASPECT_RATIO"] = 102] = "ASPECT_RATIO";
        AnimeState[AnimeState["VIDEO_CODEC"] = 103] = "VIDEO_CODEC";
        AnimeState[AnimeState["RESOLUTION"] = 104] = "RESOLUTION";
        AnimeState[AnimeState["AUDIO_CODEC"] = 105] = "AUDIO_CODEC";
        AnimeState[AnimeState["DUAL_AUDIO"] = 106] = "DUAL_AUDIO";
        AnimeState[AnimeState["SUBBING_AND_GROUP"] = 107] = "SUBBING_AND_GROUP";
        AnimeState[AnimeState["REMASTER"] = 108] = "REMASTER";
        AnimeState[AnimeState["TRAILING_FIELDS"] = 109] = "TRAILING_FIELDS";
    })(AnimeState || (exports.AnimeState = AnimeState = {}));
    var MusicState;
    (function (MusicState) {
        MusicState[MusicState["ENCODING"] = 200] = "ENCODING";
        MusicState[MusicState["BITRATE"] = 201] = "BITRATE";
        MusicState[MusicState["SOURCE"] = 202] = "SOURCE";
        MusicState[MusicState["LOG"] = 203] = "LOG";
        MusicState[MusicState["CUE"] = 204] = "CUE";
    })(MusicState || (exports.MusicState = MusicState = {}));
    var GameState;
    (function (GameState) {
        GameState[GameState["TYPE"] = 300] = "TYPE";
        GameState[GameState["PLATFORM"] = 301] = "PLATFORM";
        GameState[GameState["REGION"] = 302] = "REGION";
        GameState[GameState["ARCHIVED"] = 303] = "ARCHIVED";
        GameState[GameState["SCENE"] = 304] = "SCENE";
    })(GameState || (exports.GameState = GameState = {}));
    var BookState;
    (function (BookState) {
        BookState[BookState["TRANSLATION"] = 400] = "TRANSLATION";
        BookState[BookState["FORMAT"] = 401] = "FORMAT";
        BookState[BookState["ONGOING"] = 402] = "ONGOING";
    })(BookState || (exports.BookState = BookState = {}));
    exports.SCENE_TEXT = 'Scene';
    exports.EPISODE_TEXT = 'Episode ';
    exports.SNATCHED_TEXT = ' - Snatched';
    exports.ARROW = '»';
    exports.COLONS = ' :: ';
    exports.DASH = ' - ';
});
define("parser", ["require", "exports", "types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = exports.postParse = exports.mainParse = exports.preParse = exports.TRANSITION_ACTIONS = exports.maybeImage = exports.basename = exports.maybeList = exports.maybeFlag = exports.isSpecial = exports.switchCapture = exports.nullCapture = exports.capture = exports.captureT = exports.captureD = exports.captureDT = exports.toCompoundToken = exports.splitTransformer = exports.basicTransformer = exports.preCapture = exports.span = void 0;
    const span = (key, value, child) => {
        return { type: 'span', key, value: value || key, child: child !== null && child !== void 0 ? child : value };
    };
    exports.span = span;
    const preCapture = (pre, transformer) => {
        return (t, s) => {
            const [t1, s1] = pre(t, s);
            return transformer(t1, s1);
        };
    };
    exports.preCapture = preCapture;
    function assertBasicToken(t) {
        if (t.type != 'BASIC')
            throw new Error('Expected basic token, got ' + t);
    }
    const basicTransformer = (key1, key2) => {
        return (t) => {
            switch (t.type) {
                case 'BASIC':
                    return (0, exports.span)(key1, t.text);
                case 'COMPOUND':
                    console.assert(!!key2);
                    return [(0, exports.span)(key1, t.left), ' (', (0, exports.span)(key2, t.right), ')'];
                default:
                    throw new Error('Expected basic or compound token in basic transformer, got ' + t);
            }
        };
    };
    exports.basicTransformer = basicTransformer;
    const splitTransformer = (key1, key2) => {
        return (t) => {
            assertBasicToken(t);
            const i = t.text.lastIndexOf(' ');
            console.assert(i >= 0);
            return [(0, exports.span)(key1, t.text.substr(0, i)), ' ', (0, exports.span)(key2, t.text.slice(i + 1))];
        };
    };
    exports.splitTransformer = splitTransformer;
    const toCompoundToken = (t) => {
        if (t.type !== 'BASIC')
            return t;
        const paren = t.text.indexOf(' (');
        if (paren < 0 || t.text[t.text.length - 1] !== ')')
            return t;
        const left = t.text.slice(0, paren);
        const right = t.text.slice(paren + 2, t.text.length - 1);
        return (0, types_1.makeCompoundToken)(left, right);
    };
    exports.toCompoundToken = toCompoundToken;
    const captureDT = (decider, transformer) => {
        return (t, s) => [decider(t, s), transformer(t, s)];
    };
    exports.captureDT = captureDT;
    const captureD = (decider, key, key2) => (0, exports.captureDT)(decider, (0, exports.basicTransformer)(key, key2));
    exports.captureD = captureD;
    const captureT = (next, transform) => (0, exports.captureDT)(() => next, transform);
    exports.captureT = captureT;
    const capture = (next, key, key2) => (0, exports.captureD)(() => next, key, key2);
    exports.capture = capture;
    const nullCapture = (next) => (0, exports.captureT)(next, () => null);
    exports.nullCapture = nullCapture;
    const switchCapture = (predicate, captureTrue, captureFalse) => {
        return (t, s) => predicate(t, s) ? captureTrue(t, s) : captureFalse(t, s);
    };
    exports.switchCapture = switchCapture;
    const isSpecial = (type) => (t, s) => t.type === 'SPECIAL' && t.special === type;
    exports.isSpecial = isSpecial;
    const maybeFlag = (key, expected) => {
        return (t) => {
            if (t.type !== 'BASIC' || t.text !== expected)
                return null;
            return (0, exports.span)(key, expected);
        };
    };
    exports.maybeFlag = maybeFlag;
    const maybeList = (key, ...options) => {
        const set = new Set(options);
        return (t) => {
            if (t.type !== 'BASIC' || !set.has(t.text))
                return null;
            return (0, exports.span)(key, t.text);
        };
    };
    exports.maybeList = maybeList;
    const basename = (url) => url.split('/').slice(-1)[0].split('.')[0];
    exports.basename = basename;
    const maybeImage = (key, imageFile, value) => {
        return (t) => {
            if (t.type !== 'ELEMENT' || t.element.tagName != 'IMG')
                return null;
            const srcFile = (0, exports.basename)(t.element.src); // safe cast due to tagName check
            if (srcFile === imageFile || srcFile.startsWith(imageFile + '-'))
                return (0, exports.span)(key, value !== null && value !== void 0 ? value : key, t.element);
            else
                return null;
        };
    };
    exports.maybeImage = maybeImage;
    const TRAILING_IMAGES = [
        (0, exports.maybeImage)('freeleech', 'flicon', 'Freeleech'),
        (0, exports.maybeImage)('hentai', 'hentai', 'Uncensored'),
        (0, exports.maybeImage)('hentai', 'hentaic', 'Censored'),
        // Make highlight script compatible with Sneedex script https://animebytes.tv/forums.php?action=viewthread&threadid=28316
        (0, exports.maybeImage)('sneedex', 'n40di4', 'Sneedex')
    ];
    const fallbackTransformer = (0, exports.basicTransformer)('misc', 'misc');
    const trailingFieldsTransformer = (t, s) => {
        var _a;
        if (t.type === 'SPECIAL' && t.special === 'snatched') {
            return [' - ', (0, exports.span)('snatched', 'Snatched', 'Snatched')];
        }
        if (t.type === 'BASIC') {
            if (t.text === types_1.SCENE_TEXT)
                return (0, exports.span)('scene', types_1.SCENE_TEXT, types_1.SCENE_TEXT);
            if (t.text.startsWith(types_1.EPISODE_TEXT))
                return (0, exports.span)('episode', t.text.replace(types_1.EPISODE_TEXT, ''), t.text);
        }
        if (t.type !== 'ELEMENT')
            return fallbackTransformer(t, s);
        const imageMatches = TRAILING_IMAGES.map(trans => trans(t, s)).filter(x => x !== null);
        if (imageMatches) {
            return imageMatches[0];
        }
        if (t.element.tagName === 'FONT' && ((_a = t.element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) == 'Exclusive!') {
            return (0, exports.span)('exclusive', 'Exclusive', t.element);
        }
        return fallbackTransformer(t, s);
    };
    const FIRST_FIELDS = {
        'Blu-ray': 'anime', 'Web': 'anime', 'TV': 'anime',
        'DVD': 'anime', 'UHD Blu-ray': 'anime', 'DVD5': 'anime',
        'DVD9': 'anime', 'HD DVD': 'anime', 'VHS': 'anime',
        'VCD': 'anime', 'LD': 'anime',
        'MP3': 'music', 'FLAC': 'music', 'AAC': 'music',
        'Game': 'game', 'Patch': 'game', 'DLC': 'game',
        'Raw': 'book', 'Translated': 'book',
    };
    const START_STATES = {
        anime: types_1.AnimeState.SOURCE,
        music: types_1.MusicState.ENCODING,
        game: types_1.GameState.TYPE,
        book: types_1.BookState.TRANSLATION,
    };
    const initHandler = (t) => {
        var _a;
        if (t.type != 'BASIC' && t.type != 'COMPOUND')
            throw new Error('Need basic or compound as first token, not ' + t);
        const first = (t.type == 'COMPOUND' ? t.left : t.text);
        return [(_a = START_STATES[FIRST_FIELDS[first]]) !== null && _a !== void 0 ? _a : types_1.SharedState.COMMON_TRAILING_FIELDS, null];
    };
    const arrowTransformer = (t) => {
        if (t.type == 'SPECIAL' && t.special == 'arrow')
            return t.text;
        return null;
    };
    const specialTransformer = (t) => {
        if (t.type !== 'SPECIAL')
            throw new Error('Expected special token.');
        return t.text;
    };
    const GAME_REGIONS = ['Region Free', 'NTSC-J', 'NTSC-U', 'PAL', 'JPN', 'ENG', 'EUR'];
    const GAME_ARCHIVED = ['Archived', 'Unarchived'];
    const BOOK_FORMATS = ['Archived Scans', 'EPUB', 'PDF', 'Unarchived', 'Digital'];
    exports.TRANSITION_ACTIONS = {
        // i'm very sorry for this code.
        [types_1.SharedState.BBCODE_LEFT]: (0, exports.capture)(types_1.SharedState.BBCODE_DASH, 'left'),
        [types_1.SharedState.BBCODE_DASH]: (0, exports.switchCapture)((0, exports.isSpecial)('dash'), (0, exports.captureT)(types_1.SharedState.BBCODE_RIGHT, specialTransformer), (0, exports.nullCapture)(types_1.SharedState.BBCODE_LBRACKET)),
        [types_1.SharedState.BBCODE_RIGHT]: (0, exports.capture)(types_1.SharedState.BBCODE_LBRACKET, 'right'),
        [types_1.SharedState.BBCODE_LBRACKET]: (0, exports.switchCapture)((0, exports.isSpecial)('lbracket'), (0, exports.captureT)(types_1.SharedState.BBCODE_YEAR, specialTransformer), (0, exports.nullCapture)(types_1.SharedState.COLONS)),
        [types_1.SharedState.BBCODE_YEAR]: (0, exports.capture)(types_1.SharedState.BBCODE_RBRACKET, 'year'),
        [types_1.SharedState.BBCODE_RBRACKET]: (0, exports.captureT)(types_1.SharedState.COLONS, specialTransformer),
        [types_1.SharedState.COLONS]: (0, exports.captureT)(types_1.SharedState.BEGIN_PARSE, (t, s) => t.type === 'BASIC' ? t.text : null),
        [types_1.SharedState.ARROW]: (0, exports.captureT)(types_1.SharedState.BEGIN_PARSE, arrowTransformer),
        [types_1.SharedState.BEGIN_PARSE]: initHandler,
        [types_1.SharedState.COMMON_TRAILING_FIELDS]: (0, exports.captureT)(types_1.SharedState.COMMON_TRAILING_FIELDS, trailingFieldsTransformer),
        [types_1.AnimeState.SOURCE]: (0, exports.capture)(types_1.AnimeState.CONTAINER, 'source'),
        [types_1.AnimeState.CONTAINER]: (0, exports.preCapture)((t, s) => [(0, exports.toCompoundToken)(t), s], (0, exports.captureD)((t) => t.type === 'COMPOUND' ? types_1.AnimeState.ASPECT_RATIO : types_1.AnimeState.VIDEO_CODEC, 'container', 'region')),
        [types_1.AnimeState.ASPECT_RATIO]: (0, exports.captureD)((t, s) => s.source == 'DVD9' || s.source == 'DVD5'
            ? types_1.AnimeState.RESOLUTION : types_1.AnimeState.VIDEO_CODEC, 'aspectRatio'),
        [types_1.AnimeState.VIDEO_CODEC]: (0, exports.capture)(types_1.AnimeState.RESOLUTION, 'codec'),
        [types_1.AnimeState.RESOLUTION]: (0, exports.capture)(types_1.AnimeState.AUDIO_CODEC, 'resolution'),
        [types_1.AnimeState.AUDIO_CODEC]: (0, exports.captureT)(types_1.AnimeState.DUAL_AUDIO, (0, exports.splitTransformer)('audioCodec', 'audioChannels')),
        [types_1.AnimeState.DUAL_AUDIO]: (0, exports.captureT)(types_1.AnimeState.REMASTER, (0, exports.maybeFlag)('dualAudio', 'Dual Audio')),
        [types_1.AnimeState.REMASTER]: (0, exports.captureT)(types_1.AnimeState.SUBBING_AND_GROUP, (0, exports.maybeImage)('remastered', 'rmstr', 'Remastered')),
        [types_1.AnimeState.SUBBING_AND_GROUP]: (0, exports.capture)(types_1.SharedState.COMMON_TRAILING_FIELDS, 'subbing', 'group'),
        [types_1.MusicState.ENCODING]: (0, exports.capture)(types_1.MusicState.BITRATE, 'encoding'),
        [types_1.MusicState.BITRATE]: (0, exports.capture)(types_1.MusicState.SOURCE, 'bitrate'),
        [types_1.MusicState.SOURCE]: (0, exports.capture)(types_1.MusicState.LOG, 'source'),
        [types_1.MusicState.LOG]: (0, exports.captureT)(types_1.MusicState.CUE, (0, exports.maybeFlag)('log', 'Log')),
        [types_1.MusicState.CUE]: (0, exports.captureT)(types_1.SharedState.COMMON_TRAILING_FIELDS, (0, exports.maybeFlag)('cue', 'Cue')),
        [types_1.GameState.TYPE]: (0, exports.capture)(types_1.GameState.PLATFORM, 'type'),
        [types_1.GameState.PLATFORM]: (0, exports.capture)(types_1.GameState.REGION, 'platform'),
        [types_1.GameState.REGION]: (0, exports.captureT)(types_1.GameState.ARCHIVED, (0, exports.maybeList)('region', ...GAME_REGIONS)),
        [types_1.GameState.ARCHIVED]: (0, exports.captureT)(types_1.GameState.SCENE, (0, exports.maybeList)('archived', ...GAME_ARCHIVED)),
        [types_1.GameState.SCENE]: (0, exports.captureT)(types_1.SharedState.COMMON_TRAILING_FIELDS, (0, exports.maybeFlag)('scene', 'Scene')),
        [types_1.BookState.TRANSLATION]: (0, exports.capture)(types_1.BookState.FORMAT, 'translation', 'group'),
        [types_1.BookState.FORMAT]: (0, exports.captureT)(types_1.BookState.ONGOING, (0, exports.maybeList)('format', ...BOOK_FORMATS)),
        [types_1.BookState.ONGOING]: (0, exports.captureT)(types_1.SharedState.COMMON_TRAILING_FIELDS, (0, exports.maybeFlag)('ongoing', 'Ongoing')),
    };
    function preParse(tokens) {
        return tokens;
    }
    exports.preParse = preParse;
    function mainParse(tokens, start) {
        const output = [];
        const seenFields = {};
        let state = start;
        let i = 0;
        let j = 0;
        while (i < tokens.length) {
            if (j++ > 10000) {
                throw new Error("Iteration limit exceeded in parse.");
            }
            const token = tokens[i];
            if (token.type == 'SEPARATOR') {
                output.push(token.sep);
                i++;
                continue;
            }
            const handler = exports.TRANSITION_ACTIONS[state];
            if (!handler)
                throw new Error("No handler associated with state: " + state);
            const [nextState, result] = handler(token, seenFields);
            // console.debug("Parse state transition from " + state + ": ", [nextState, result]);
            if (result != null) {
                i++;
                const resultArray = Array.isArray(result) ? result : [result];
                for (const e of resultArray) {
                    if (!(typeof e == 'string' ? e : e.child))
                        continue;
                    if (typeof e != 'string' && e.key)
                        seenFields[e.key] = e.value;
                    output.push(e);
                }
            }
            state = nextState;
        }
        return [output, seenFields];
    }
    exports.mainParse = mainParse;
    const templateSpan = document.createElement('span');
    templateSpan.className = 'userscript-highlight torrent-field';
    function postParse(parsed) {
        return parsed.map(e => {
            if (typeof e == 'string') {
                return e;
            }
            else {
                const span = templateSpan.cloneNode(false);
                if (e.key)
                    span.dataset[e.key] = e.value;
                span.append(e.child);
                span.dataset.field = e.value;
                return span;
            }
        });
    }
    exports.postParse = postParse;
    function parse(tokens, start) {
        const [parsed, fields] = mainParse(preParse(tokens), start);
        return [postParse(parsed), fields];
    }
    exports.parse = parse;
});
define("lexer", ["require", "exports", "types"], function (require, exports, types_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenise = exports.mainTokenise = exports.preTokenise = exports.tokeniseElement = exports.tokeniseString = void 0;
    function tokeniseString(input, delim) {
        switch (input) {
            case types_2.ARROW:
                return [(0, types_2.makeSpecialToken)('arrow', types_2.ARROW + ' ')];
            case types_2.SNATCHED_TEXT:
                return [(0, types_2.makeSpecialToken)('snatched', 'Snatched')];
            case types_2.DASH:
                return [(0, types_2.makeSpecialToken)('dash', types_2.DASH)];
            case ' [':
                return [(0, types_2.makeSpecialToken)('lbracket', ' [')];
            case ']':
                return [(0, types_2.makeSpecialToken)('rbracket', ']')];
        }
        const RPAREN_WITH_SEP = ')' + delim;
        const LPAREN_OR_SEP = [
            delim, 'Raw (', 'Translated (', 'Softsubs (', 'Hardsubs (', 'RAW ('
        ];
        let i = 0;
        let j = 0;
        const output = [];
        while (i < input.length) {
            if (j++ > 10000) {
                throw new Error("Iteration limit exceeded in tokeniseString");
            }
            let remaining = input.slice(i);
            // find the next separator or compound expression, if it exists.
            let markerIndex = Infinity;
            let marker = null;
            for (const x of LPAREN_OR_SEP) {
                const n = remaining.indexOf(x);
                if (n >= 0 && n < markerIndex) {
                    markerIndex = n;
                    marker = x;
                }
            }
            // if no separator to the right, consume the rest of the string.
            if (marker === null) {
                output.push((0, types_2.makeBasicToken)(remaining));
                i += remaining.length;
            }
            else if (marker === delim) {
                // if next is a separator, consume up to that separator.
                if (markerIndex > 0)
                    output.push((0, types_2.makeBasicToken)(remaining.slice(0, markerIndex).trim()));
                output.push((0, types_2.makeSeparatorToken)(delim));
                i += markerIndex + marker.length;
            }
            else {
                // next is a compound expression. consume up to the close parens.
                i += marker.length; // consume the left and open paren.
                // find closing paren with separator.
                const inner = remaining.slice(marker.length);
                const closeSep = inner.indexOf(RPAREN_WITH_SEP);
                let right;
                if (closeSep < 0) {
                    // no closing paren with separator, consume to end of string
                    // and remove close paren character.
                    right = inner.replace(/\)$/, '');
                    i += inner.length;
                }
                else {
                    // consume to closing paren separator, excluding close paren.
                    right = inner.substr(0, closeSep);
                    if (right[right.length - 1] == ')')
                        right = right.substring(0, -1);
                    i += closeSep + RPAREN_WITH_SEP.length;
                }
                output.push((0, types_2.makeCompoundToken)(marker.split(' ')[0], right));
                if (closeSep >= 0) {
                    output.push((0, types_2.makeSeparatorToken)(delim));
                }
            }
        }
        return output;
    }
    exports.tokeniseString = tokeniseString;
    function tokeniseElement(input) {
        return (0, types_2.makeElementToken)(input);
    }
    exports.tokeniseElement = tokeniseElement;
    function preTokenise(nodes) {
        const output = [];
        let i = 0;
        for (const node of nodes) {
            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    let text = node.textContent;
                    if (i === 0) {
                        if (text.startsWith(types_2.ARROW)) {
                            output.push(types_2.ARROW);
                            text = text.slice(1);
                        }
                        text = text.trimStart();
                        const colons = text.indexOf(types_2.COLONS);
                        if (colons >= 0) {
                            let left = text.slice(0, colons);
                            let year = null;
                            const yearMatch = / \[(\d{4})\]$/.exec(left);
                            if (yearMatch) {
                                year = yearMatch[1];
                                left = left.slice(0, yearMatch.index);
                            }
                            let right = null;
                            const dash = left.lastIndexOf(types_2.DASH);
                            if (dash != -1) {
                                right = left.slice(dash + types_2.DASH.length); // everything after dash
                                left = left.slice(0, dash); // everything before dash
                            }
                            output.push(left);
                            if (right) {
                                output.push(types_2.DASH);
                                output.push(right);
                            }
                            if (year) {
                                output.push(' [');
                                output.push(year);
                                output.push(']');
                            }
                            output.push(types_2.COLONS);
                            text = text.slice(colons + types_2.COLONS.length).trimLeft();
                        }
                    }
                    if (i === nodes.length - 1) {
                        text = text.trimEnd();
                        if (text.endsWith(types_2.SNATCHED_TEXT.trimStart())) {
                            output.push(text.replace(types_2.SNATCHED_TEXT.trimStart(), '').trimEnd());
                            text = types_2.SNATCHED_TEXT;
                        }
                    }
                    output.push(text);
                    break;
                case Node.ELEMENT_NODE:
                    output.push(node);
                    break;
                default:
                    throw new Error("Unknown child node: " + node);
            }
            i++;
        }
        return output;
    }
    exports.preTokenise = preTokenise;
    function mainTokenise(input, delim) {
        const output = [];
        for (const x of input) {
            if (typeof x == 'string')
                output.push(...tokeniseString(x, delim));
            else
                output.push(tokeniseElement(x));
        }
        return output;
    }
    exports.mainTokenise = mainTokenise;
    function tokenise(nodes, delim) {
        return mainTokenise(preTokenise(nodes), delim);
    }
    exports.tokenise = tokenise;
});
define("highlighter", ["require", "exports", "parser", "lexer", "types"], function (require, exports, parser_1, lexer_1, types_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.test = exports.main = exports.highlight = void 0;
    function highlight(links, start, className, defaultDelim) {
        const count = (needle, haystack) => { var _a; return ((_a = haystack.match(needle)) !== null && _a !== void 0 ? _a : []).length; };
        const HIGHLIGHT_CLASS = 'userscript-highlight';
        let success = 0;
        console.log(`Highlighting ${links.length} elements with ${className} class...`);
        const startTime = Date.now();
        for (const el of links) {
            if (el.classList.contains(HIGHLIGHT_CLASS)) {
                console.error("Highlighter: Refusing to highlight element which is already "
                    + 'highlighted', el);
                break;
            }
            let tokens = null;
            let output = null;
            let fields = null;
            try {
                el.classList.add(HIGHLIGHT_CLASS, className);
                let delim = defaultDelim;
                if (delim) {
                    // use given delim.
                }
                else if (el.href.indexOf('torrents.php') != -1) {
                    delim = ' | ';
                }
                else if (el.href.indexOf('torrents2.php') != -1) {
                    delim = ' / ';
                }
                else {
                    const pipes = count(/ \| /g, el.textContent);
                    const slashes = count(/ \/ /g, el.textContent);
                    delim = pipes > slashes ? ' | ' : ' / ';
                }
                tokens = (0, lexer_1.tokenise)(el.childNodes, delim);
                [output, fields] = (0, parser_1.parse)(tokens, start);
                while (el.hasChildNodes())
                    el.removeChild(el.lastChild);
                const df = document.createDocumentFragment();
                df.append(...output);
                el.appendChild(df);
                let fieldsString = '';
                for (const [k, v] of Object.entries(fields)) {
                    el.dataset[k] = v;
                    fieldsString += v.replace(/\s/g, '_') + ' ';
                }
                el.dataset.fields = fieldsString;
                if (fields.misc !== undefined) {
                    throw 'misc';
                }
                success++;
            }
            catch (e) {
                switch (e) {
                    case 'misc':
                        console.error('Highlighter: Generated data-misc field for torrent. '
                            + 'This might be due to a lexer/parser bug or unsupported data field.\n'
                            + el.href + '\n'
                            + JSON.stringify(el.textContent));
                        break;
                    default:
                        console.error("Highlighter: Fatal error while highlighting torrent: ", e);
                        console.log("Element: ", el);
                        // console.log("Child nodes: ", Array.from(el.childNodes));
                        console.log("Tokenised: ", tokens);
                        // console.log("Converted: ", output);
                        console.log("Data fields: ", fields);
                        console.log("------------------------------------");
                        break;
                }
            }
        }
        console.log(`Done highlighting in ${Date.now() - startTime} ms: ${success} successful, ${links.length - success} failed.`);
        return success;
    }
    exports.highlight = highlight;
    function main() {
        const q = (s) => document.querySelectorAll(s);
        const TORRENT_PAGE_QUERY = '.group_torrent > td > a[href*="&torrentid="]';
        highlight(q(TORRENT_PAGE_QUERY), types_3.SharedState.ARROW, 'torrent-page');
        // torrents on search result pages are always separated by ' | '.
        const TORRENT_SEARCH_QUERY = '.torrent_properties > a[href*="&torrentid="]';
        highlight(q(TORRENT_SEARCH_QUERY), types_3.SharedState.BEGIN_PARSE, 'torrent-page', ' | ');
        const TORRENT_BBCODE_QUERY = ':not(.group_torrent)>:not(.torrent_properties)>a[href*="/torrent/"]:not([title])';
        highlight(q(TORRENT_BBCODE_QUERY), types_3.SharedState.BBCODE_LEFT, 'torrent-bbcode');
    }
    exports.main = main;
    function test() {
        console.log("Testing...");
    }
    exports.test = test;
});
//# sourceMappingURL=https://raw.githubusercontent.com/momentary0/AB-Userscripts/master/highlights-2/dist/bundle.js.map