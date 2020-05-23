// ==UserScript==
// @name         AB Highlights 2
// @namespace    TheFallingMan
// @version      2.0.4
// @description  Rewritten torrent highlighter. Adds attributes to torrent links, allowing CSS styling.
// @author       TheFallingMan
// @icon         https://animebytes.tv/favicon.ico
// @match        https://animebytes.tv/*
// @license      GPL-3.0
// @require      https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js
// @require      https://raw.githubusercontent.com/momentary0/AB-Userscripts/master/highlights-2/dist/bundle.js
// ==/UserScript==

require(["highlighter"], function(highlighter) {
    highlighter.main();
});
