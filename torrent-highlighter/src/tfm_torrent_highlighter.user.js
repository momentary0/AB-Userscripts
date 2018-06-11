// ==UserScript==
// @name         TFM's torrent highlighter
// @namespace    TheFallingMan
// @version      0.1.0
// @description  Adds attributes to torrent links, allowing CSS styling.
// @author       TheFallingMan
// @icon         https://animebytes.tv/favicon.ico
// @match        https://animebytes.tv/*
// @license      GPL-3.0
// ==/UserScript==

(function TFMTorrentHighlighter() {
    function _debug() { return false; }

    class TorrentPropertyParser {

        constructor(linkElement, delimiter) {
            this.linkElement = linkElement;
            this.delim = delimiter;
            this.spanTemplate = document.createElement('span');
            this.spanTemplate.className = 'userscript-highlight torrent-field';
            this.docFrag = document.createDocumentFragment();
        }

        parse() {
            _debug() && console.log(this.linkElement.textContent);
            this.fields = [];
            this.index = 0;
            this.handlers = {};
            this.nodeAppended = false;

            let state = GlobalStates.INITIALISE;
            let func;
            while (state) {
                func = this.handlers[state];
                if (!func)
                    func = GlobalHandlers[state];

                try {
                    state = func.call(this);
                } catch (e) {
                    console.error(e);
                    _debug() && console.log(this.linkElement);
                    _debug() && console.log(this.index);
                    _debug() && console.log(this.fields);
                    _debug() && console.log(state);
                    throw e;
                }
                if (this.index >= this.fields.length) {
                    if (state !== GlobalStates.FINISHED) {
                        state = GlobalHandlers[GlobalStates.INSERT_DOCFRAG].call(this);
                    }
                }
            }


            _debug() && console.log(state);
            _debug() && console.log(this.docFrag);
            _debug() && console.log(this.docFrag);
        }

        getNext() {
            return this.fields[this.index++];
        }

        peekNext() {
            return this.fields[this.index];
        }

        newSpan(content, key, value) {
            this.linkElement.dataset[key] = value;

            let span = this.spanTemplate.cloneNode(false);

            span.dataset[key] = value;
            if (content.nodeType) {
                this.nodeAppended = true;
                span.appendChild(content);
            } else {
                span.textContent = content;
            }
            return span;
        }

        appendSpan(content, key, value) {
            this.docFrag.appendChild(
                this.newSpan(content, key, value));
        }

        appendText(text) {
            this.docFrag.appendChild(document.createTextNode(text));
        }

        appendDelim() {
            this.docFrag.appendChild(document.createTextNode(this.delim));
        }

        clearChildren() {
            while (this.linkElement.hasChildNodes()) {
                this.linkElement.removeChild(this.linkElement.lastChild);
            }
        }
    }

    function newCaptureHandler(key, nextState, delim=true) {
        return function () {
            if (delim)
                this.appendDelim();
            this.appendSpan(this.peekNext(), key, this.peekNext());
            this.index++;
            return nextState;
        };
    }

    function newFlagHandler(value, key, nextState, stateIfFalse=null) {
        return function __flagHandler() {
            let field = this.peekNext();
            if (value === field) {
                this.index++;
                this.appendDelim();
                this.appendSpan(field, key, '');
            } else {
                if (stateIfFalse !== null) {
                    return stateIfFalse;
                }
            }
            return nextState;
        };
    }

    function newListHandler(values, key, nextState, stateIfFalse=null) {
        return function __flagHandler() {
            let field = this.peekNext();
            if (values.indexOf(field) !== -1) {
                this.index++;
                this.appendDelim();
                this.appendSpan(field, key, field);
            } else if (stateIfFalse !== null) {
                return stateIfFalse;
            }
            return nextState;
        };
    }

    const GlobalStates = Object.freeze({
        INITIALISE: -11,
        DETECTING: -1,
        BEGIN: -2,
        COMMON_TRAILING_FIELDS: -3, // FL, exclusive, snatched, hentai, etc.
        INSERT_DOCFRAG: -5,
        FINISHED: false,
        ERROR: -10,
    });

    const MusicStates = Object.freeze({
        ENCODING: 1,
        BITRATE: 2,
        SOURCE: 3,
        LOG: 4,
        CUE: 5
    });
    /**
     * @function
     * @typedef {() => number} transitionHandler
     * @param {TorrentPropertyParser} this
     */
    null;

    let MusicHandlers = ({
        [GlobalStates.BEGIN]: newCaptureHandler('encoding', MusicStates.BITRATE, false),
        [MusicStates.BITRATE]: newCaptureHandler('bitrate', MusicStates.SOURCE),
        [MusicStates.SOURCE]: newCaptureHandler('source', MusicStates.LOG),
        [MusicStates.LOG]: newFlagHandler('Log', 'log', MusicStates.CUE),
        [MusicStates.CUE]: newFlagHandler('Cue', 'cue', GlobalStates.COMMON_TRAILING_FIELDS)
    });

    const AnimeStates = Object.freeze({
        SOURCE: 1,
        CONTAINER: 2,
        ASPECT_RATIO: 3,
        VIDEO_CODEC: 4,
        RESOLUTION: 5,
        AUDIO_CODEC_AND_CHANNELS: 6,
        DUAL_AUDIO: 7,
        SUBBING_AND_GROUP: 8,
        REMASTER: 9,
        TRAILING_FIELDS: 10
    });

    /**
     * @type {Object<number, transitionHandler>}
     */
    let AnimeHandlers = ({
        [GlobalStates.BEGIN]: newCaptureHandler('source', AnimeStates.CONTAINER, false),
        [AnimeStates.CONTAINER]: function CONTAINER() {
            let field = this.getNext();
            if (field.charAt(field.length-1) === ')') {
                let left = field.substr(0, field.indexOf(' ('));
                let right = field.slice(field.indexOf(' (')+2, -1);
                this.appendDelim();
                this.appendSpan(left, 'container', left);
                this.appendText(' (');
                this.appendSpan(right, 'region', right);
                this.appendText(')');
                return AnimeStates.ASPECT_RATIO;
            } else {
                this.appendDelim();
                this.appendSpan(field, 'container', field);
                return AnimeStates.VIDEO_CODEC;
            }
        },
        [AnimeStates.ASPECT_RATIO]: function ASPECT_RATIO() {
            let field = this.getNext();
            this.appendDelim();
            this.appendSpan(field, 'aspectRatio', field);
            if (this.fields[0] === 'DVD5' || this.fields[0] === 'DVD9') {
                return AnimeStates.RESOLUTION;
            } else {
                return AnimeStates.VIDEO_CODEC;
            }
        },
        [AnimeStates.VIDEO_CODEC]: newCaptureHandler('codec', AnimeStates.RESOLUTION),
        [AnimeStates.RESOLUTION]: newCaptureHandler('resolution', AnimeStates.AUDIO_CODEC_AND_CHANNELS),
        [AnimeStates.AUDIO_CODEC_AND_CHANNELS]: function AUDIO_CODEC() {
            let field = this.getNext();
            let codec = field.substr(0, field.lastIndexOf(' '));
            let channels = field.substr(field.lastIndexOf(' ')+1);
            if (channels.charAt(1) !== '.')
                return GlobalStates.ERROR;
            this.appendDelim();
            this.appendSpan(codec, 'audioCodec', codec);
            this.appendText(' ');
            this.appendSpan(channels, 'audioChannels', channels);

            return AnimeStates.DUAL_AUDIO;
        },
        [AnimeStates.DUAL_AUDIO]: newFlagHandler('Dual Audio', 'dualAudio', AnimeStates.REMASTER),
        [AnimeStates.REMASTER]: function REMASTER() {
            let node = this.peekNext();
            if (node.tagName === 'IMG'
            && node.alt === 'Remastered') {
                this.index++;
                this.appendDelim();
                this.appendSpan(node, 'remastered', '');

            }
            return AnimeStates.SUBBING_AND_GROUP;
        },
        [AnimeStates.SUBBING_AND_GROUP]: function SUBBING() {
            if (simpleSubbingHandler.call(this)) {
                return GlobalStates.COMMON_TRAILING_FIELDS;
            } else {
                let field = this.getNext();
                if (field.nodeType)
                    return;
                field = field.trim();
                let left = field.substr(0, field.indexOf(' '));
                if (left === 'Softsubs' || left === 'Hardsubs' || left === 'RAW') {
                    this.appendDelim();
                    this.appendSpan(left, 'subbing', left);
                    this.appendText(' (');
                    let groupString = field.substr(field.indexOf(' (')+2);
                    while (!groupString.endsWith(')') && this.index < this.fields.length) {
                        groupString += this.delim;
                        groupString += this.getNext();
                    }
                    groupString = groupString.substr(0, groupString.length-1);
                    this.appendSpan(groupString, 'group', groupString);
                    this.appendText(')');

                }
            }
            return GlobalStates.COMMON_TRAILING_FIELDS;
        }
    });

    let simpleSubbingHandler = newListHandler(['Softsubs', 'Hardsubs', 'RAW'], 'subbing', true, false);

    const GameStates = {
        TYPE: 1,
        PLATFORM: 2,
        REGION: 3,
        ARCHIVED: 4,
        SCENE: 5
    };

    let GameHandlers = ({
        [GlobalStates.BEGIN]: newCaptureHandler('type', GameStates.PLATFORM, false),
        [GameStates.PLATFORM]: newCaptureHandler('platform', GameStates.REGION),
        [GameStates.REGION]: newListHandler(
            ["Region Free", "NTSC-J", "NTSC-U", "PAL", "JPN", "ENG", "EUR"],
            'region', GameStates.ARCHIVED),
        [GameStates.ARCHIVED]: newListHandler(
            ['Archived', 'Unarchived'], 'archived', GameStates.SCENE),
        [GameStates.SCENE]: newFlagHandler('Scene', 'scene', GlobalStates.COMMON_TRAILING_FIELDS),
    });

    const BookStates = Object.freeze({
        TRANSLATION: 1,
        FORMAT: 2,
        ONGOING: 4,
    });

    let BookHandlers = {
        [GlobalStates.BEGIN]: function() {
            let field = this.getNext();
            if (field.indexOf('  (') !== -1) {
                let translation = field.substr(0, field.indexOf('  ('));
                let group = field.slice(field.indexOf('  (')+3,
                    -1);
                this.appendSpan(translation, 'translation', translation);
                this.appendText(' (');
                this.appendSpan(group, 'group', group);
                this.appendText(')');

            } else {
                let translation = field.replace(' ', '');
                this.appendSpan(translation, 'translation', translation);
            }
            return BookStates.FORMAT;
        },
        [BookStates.FORMAT]: newListHandler(['Archived Scans', 'EPUB', 'PDF', 'Unarchived', 'Digital'], 'format', BookStates.ONGOING),
        [BookStates.ONGOING]: newFlagHandler('Ongoing', 'ongoing', GlobalStates.COMMON_TRAILING_FIELDS),

    };

    let FirstFields = ({
        "Blu-ray":AnimeHandlers,"Web":AnimeHandlers,"TV":AnimeHandlers,
        "DVD":AnimeHandlers,"UHD Blu-ray":AnimeHandlers,"DVD5":AnimeHandlers,
        "DVD9":AnimeHandlers,"HD DVD":AnimeHandlers,"VHS":AnimeHandlers,
        "VCD":AnimeHandlers,"LD":AnimeHandlers,

        "MP3":MusicHandlers,"FLAC":MusicHandlers,"AAC":MusicHandlers,

        "Game":GameHandlers,"Patch":GameHandlers,"DLC":GameHandlers,

        "Raw":BookHandlers,"Translated":BookHandlers,
    });

    let GlobalHandlers = ({
        [GlobalStates.INITIALISE]: function INITIALISE() {
            this.oldNodes = this.linkElement.childNodes;
            for (let i = 0; i < this.oldNodes.length; i++) {
                let child = this.oldNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    _debug() && console.log('Handling text node: x' + child.nodeValue + 'x');
                    if (child.nodeValue.indexOf(this.delim) !== -1) {
                        let str = child.nodeValue;
                        if (i === 0) {
                            if (str.charAt(0) === '»') {
                                str = str.replace('»', '');
                                this.appendText('» ');
                            }
                            str = str.replace(/^\s+/, '');
                        }
                        let splitArray = str.split(this.delim);
                        for (let j = 0; j < splitArray.length; j++) {
                            if (splitArray[j])
                                this.fields.push(splitArray[j]);
                        }
                    } else {
                        this.fields.push(child.nodeValue.trim());
                    }
                } else {
                    this.fields.push(child);
                }
            }

            let lastText = this.fields[this.fields.length-1];
            _debug() && console.log('lastText: '+lastText);
            if (typeof lastText === 'string' && lastText.endsWith(' - Snatched')) {

                this.fields[this.fields.length-1] =
                    lastText.substr(0, lastText.length-11);
                this.fields.push(' - Snatched');
                _debug() && console.log(this.fields);
            }
            return GlobalStates.DETECTING;
        },
        [GlobalStates.DETECTING]: function DETECTING() {
            let f = this.peekNext();
            _debug() && console.log('detecting: x'+f+'x');
            let handler = FirstFields[f];
            if (handler !== undefined)
                this.handlers = handler;
            else {
                let left = f.substr(0, f.indexOf(' '));
                this.handlers = FirstFields[left];
                if (this.handlers === undefined) {
                    this.handlers = {};
                    console.info('No first field match for: x' + f+'x');
                    return GlobalStates.ERROR;
                }
            }
            return GlobalStates.BEGIN;
        },
        [GlobalStates.ERROR]: function ERROR() {
            _debug() && console.log('error state');
            if (this.nodeAppended) {
                this.clearChildren();
                for (let n = 0; n < this.oldNodes.length; n++) {
                    this.linkElement.appendChild(
                        this.oldNodes[n]
                    );
                }
            }
            return GlobalStates.FINISHED;
        },
        [GlobalStates.COMMON_TRAILING_FIELDS]: function COMMON_TRAILING() {
            let node = this.peekNext();
            _debug() && console.log('trailing fields');
            _debug() && console.log(node);
            if (!node) return GlobalStates.INSERT_DOCFRAG;
            switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                _debug() && console.log(node);
                this.appendDelim();
                this.index++;
                switch (node.tagName.toUpperCase()) {
                case 'IMG':
                    if (node.alt === 'Freeleech!') {
                        this.appendSpan(node, 'freeleech', '');
                    } else {
                        switch (node.src.substr(node.src.lastIndexOf('/')+1)) {
                        case 'hentaic.png':
                            this.appendSpan(node, 'hentai', 'Censored');
                            break;
                        case 'hentai.png':
                            this.appendSpan(node, 'hentai', 'Uncensored');
                            break;
                        }
                    }
                    break;
                case 'FONT':
                    if (node.textContent === 'Exclusive!') {
                        this.appendSpan(node, 'exclusive', '');
                    }
                    break;
                default:
                    this.appendSpan(node, 'misc', node.textContent || '');
                }
                return GlobalStates.COMMON_TRAILING_FIELDS;
                break;
            default:
                this.index++;
                if (node.indexOf('- Snatched') !== -1) {
                    this.appendText(' - ');
                    this.appendSpan('Snatched', 'snatched', '');
                } else {
                    _debug() && console.log(this.fields);
                    this.appendDelim();
                    this.appendSpan(node, 'misc', node);
                }
                return GlobalStates.COMMON_TRAILING_FIELDS;
                break;
            }
        },
        [GlobalStates.INSERT_DOCFRAG]: function INSERT_DOCFRAG() {
            _debug() && console.log('appending');
            this.clearChildren();
            this.linkElement.appendChild(this.docFrag);
            return GlobalStates.FINISHED;
        }
    });

    const torrentPageTorrents = document.querySelectorAll(
        '.group_torrent>td>a[href*="&torrentid="]'
    );
    let p = new TorrentPropertyParser();
    for (let t = 0; t < torrentPageTorrents.length; t++) {
        let link = torrentPageTorrents[t];
        link.classList.add('userscript-highlight');
        link.classList.add('torrent-page');
        p.linkElement = link;
        p.delim = link.href.indexOf('torrents.php') !== -1?' | ':' / ';
        p.parse();
    }

    const searchResultTorrents = document.querySelectorAll(
        '.torrent_properties>a[href*="&torrentid="]'
    );
    for (let t = 0; t < searchResultTorrents.length; t++) {
        searchResultTorrents[t].className += 'userscript-highlight torrent-page';
        p.linkElement = searchResultTorrents[t];
        p.delim = ' | ';
        p.parse();
    }

    const bbcodeTorrents = document.querySelectorAll(
        ':not(.group_torrent)>:not(.torrent_properties)>a[href*="&torrentid="]:not([title])'
    );
    for (let t = 0; t < bbcodeTorrents.length; t++) {
        let linkElement = bbcodeTorrents[t];
        linkElement.classList.add('userscript-highlight');
        linkElement.classList.add('torrent-bbcode');
        let textNode = linkElement.firstChild;
        let torrents1 = linkElement.href.indexOf('torrents.php') !== -1;
        p.linkElement = linkElement;
        p.delim =torrents1 ? ' | ':' / ';

        let bbcodeString = textNode.nodeValue.trim();
        let yearIndex = bbcodeString.indexOf('\xa0\xa0[');
        let leftDocFrag = document.createDocumentFragment();
        _debug() && console.log('yearIndex: ' + yearIndex);
        if (yearIndex === -1) continue;
        else {
            let leftString = bbcodeString.substr(0, yearIndex);
            let year = bbcodeString.substr(yearIndex+3, 4);
            let dashIndex = torrents1 ? leftString.lastIndexOf(' - ') : leftString.indexOf(' - ');
            let artist = leftString.substr(0, dashIndex);
            let album = leftString.substr(dashIndex+3);

            leftDocFrag.appendChild(
                p.newSpan(artist, torrents1?'title':'artist', artist));
            leftDocFrag.appendChild(
                document.createTextNode(' - '));
            leftDocFrag.appendChild(
                p.newSpan(album, torrents1?'type':'album', album));
            leftDocFrag.appendChild(document.createTextNode('\xa0\xa0['));
            leftDocFrag.appendChild(p.newSpan(year, 'year', year));
            leftDocFrag.appendChild(document.createTextNode('] ['));
            if (bbcodeString.charAt(bbcodeString.length-1) === ']') {
                textNode.nodeValue = bbcodeString.substr(0, bbcodeString.length-1);
            } else {
                textNode.nodeValue = bbcodeString + ' ';
                linkElement.removeChild(linkElement.lastChild);
            }
            textNode.splitText(leftString.length+10);
            linkElement.removeChild(textNode);
        }
        p.parse();
        linkElement.insertBefore(
            leftDocFrag,
            linkElement.firstChild
        );
        if (yearIndex !== -1)
            linkElement.appendChild(document.createTextNode(']'));


    }




})();