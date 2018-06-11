// ==UserScript==
// @name         AB Paragraph Spacing
// @namespace    TheFallingMan
// @version      0.0.1
// @description  Replaces double line spacing with paragraph spacing.
// @author       TheFallingMan
// @icon         https://animebytes.tv/favicon.ico
// @include      https://animebytes.tv/*
// @license      GPL-3.0
// ==/UserScript==

(function ABParagraphSpacing() {
    /**
     * @type {Array<HTMLBRElement>}
     */
    var brs = document.querySelectorAll('br+br');
    for (var i = 0; i < brs.length; i++) {
        var br = brs[i];
        var prevBr = br.previousElementSibling;
        var div = document.createElement('div');
        div.style.marginBottom = '8pt';

        prevBr.insertAdjacentElement('afterend', div);
        prevBr.style.display = 'none';
        br.style.display = 'none';
    }

})();