define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeBasicToken = (text) => ({ type: 'BASIC', text });
    exports.makeCompoundToken = (left, right) => ({ type: 'COMPOUND', left, right });
    exports.makeElementToken = (element) => ({ type: 'ELEMENT', element });
    exports.makeSpecialToken = (special) => ({ type: 'SPECIAL', special });
    exports.makeSeparatorToken = () => ({ type: 'SEPARATOR' });
    var SharedState;
    (function (SharedState) {
        SharedState[SharedState["ARROW"] = 0] = "ARROW";
        SharedState[SharedState["BEGIN_PARSE"] = 1] = "BEGIN_PARSE";
        SharedState[SharedState["COMMON_TRAILING_FIELDS"] = 2] = "COMMON_TRAILING_FIELDS";
    })(SharedState = exports.SharedState || (exports.SharedState = {}));
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
    })(AnimeState = exports.AnimeState || (exports.AnimeState = {}));
    var MusicState;
    (function (MusicState) {
        MusicState[MusicState["ENCODING"] = 200] = "ENCODING";
        MusicState[MusicState["BITRATE"] = 201] = "BITRATE";
        MusicState[MusicState["SOURCE"] = 202] = "SOURCE";
        MusicState[MusicState["LOG"] = 203] = "LOG";
        MusicState[MusicState["CUE"] = 204] = "CUE";
    })(MusicState = exports.MusicState || (exports.MusicState = {}));
    var GameState;
    (function (GameState) {
        GameState[GameState["TYPE"] = 300] = "TYPE";
        GameState[GameState["PLATFORM"] = 301] = "PLATFORM";
        GameState[GameState["REGION"] = 302] = "REGION";
        GameState[GameState["ARCHIVED"] = 303] = "ARCHIVED";
        GameState[GameState["SCENE"] = 304] = "SCENE";
    })(GameState = exports.GameState || (exports.GameState = {}));
    var BookState;
    (function (BookState) {
        BookState[BookState["TRANSLATION"] = 400] = "TRANSLATION";
        BookState[BookState["FORMAT"] = 401] = "FORMAT";
        BookState[BookState["ONGOING"] = 402] = "ONGOING";
    })(BookState = exports.BookState || (exports.BookState = {}));
    exports.SNATCHED_TEXT = ' - Snatched';
    exports.ARROW = '»';
});
define("parser", ["require", "exports", "types"], function (require, exports, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SEP_SYMBOL = Symbol('sep');
    exports.span = (key, value, child) => {
        if (child === undefined)
            child = value;
        return { type: 'span', key, value, child };
    };
    exports.preCapture = (pre, transformer) => {
        return (t, s) => {
            const [t1, s1] = pre(t, s);
            return transformer(t1, s1);
        };
    };
    function assertBasicToken(t) {
        if (t.type != 'BASIC')
            throw new Error('Expected basic token, got ' + t);
    }
    exports.basicTransformer = (key1, key2) => {
        return (t, s) => {
            switch (t.type) {
                case 'BASIC':
                    return exports.span(key1, t.text);
                case 'COMPOUND':
                    console.assert(!!key2);
                    return [exports.span(key1, t.left), ' (', exports.span(key2, t.right), ')'];
                default:
                    throw new Error('Expected basic or compound token in basic transformer, got ' + t);
            }
        };
    };
    exports.splitTransformer = (key1, key2) => {
        return (t, s) => {
            assertBasicToken(t);
            const i = t.text.indexOf(' ');
            console.assert(i >= 0);
            return [exports.span(key1, t.text.substr(0, i)), ' ', exports.span(key2, t.text.slice(i + 1))];
        };
    };
    exports.toCompoundToken = (t) => {
        if (t.type !== 'BASIC')
            return t;
        const paren = t.text.indexOf(' (');
        if (paren < 0 || t.text[t.text.length - 1] !== ')')
            return t;
        const left = t.text.slice(0, paren);
        const right = t.text.slice(paren + 2, t.text.length - 1);
        return types_1.makeCompoundToken(left, right);
    };
    exports.captureDT = (decider, transformer) => {
        return (t, s) => [decider(t, s), transformer(t, s)];
    };
    exports.captureD = (decider, key, key2) => exports.captureDT(decider, exports.basicTransformer(key, key2));
    exports.captureT = (next, transform) => exports.captureDT(() => next, transform);
    exports.capture = (next, key, key2) => exports.captureD(() => next, key, key2);
    exports.maybeFlag = (key, expected) => {
        return (t, s) => {
            if (t.type !== 'BASIC' || t.text !== expected)
                return null;
            return exports.span(key, expected);
        };
    };
    exports.maybeList = (key, ...options) => {
        const set = new Set(options);
        return (t, s) => {
            if (t.type !== 'BASIC' || !set.has(t.text))
                return null;
            return exports.span(key, t.text);
        };
    };
    exports.basename = (url) => url.split('/').slice(-1)[0].split('.')[0];
    exports.maybeImage = (key, imageFile, value) => {
        return (t, s) => {
            if (t.type !== 'ELEMENT' || t.element.tagName != 'IMG')
                return null;
            if (exports.basename(t.element.src) !== imageFile)
                return null;
            return exports.span(key, value !== null && value !== void 0 ? value : imageFile, t.element);
        };
    };
    const TRAILING_IMAGES = [
        exports.maybeImage('freeleech', 'flicon'),
        exports.maybeImage('hentai', 'hentai', 'Uncensored'),
        exports.maybeImage('hentai', 'hentaic', 'Censored'),
    ];
    const fallbackTransformer = exports.basicTransformer('misc', 'misc');
    const trailingFieldsTransformer = (t, s) => {
        var _a;
        if (t.type === 'SPECIAL' && t.special === 'snatched') {
            return [' - ', exports.span('snatched', '', 'Snatched')];
        }
        if (t.type !== 'ELEMENT') {
            return fallbackTransformer(t, s);
        }
        const imageMatches = TRAILING_IMAGES.map(trans => trans(t, s)).filter(x => x !== null);
        if (imageMatches) {
            return imageMatches[0];
        }
        if (t.element.tagName === 'FONT' && ((_a = t.element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) == 'Exclusive!') {
            return exports.span('exclusive', '', t.element);
        }
        return exports.span('misc', '', t.element);
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
    const initHandler = (t, s) => {
        if (t.type != 'BASIC' && t.type != 'COMPOUND')
            throw new Error('Need basic or compound as first token, not ' + t);
        const first = (t.type == 'COMPOUND' ? t.left : t.text);
        if (FIRST_FIELDS[first] === undefined)
            throw new Error('Unknown first field text: ' + first);
        return [START_STATES[FIRST_FIELDS[first]], null];
    };
    const arrowTransformer = (t, s) => {
        if (t.type == 'SPECIAL' && t.special == 'arrow')
            return types_1.ARROW + ' ';
        return null;
    };
    const GAME_REGIONS = ['Region Free', 'NTSC-J', 'NTSC-U', 'PAL', 'JPN', 'ENG', 'EUR'];
    const GAME_ARCHIVED = ['Archived', 'Unarchived'];
    const BOOK_FORMATS = ['Archived Scans', 'EPUB', 'PDF', 'Unarchived', 'Digital'];
    exports.TRANSITION_ACTIONS = {
        [types_1.SharedState.ARROW]: exports.captureT(types_1.SharedState.BEGIN_PARSE, arrowTransformer),
        [types_1.SharedState.BEGIN_PARSE]: initHandler,
        [types_1.SharedState.COMMON_TRAILING_FIELDS]: exports.captureT(types_1.SharedState.COMMON_TRAILING_FIELDS, trailingFieldsTransformer),
        [types_1.AnimeState.SOURCE]: exports.capture(types_1.AnimeState.CONTAINER, 'source'),
        [types_1.AnimeState.CONTAINER]: exports.preCapture((t, s) => [exports.toCompoundToken(t), s], exports.captureD((t) => t.type === 'COMPOUND' ? types_1.AnimeState.ASPECT_RATIO : types_1.AnimeState.VIDEO_CODEC, 'container', 'region')),
        [types_1.AnimeState.ASPECT_RATIO]: exports.captureD((t, s) => s.source == 'DVD9' || s.source == 'DVD5'
            ? types_1.AnimeState.RESOLUTION : types_1.AnimeState.VIDEO_CODEC, 'aspectRatio'),
        [types_1.AnimeState.VIDEO_CODEC]: exports.capture(types_1.AnimeState.RESOLUTION, 'codec'),
        [types_1.AnimeState.RESOLUTION]: exports.capture(types_1.AnimeState.AUDIO_CODEC, 'resolution'),
        [types_1.AnimeState.AUDIO_CODEC]: exports.captureT(types_1.AnimeState.DUAL_AUDIO, exports.splitTransformer('audioCodec', 'audioChannels')),
        [types_1.AnimeState.DUAL_AUDIO]: exports.captureT(types_1.AnimeState.REMASTER, exports.maybeFlag('dualAudio', 'Dual Audio')),
        [types_1.AnimeState.REMASTER]: exports.captureT(types_1.AnimeState.SUBBING_AND_GROUP, exports.maybeImage('remastered', 'rmstr')),
        [types_1.AnimeState.SUBBING_AND_GROUP]: exports.capture(types_1.SharedState.COMMON_TRAILING_FIELDS, 'subbing', 'group'),
        [types_1.MusicState.ENCODING]: exports.capture(types_1.MusicState.BITRATE, 'encoding'),
        [types_1.MusicState.BITRATE]: exports.capture(types_1.MusicState.SOURCE, 'bitrate'),
        [types_1.MusicState.SOURCE]: exports.capture(types_1.MusicState.LOG, 'source'),
        [types_1.MusicState.LOG]: exports.captureT(types_1.MusicState.CUE, exports.maybeFlag('log', 'Log')),
        [types_1.MusicState.CUE]: exports.captureT(types_1.SharedState.COMMON_TRAILING_FIELDS, exports.maybeFlag('cue', 'Cue')),
        [types_1.GameState.TYPE]: exports.capture(types_1.GameState.PLATFORM, 'type'),
        [types_1.GameState.PLATFORM]: exports.capture(types_1.GameState.REGION, 'platform'),
        [types_1.GameState.REGION]: exports.captureT(types_1.GameState.ARCHIVED, exports.maybeList('region', ...GAME_REGIONS)),
        [types_1.GameState.ARCHIVED]: exports.captureT(types_1.GameState.SCENE, exports.maybeList('archived', ...GAME_ARCHIVED)),
        [types_1.GameState.SCENE]: exports.captureT(types_1.SharedState.COMMON_TRAILING_FIELDS, exports.maybeFlag('scene', 'Scene')),
        [types_1.BookState.TRANSLATION]: exports.capture(types_1.BookState.FORMAT, 'translation', 'group'),
        [types_1.BookState.FORMAT]: exports.captureT(types_1.BookState.ONGOING, exports.maybeList('format', ...BOOK_FORMATS)),
        [types_1.BookState.ONGOING]: exports.captureT(types_1.SharedState.COMMON_TRAILING_FIELDS, exports.maybeFlag('ongoing', 'Ongoing')),
    };
    function preParse(tokens) {
        return tokens;
    }
    exports.preParse = preParse;
    function mainParse(tokens) {
        const output = [];
        const seenFields = {};
        let state = types_1.SharedState.ARROW;
        let i = 0;
        let j = 0;
        while (i < tokens.length) {
            if (j++ > 10000) {
                throw new Error("Iteration limit exceeded in parse.");
            }
            const token = tokens[i];
            if (token.type == 'SEPARATOR') {
                output.push(exports.SEP_SYMBOL);
                i++;
                continue;
            }
            const handler = exports.TRANSITION_ACTIONS[state];
            console.assert(handler != null);
            const [nextState, result] = handler(token, seenFields);
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
    function postParse(parsed, delim) {
        return parsed.map(e => {
            if (typeof e == 'string') {
                return e;
            }
            else if (e === exports.SEP_SYMBOL) {
                return delim;
            }
            else {
                const span = templateSpan.cloneNode(false);
                if (e.key)
                    span.dataset[e.key] = e.value;
                span.append(e.child);
                return span;
            }
        });
    }
    exports.postParse = postParse;
    function parse(tokens, delim) {
        const [parsed, fields] = mainParse(preParse(tokens));
        return [postParse(parsed, delim), fields];
    }
    exports.parse = parse;
});
define("lexer", ["require", "exports", "types"], function (require, exports, types_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function tokeniseString(input, delim) {
        if (input === types_2.ARROW) {
            return [types_2.makeSpecialToken('arrow')];
        }
        else if (input === types_2.SNATCHED_TEXT) {
            return [types_2.makeSpecialToken('snatched')];
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
                output.push(types_2.makeBasicToken(remaining));
                i += remaining.length;
            }
            else if (marker === delim) {
                // if next is a separator, consume up to that separator.
                if (markerIndex > 0)
                    output.push(types_2.makeBasicToken(remaining.slice(0, markerIndex).trim()));
                output.push(types_2.makeSeparatorToken());
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
                output.push(types_2.makeCompoundToken(marker.split(' ')[0], right));
                if (closeSep >= 0) {
                    output.push(types_2.makeSeparatorToken());
                }
            }
        }
        return output;
    }
    exports.tokeniseString = tokeniseString;
    function tokeniseElement(input) {
        return types_2.makeElementToken(input);
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
define("highlighter", ["require", "exports", "parser", "lexer"], function (require, exports, parser_1, lexer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function highlight(links, className) {
        let success = 0;
        console.log("Highlighting " + links.length + " torrent elements...");
        const start = Date.now();
        for (const el of links) {
            let tokens = null;
            let output = null;
            let fields = null;
            try {
                const delim = el.href.indexOf('torrents.php') !== -1 ? ' | ' : ' / ';
                tokens = lexer_1.tokenise(el.childNodes, delim);
                [output, fields] = parser_1.parse(tokens, delim);
                el.classList.add('userscript-highlight', className);
                while (el.hasChildNodes()) {
                    el.removeChild(el.lastChild);
                }
                const df = document.createDocumentFragment();
                df.append(...output);
                el.appendChild(df);
                for (const [k, v] of Object.entries(fields)) {
                    el.dataset[k] = v;
                }
                if (fields.misc !== undefined) {
                    console.warn('Highlighter: Generated data-misc field for torrent. ' +
                        'This might be due to a lexer/parser bug or unsupported data field.', el.href);
                    throw 'data-misc';
                }
                success++;
            }
            catch (e) {
                if (e !== 'data-misc')
                    console.error("Highlighter: Error while highlighting torrent: ", e);
                console.log("Element: ", el);
                // console.log("Child nodes: ", Array.from(el.childNodes));
                console.log("Tokenised: ", tokens);
                // console.log("Converted: ", output);
                console.log("Data fields: ", fields);
                console.log("------------------------------------");
            }
        }
        console.log(`Done highlighting in ${Date.now() - start} ms: ${success} successful, ${links.length - success} failed.`);
        return success;
    }
    exports.highlight = highlight;
    function main() {
        const TORRENT_PAGE_QUERY = '.group_torrent > td > a[href*="&torrentid="], .torrent_properties > a[href*="&torrentid="]';
        const links = document.querySelectorAll(TORRENT_PAGE_QUERY);
        highlight(links, 'torrent-page');
    }
    exports.main = main;
    function test() {
        console.log("Testing...");
    }
    exports.test = test;
});
//# sourceMappingURL=https://raw.githubusercontent.com/momentary0/AB-Userscripts/master/highlights-2/dist/bundle.js.map