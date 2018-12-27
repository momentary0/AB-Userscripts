// ==UserScript==
// @name         AB Vector Logo
// @namespace    TheFallingMan
// @version      0.1.1
// @description  Replaces the pixelated text logo with real text.
// @author       TheFallingMan
// @icon         https://animebytes.tv/favicon.ico
// @match        https://animebytes.tv/*
// @license      GPL-3.0
// ==/UserScript==

(function() {
    function insertCSS(text) {
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(text));
        document.head.appendChild(style);
    }

    var css = `
    #logo>a {
        background: none;
        font-family: 'Century Gothic', sans-serif;
        font-weight: bold;
        color: #f6f6f7;
        font-size: 1.4em;
        letter-spacing: -0.2pt;
    }

    #logo>a:hover {
        background: none;
        color: #989ba0;
    }
    `;
    insertCSS(css);

    var logo = document.querySelector('#logo a');
    logo.textContent = 'animebytes';

})();