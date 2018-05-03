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

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    var _Object$freeze, _Object$freeze2, _Object$freeze3, _Object$freeze4;

    function _debug() {
        return false;
    }

    var TorrentPropertyParser = function () {
        function TorrentPropertyParser(linkElement, delimiter) {
            _classCallCheck(this, TorrentPropertyParser);

            this.linkElement = linkElement;
            this.delim = delimiter;
            this.spanTemplate = document.createElement('span');
            this.spanTemplate.className = 'userscript-highlight torrent-field';
            this.docFrag = document.createDocumentFragment();
        }

        _createClass(TorrentPropertyParser, [{
            key: 'parse',
            value: function parse() {
                this.fields = [];
                this.index = 0;
                this.handlers = {};
                this.nodeAppended = false;

                var state = GlobalStates.INITIALISE;
                var func = void 0;
                while (state) {
                    func = this.handlers[state];
                    if (!func) func = GlobalHandlers[state];

                    state = func.call(this);
                }

                _debug() && console.log(state);
                _debug() && console.log(this.docFrag);
                _debug() && console.log(this.docFrag);
            }
        }, {
            key: 'getNext',
            value: function getNext() {
                return this.fields[this.index++];
            }
        }, {
            key: 'peekNext',
            value: function peekNext() {
                return this.fields[this.index];
            }
        }, {
            key: 'newSpan',
            value: function newSpan(content, key, value) {
                this.linkElement.dataset[key] = value;

                var span = this.spanTemplate.cloneNode(false);

                span.dataset[key] = value;
                if (content.nodeType) {
                    this.nodeAppended = true;
                    span.appendChild(content);
                } else {
                    span.textContent = content;
                }
                return span;
            }
        }, {
            key: 'appendSpan',
            value: function appendSpan(content, key, value) {
                this.docFrag.appendChild(this.newSpan(content, key, value));
            }
        }, {
            key: 'appendText',
            value: function appendText(text) {
                this.docFrag.appendChild(document.createTextNode(text));
            }
        }, {
            key: 'appendDelim',
            value: function appendDelim() {
                this.docFrag.appendChild(document.createTextNode(this.delim));
            }
        }, {
            key: 'clearChildren',
            value: function clearChildren() {
                while (this.linkElement.hasChildNodes()) {
                    this.linkElement.removeChild(this.linkElement.lastChild);
                }
            }
        }]);

        return TorrentPropertyParser;
    }();

    function newCaptureHandler(key, nextState) {
        var delim = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        return function () {
            if (delim) this.appendDelim();
            this.appendSpan(this.peekNext(), key, this.peekNext());
            this.index++;
            return nextState;
        };
    }

    function newFlagHandler(value, key, nextState) {
        var stateIfFalse = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        return function __flagHandler() {
            var field = this.peekNext();
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

    function newListHandler(values, key, nextState) {
        var stateIfFalse = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        return function __flagHandler() {
            var field = this.peekNext();
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

    var GlobalStates = Object.freeze({
        INITIALISE: -11,
        DETECTING: -1,
        BEGIN: -2,
        COMMON_TRAILING_FIELDS: -3, // FL, exclusive, snatched, hentai, etc.
        INSERT_DOCFRAG: -5,
        FINISHED: false,
        ERROR: -10
    });

    var MusicStates = Object.freeze({
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

    var MusicHandlers = Object.freeze((_Object$freeze = {}, _defineProperty(_Object$freeze, GlobalStates.BEGIN, newCaptureHandler('encoding', MusicStates.BITRATE, false)), _defineProperty(_Object$freeze, MusicStates.BITRATE, newCaptureHandler('bitrate', MusicStates.SOURCE)), _defineProperty(_Object$freeze, MusicStates.SOURCE, newCaptureHandler('source', MusicStates.LOG)), _defineProperty(_Object$freeze, MusicStates.LOG, newFlagHandler('Log', 'log', MusicStates.CUE)), _defineProperty(_Object$freeze, MusicStates.CUE, newFlagHandler('Cue', 'log', GlobalStates.COMMON_TRAILING_FIELDS)), _Object$freeze));

    var AnimeStates = Object.freeze({
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
    var AnimeHandlers = Object.freeze((_Object$freeze2 = {}, _defineProperty(_Object$freeze2, GlobalStates.BEGIN, newCaptureHandler('source', AnimeStates.CONTAINER, false)), _defineProperty(_Object$freeze2, AnimeStates.CONTAINER, function CONTAINER() {
        var field = this.getNext();
        if (field.charAt(field.length - 1) === ')') {
            var left = field.substr(0, field.indexOf(' ('));
            var right = field.substr(field.indexOf(' (') + 2, field.length - 1);
            this.appendDelim();
            this.appendSpan(left, 'container', left);
            this.appendText(' (');
            this.appendSpan(right, 'region', right);
            return AnimeStates.ASPECT_RATIO;
        } else {
            this.appendDelim();
            this.appendSpan(field, 'container', field);
            return AnimeStates.VIDEO_CODEC;
        }
    }), _defineProperty(_Object$freeze2, AnimeStates.ASPECT_RATIO, function ASPECT_RATIO() {
        var field = this.getNext();
        this.appendDelim();
        this.appendSpan(field, 'aspectRatio', field);
        if (this.fields[0] === 'DVD5' || this.fields[0] === 'DVD9') {
            return AnimeStates.RESOLUTION;
        } else {
            return AnimeStates.VIDEO_CODEC;
        }
    }), _defineProperty(_Object$freeze2, AnimeStates.VIDEO_CODEC, newCaptureHandler('codec', AnimeStates.RESOLUTION)), _defineProperty(_Object$freeze2, AnimeStates.RESOLUTION, newCaptureHandler('resolution', AnimeStates.AUDIO_CODEC_AND_CHANNELS)), _defineProperty(_Object$freeze2, AnimeStates.AUDIO_CODEC_AND_CHANNELS, function AUDIO_CODEC() {
        var field = this.getNext();
        var codec = field.substr(0, field.lastIndexOf(' '));
        var channels = field.substr(field.lastIndexOf(' ') + 1);
        if (channels.charAt(1) !== '.') return GlobalStates.ERROR;
        this.appendDelim();
        this.appendSpan(codec, 'audioCodec', codec);
        this.appendText(' ');
        this.appendSpan(channels, 'audioChannels', channels);

        return AnimeStates.DUAL_AUDIO;
    }), _defineProperty(_Object$freeze2, AnimeStates.DUAL_AUDIO, newFlagHandler('Dual Audio', 'dualAudio', AnimeStates.REMASTER)), _defineProperty(_Object$freeze2, AnimeStates.REMASTER, function REMASTER() {
        var node = this.peekNext();
        if (typeof node !== 'string' && node.tagName === 'IMG' && node.alt === 'Remastered') {
            this.index++;
            this.appendDelim();
            this.appendSpan(node, 'remastered', '');
        }
        return AnimeStates.SUBBING_AND_GROUP;
    }), _defineProperty(_Object$freeze2, AnimeStates.SUBBING_AND_GROUP, function SUBBING() {
        if (simpleSubbingHandler.call(this)) {
            return GlobalStates.COMMON_TRAILING_FIELDS;
        } else {
            var field = this.getNext().trim();
            var left = field.substr(0, field.indexOf(' '));
            if (left === 'Softsubs' || left === 'Hardsubs' || left === 'RAW') {
                this.appendDelim();
                this.appendSpan(left, 'subbing', left);
                this.appendText(' (');
                var groupString = field.substr(field.indexOf(' (') + 2);
                while (!groupString.endsWith(')') && this.index < this.fields.length) {
                    groupString += this.getNext();
                }
                groupString = groupString.substr(0, groupString.length - 1);
                this.appendSpan(groupString, 'group', groupString);
                this.appendText(')');
            }
        }
        return GlobalStates.COMMON_TRAILING_FIELDS;
    }), _Object$freeze2));

    var simpleSubbingHandler = newListHandler(['Softsubs', 'Hardsubs', 'RAW'], 'subbing', true, false);

    var GameStates = {
        TYPE: 1,
        PLATFORM: 2,
        REGION: 3,
        ARCHIVED: 4,
        SCENE: 5
    };

    var GameHandlers = Object.freeze((_Object$freeze3 = {}, _defineProperty(_Object$freeze3, GlobalStates.BEGIN, newCaptureHandler('type', GameStates.PLATFORM, false)), _defineProperty(_Object$freeze3, GameStates.PLATFORM, newCaptureHandler('platform', GameStates.REGION)), _defineProperty(_Object$freeze3, GameStates.REGION, newListHandler(["Region Free", "NTSC-J", "NTSC-U", "PAL", "JPN", "ENG", "EUR"], 'region', GameStates.ARCHIVED)), _defineProperty(_Object$freeze3, GameStates.ARCHIVED, newListHandler(['Archived', 'Unarchived'], 'archived', GameStates.SCENE)), _defineProperty(_Object$freeze3, GameStates.SCENE, newFlagHandler('Scene', 'scene', GlobalStates.COMMON_TRAILING_FIELDS)), _Object$freeze3));

    var BookStates = Object.freeze({
        TRANSLATION: 1,
        FORMAT: 2,
        DIGITAL: 3,
        ONGOING: 4
    });

    var BookHandlers = _defineProperty({}, GlobalStates.BEGIN, function () {
        return GlobalStates.FINISHED;
    });

    var FirstFields = Object.freeze({
        "Blu-ray": AnimeHandlers, "Web": AnimeHandlers, "TV": AnimeHandlers,
        "DVD": AnimeHandlers, "UHD Blu-ray": AnimeHandlers, "DVD5": AnimeHandlers,
        "DVD9": AnimeHandlers, "HD DVD": AnimeHandlers, "VHS": AnimeHandlers,
        "VCD": AnimeHandlers, "LD": AnimeHandlers,

        "MP3": MusicHandlers, "FLAC": MusicHandlers, "AAC": MusicHandlers,

        "Game": GameHandlers, "Patch": GameHandlers, "DLC": GameHandlers,

        "Raw": BookHandlers, "Translated": BookHandlers
    });

    var GlobalHandlers = Object.freeze((_Object$freeze4 = {}, _defineProperty(_Object$freeze4, GlobalStates.INITIALISE, function INITIALISE() {
        this.oldNodes = this.linkElement.childNodes;
        for (var i = 0; i < this.oldNodes.length; i++) {
            var child = this.oldNodes[i];
            if (child.nodeType === Node.TEXT_NODE) {
                _debug() && console.log('x' + child.nodeValue + 'x');
                if (child.nodeValue.indexOf(this.delim) !== -1) {
                    var str = child.nodeValue;
                    if (i === 0) {
                        if (str.charAt(0) === '»') {
                            str = str.replace('»', '');
                            this.appendText('» ');
                        }
                        str = str.replace(/^\s+/, '');
                    }
                    var splitArray = str.split(this.delim);
                    for (var j = 0; j < splitArray.length; j++) {
                        if (splitArray[j]) this.fields.push(splitArray[j]);
                    }
                } else {
                    this.fields.push(child.nodeValue.trim());
                }
            } else {
                this.fields.push(child);
            }
        }

        var lastText = this.fields[this.fields.length - 1];
        _debug() && console.log('lastText: ' + lastText);
        if (typeof lastText === 'string' && lastText.endsWith(' - Snatched')) {

            this.fields[this.fields.length - 1] = lastText.substr(0, lastText.length - 11);
            this.fields.push(' - Snatched');
            _debug() && console.log(this.fields);
        }
        return GlobalStates.DETECTING;
    }), _defineProperty(_Object$freeze4, GlobalStates.DETECTING, function DETECTING() {
        var f = this.peekNext();
        var handler = FirstFields[f];
        if (handler !== undefined) this.handlers = handler;else {
            var left = f.substr(0, f.indexOf('  ('));
            this.handlers = FirstFields[left];
            if (this.handlers === undefined) {
                this.handlers = {};
                console.info('No first field match for: ' + f);
                return GlobalStates.ERROR;
            }
        }
        return GlobalStates.BEGIN;
    }), _defineProperty(_Object$freeze4, GlobalStates.ERROR, function ERROR() {
        _debug() && console.log('error state');
        if (this.nodeAppended) {
            this.clearChildren();
            for (var n = 0; n < this.oldNodes.length; n++) {
                this.linkElement.appendChild(this.oldNodes[n]);
            }
        }
        return GlobalStates.FINISHED;
    }), _defineProperty(_Object$freeze4, GlobalStates.COMMON_TRAILING_FIELDS, function COMMON_TRAILING() {
        var node = this.peekNext();
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
                            switch (node.src.substr(node.src.lastIndexOf('/') + 1)) {
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
            case undefined:
                this.index++;
                if (node === ' - Snatched') {
                    this.appendText(' - ');
                    this.appendSpan('Snatched', 'snatched', '');
                } else {
                    _debug() && console.log(this.fields);
                    this.appendDelim();
                    this.appendSpan(node, 'misc', node);
                }
                break;
        }
        return GlobalStates.INSERT_DOCFRAG;
    }), _defineProperty(_Object$freeze4, GlobalStates.INSERT_DOCFRAG, function INSERT_DOCFRAG() {
        this.clearChildren();
        this.linkElement.appendChild(this.docFrag);
        return GlobalStates.FINISHED;
    }), _Object$freeze4));

    var torrentPageTorrents = document.querySelectorAll('.group_torrent>td>a[href*="&torrentid="]');
    for (var t = 0; t < torrentPageTorrents.length; t++) {
        var link = torrentPageTorrents[t];
        link.classList.add('userscript-highlight');
        link.classList.add('torrent-page');
        new TorrentPropertyParser(link, link.href.indexOf('torrents.php') !== -1 ? ' | ' : ' / ').parse();
    }

    var searchResultTorrents = document.querySelectorAll('.torrent_properties>a[href*="&torrentid="]');
    for (var _t = 0; _t < searchResultTorrents.length; _t++) {
        searchResultTorrents[_t].className += 'userscript-highlight torrent-page';
        new TorrentPropertyParser(searchResultTorrents[_t], ' | ').parse();
    }

    var bbcodeTorrents = document.querySelectorAll(':not(.group_torrent)>:not(.torrent_properties)>a[href*="&torrentid="]:not([title])');
    for (var _t2 = 0; _t2 < bbcodeTorrents.length; _t2++) {
        var linkElement = bbcodeTorrents[_t2];
        linkElement.classList.add('userscript-highlight');
        linkElement.classList.add('torrent-page');
        var textNode = linkElement.firstChild;
        var torrents1 = linkElement.href.indexOf('torrents.php') !== -1;
        var parser = new TorrentPropertyParser(linkElement, torrents1 ? ' | ' : ' / ');
        var bbcodeString = textNode.nodeValue.trim();
        var yearIndex = bbcodeString.indexOf('\xa0\xa0[');
        var leftDocFrag = document.createDocumentFragment();
        if (yearIndex !== -1) {
            var leftString = bbcodeString.substr(0, yearIndex);
            var year = bbcodeString.substr(yearIndex + 3, 4);
            var dashIndex = torrents1 ? leftString.lastIndexOf(' - ') : leftString.indexOf(' - ');
            var artist = leftString.substr(0, dashIndex);
            var album = leftString.substr(dashIndex + 3);

            leftDocFrag.appendChild(parser.newSpan(artist, torrents1 ? 'title' : 'artist', artist));
            leftDocFrag.appendChild(document.createTextNode(' - '));
            leftDocFrag.appendChild(parser.newSpan(album, torrents1 ? 'type' : 'album', album));
            leftDocFrag.appendChild(document.createTextNode('\xa0\xa0['));
            leftDocFrag.appendChild(parser.newSpan(year, 'year', year));
            leftDocFrag.appendChild(document.createTextNode('] ['));
            if (bbcodeString.charAt(bbcodeString.length - 1) === ']') {
                textNode.nodeValue = bbcodeString.substr(0, bbcodeString.length - 1);
            } else {
                textNode.nodeValue = bbcodeString + ' ';
                linkElement.removeChild(linkElement.lastChild);
            }
            textNode.splitText(leftString.length + 10);
            linkElement.removeChild(textNode);
        }
        parser.parse();
        linkElement.insertBefore(leftDocFrag, linkElement.firstChild);
        linkElement.appendChild(document.createTextNode(']'));
    }
})();

/***/ })
/******/ ]);
//# sourceMappingURL=tfm_torrent_highlighter.user.js.map