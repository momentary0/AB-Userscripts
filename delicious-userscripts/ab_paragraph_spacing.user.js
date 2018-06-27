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
    var brs = Array.from(document.getElementsByTagName('br'));
    for (var i = 0; i < brs.length; i++) {
        var br = brs[i];
        var prevBr = br.previousSibling;
        if ((prevBr && prevBr.tagName && prevBr.tagName.toUpperCase() === 'BR' && prevBr.style.display !== 'none')
            || (prevBr.nodeType === Node.TEXT_NODE && prevBr.nodeValue.slice(-1) === '\n')) {
            //console.log(prevBr.tagName.toUpperCase());
            var div = document.createElement('div');
            div.className = 'paragraph-spacer';
            div.style.marginBottom = '8pt';

            br.parentNode.insertBefore(div, br);
            //console.log(div);
            if (prevBr.nodeType === Node.TEXT_NODE) {
                var spaceLength = /\n*$/.exec(prevBr.nodeValue)[0].length;
                var newlineTextNode = prevBr.splitText(prevBr.nodeValue.length - spaceLength);
                newlineTextNode.parentNode.removeChild(newlineTextNode);
                var newBr = document.createElement('br');
                newBr.style.display = 'none';
                br.parentNode.insertBefore(newBr, div);
            } else {
                prevBr.style.display = 'none';
            }
            br.style.display = 'none';
        }

    }

})();