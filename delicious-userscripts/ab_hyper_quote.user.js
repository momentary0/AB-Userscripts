// ==UserScript==
// @name        AB - HYPER QUOTE!
// @author      Megure, TheFallingMan
// @description Select text and press CTRL+V to quote
// @include     https://animebytes.tv/*
// @version     0.2.3
// @icon        http://animebytes.tv/favicon.ico
// @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

//import '../delicious-library/src/ab_delicious_library';

/* global delicious */

(function ABHyperQuote() {
    var _enabled = delicious.settings.basicScriptCheckbox(
        'delicioushyperquote',
        'Delicious Hyper Quote',
        'Select text and press Ctrl+V to instantly quote it.'
    );
    if (!_enabled)
        return;

    if (document.getElementById('quickpost') === null)
        return;
    /** Debug flag. */
    var _debug = false;

    function formattedUTCString(date, timezone) {
        var creation = new Date(date);
        if (isNaN(creation.getTime()))
            return date;
        else {
            creation = creation.toUTCString().split(' ');
            return creation[1] + ' ' + creation[2] + ' ' + creation[3] + ', ' + creation[4].substring(0, 5) + (timezone !== false ? ' ' + creation[5] : '');
        }
    }

    /**
     * Quotes the entire selection.
     *
     * Handles combining adjacent selection ranges, then calls
     * QUOTEMANY.
     * */
    function QUOTEALL() {
        var sel = window.getSelection();
        if (sel.rangeCount === 0) return;
        // If there's only one range, happy days.
        if (sel.rangeCount === 1) {
            _debug && console.log('Quoting one range:');
            _debug && console.log(sel.getRangeAt(0));
            QUOTEMANY(sel.getRangeAt(0));
        } else {
            _debug && console.log('Dealing with multiple ranges.');
            // Ohhh boy.... firefox, why...?
            var allRanges = [];
            // Start range of the current continguous selection range.
            // The aim of this code is to join contiguous ranges into one range
            // so they can be parsed properly, without being split into multiple
            // quotes.
            var startRange = sel.getRangeAt(0);
            // Previous range we encountered.
            var previousRange = startRange;
            // Current range. Set in loop.
            var thisRange = null;
            // rangeCount+1 to make it loop one time after list is exhausted, to append
            // last range to list.
            // Start at 2nd range, because we have already set startRange
            // and previousRange above. Also, first range has no previous
            // range to compare to.
            for (var i = 1; i < sel.rangeCount+1; i++) {
                if (i < sel.rangeCount)
                    thisRange = sel.getRangeAt(i);
                else
                    thisRange = null;
                // If this range starts at the beginning and picks up
                // exactly where the previous range left off.
                // After trial/error, this code should work.
                // endOffset+1 is to get the childNode _after_ the previous
                // range ends, since ranges don't overlap (hopefully)
                if (thisRange !== null && thisRange.startOffset === 0 &&
                    previousRange.endContainer.childNodes[previousRange.endOffset+1] === thisRange.startContainer) {
                    // Store this range as the previous and continue looping.
                    previousRange = thisRange;
                } else {
                    // Else, the current range does not continue from
                    // the previous one.
                    if (startRange !== previousRange) {
                        // Create and append a new, more sensible, range.
                        var newRange = document.createRange();
                        newRange.setStart(startRange.startContainer, startRange.startOffset);
                        newRange.setEnd(previousRange.endContainer, previousRange.endOffset);
                        allRanges.push(newRange);
                    } else {
                        // No adjacent ranges to startRange.
                        // They're both the same, append either.
                        allRanges.push(previousRange);
                    }
                    // Set these for the next iteration.
                    startRange = thisRange;
                    previousRange = thisRange;
                }
            }
            for (var j = 0; j < allRanges.length; j++) {
                QUOTEMANY(allRanges[j]);
            }
        }
    }

    /**
     * Quotes many posts.
     *
     * Clones each post and deletes text outside of the selection
     * range.
     *
     * @param {Range} range Selection range to quote.
     */
    function QUOTEMANY(range) {
        /**
         * Removes all siblings of 'node' which occur before or after it,
         * depending on the value of 'prev'.
         *
         * @param {Node} node
         * @param {boolean} prev
         */
        function removeChildren(node, prev) {
            if (node === null || node.parentNode === null) return;
            if (prev === true)
                while (node.parentNode.firstChild !== node)
                    node.parentNode.removeChild(node.parentNode.firstChild);
            else
                while (node.parentNode.lastChild !== node)
                    node.parentNode.removeChild(node.parentNode.lastChild);
            removeChildren(node.parentNode, prev);
        }
        /**
         * Essentailly indexOf for any array-like object.
         *
         * @param {Array} arr
         * @param {object} elem
         */
        function inArray(arr, elem) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === elem)
                    return i;
            }
            _debug && console.log(elem);
            return -1;
        }

        // TODO: refactor bbcodeChildren to use these functions.

        /**
         *
         * @param {HTMLElement} quoteNode
         */
        function isSmartQuote(quoteNode) {
            try {
                var colon = quoteNode.previousSibling;
                var link = colon.previousSibling;
                var span = link.firstElementChild;
                var strong = link.previousElementSibling;
                return (colon.nodeValue === ':\n'
                    && span.tagName.toUpperCase() === 'SPAN'
                    && span.title
                    && link.tagName.toUpperCase() === 'A'
                    && link.textContent.slice(0, 6) === 'wrote '
                    && strong.tagName.toUpperCase() === 'STRONG'
                    && strong.firstElementChild.href.indexOf('/user.php?id=') !== -1);
            } catch (e) {
                return false;
            }
        }

        function isUsernameQuote(quoteNode) {
            try {
                var wrote = quoteNode.previousSibling;
                var strong = wrote.previousSibling;
                return (wrote.nodeValue === ' wrote:\n'
                    && strong.nodeType === Node.ELEMENT_NODE
                    && strong.tagName.toUpperCase() === 'STRONG'
                    && strong.childNodes.length === 1
                    && strong.firstChild.nodeType === Node.TEXT_NODE
                );
            } catch (e) {
                return false;
            }
        }

        /**
         * Returns a new documentFragment containing 'num' many nodes
         * which are previous siblings of 'node', cloned.
         * Assumes said siblings exist.
         *
         * @param {number} num
         * @param {Node} node
         */
        function savePreviousNodes(num, node) {
            var docFrag = document.createDocumentFragment();
            var index = inArray(node.parentNode.childNodes, node);
            for (var q = 0; q < num; q++) {
                docFrag.appendChild(
                    node.parentNode.childNodes[index-num+q].cloneNode(true));
            }
            return docFrag;
        }

        /**
         * Array of [number, docFrag] pairs where number is a
         * data-hyper-quote value referencing a unique node
         * and the corresponding document fragment
         * contains the nodes to insert before it.
         *
         * @type {[number, DocumentFragment][]}
         */
        var savedPreviousNodes = [];
        /**
         * Checks if 'node' has previous siblings which should be kept
         * (e.g. usernames of quotes or buttons of spoilers).
         *
         * @param {Node} node
         */
        function preserveIfNeeded(node) {
            var numToSave = 0;
            if (isSmartQuote(node))
                numToSave = 4;
            else if (isUsernameQuote(node))
                numToSave = 2;

            if (numToSave) {
                var num;
                if (savedPreviousNodes.length) num = savedPreviousNodes.slice(-1)[0] + 1;
                else num = 1;
                var pair = [num, savePreviousNodes(numToSave, node)];
                node.dataset['hyperQuote'] = num;
                savedPreviousNodes.push(pair);
                return pair;
            }
            return null;
        }

        /**
         * Traverses upwards from 'node' to the topmost element in the document.
         *
         * If preserve is true, will check for previous nodes to preserve.
         *
         * @param {Node} bottomNode
         * @param {boolean} preserve
         * @returns {[Node, number[]]} Tuple of topmost parent element and array of indexes.
         */
        function traverseUpwards(bottomNode, preserve) {
            var path = [];
            while (bottomNode.parentNode !== null) {
                path.push(inArray(bottomNode.parentNode.childNodes, bottomNode));
                if (preserve)
                    preserveIfNeeded(bottomNode);
                bottomNode = bottomNode.parentNode;
            }
            return [bottomNode, path];
        }

        /**
         * Reverse of traverseUpwards,
         * descending to the element in the original position using a known
         * array of indexes.
         *
         * @param {Node} topNode
         * @param {number[]} path
         */
        function traverseDownwards(topNode, path) {
            for (var i = path.length - 1; i >= 0; i--) {
                if (path[i] === -1) return;
                topNode = topNode.childNodes[path[i]];
            }
            return topNode;
        }

        if (range.collapsed === true) return;

        // Goes from the startContainer to root document node, storing its
        // path in 'start'.
        var html1 = range.startContainer;
        var t = traverseUpwards(html1, true);
        html1 = t[0];
        var start = t[1];

        // Similarly for the endContainer.
        var html2 = range.endContainer;
        var u = traverseUpwards(html2, false);
        html2 = u[0];
        var end = u[1];

        // These should be equal as they originate from the same <html> tag.
        if (html1 !== html2 || html1 === null) return;
        // Take a copy which we can edit as we need.
        var htmlCopy = html1.cloneNode(true);

        // Descends the copied HTML tree to get to the startContainer
        // and endContainer, using the indexes stored previously.
        var startNode = traverseDownwards(htmlCopy, start);
        var endNode = traverseDownwards(htmlCopy, end);

        // Slices the start and end containers so they contain only
        // the selected text.
        if (endNode.nodeType === 3)
            endNode.data = endNode.data.substr(0, range.endOffset);
        else if (endNode.nodeType === 1)
            for (var i = endNode.childNodes.length; i > range.endOffset; i--)
                endNode.removeChild(endNode.lastChild);
        if (range.startOffset > 0) {
            if (startNode.nodeType === 3)
                startNode.data = startNode.data.substr(range.startOffset);
            else if (startNode.nodeType === 1)
                for (var j = 0; j < range.startOffset; j++)
                    startNode.removeChild(startNode.firstChild);
        }

        // Removes all elements before startNode and after endNode.
        removeChildren(startNode, true);
        removeChildren(endNode, false);

        // Finds the bottommost element which is a parent of both
        // startNode and endNode. This is done to find the deepest quote
        // which was quoted.
        // Implemented by searching recursing downwards while the parent node
        // only has one child or one whild + whitespace.
        var commonRoot = htmlCopy;
        var rootQuote = null;
        var secondChild = null; // Set in 'while' conditional.
        while ( // I'm really sorry about this code ;-;
            (commonRoot.childNodes.length === 1) // If only one child, the result is obvious.
            || (
                commonRoot.childNodes.length === 2 // If 2 children.
                && (secondChild = commonRoot.childNodes[1])
                && ( // If second child is a text node, we require it be whitespace.
                    (secondChild.nodeType === Node.TEXT_NODE && !secondChild.nodeValue.trim())
                    || // If it is an element, we require it to be <br>.
                    (secondChild.tagName && secondChild.tagName.toUpperCase() === 'BR')
                )
            )
        ) {
            // If these conditions hold, the child is a common parent of both
            // startNode and endNode, as other elements were deleted earlier.
            commonRoot = commonRoot.firstChild;
            // Moreover, if it's a quote, we store it so we only quote within
            // the deepest common quote.
            if (commonRoot.classList && commonRoot.classList.contains('blockquote')) {
                rootQuote = commonRoot;
            }
        }

        // Restores extra nodes before a quote such as username and link.
        // Must be done after the common root checking otherwise it will
        // mess up the process.
        for (var k = 0; k < savedPreviousNodes.length; k++) {
            // Use selectors on the copied HTML tree to find the corresponding
            // nodes.
            var selector = '[data-hyper-quote="'+savedPreviousNodes[k][0]+'"]';
            var copyNode = htmlCopy.querySelector(selector);
            copyNode.parentNode.insertBefore(savedPreviousNodes[k][1], copyNode);

            // Delete original document's data-hyper-quote attribute.
            // We don't care about htmlCopy's attributes as it gets reset
            // every time.
            delete document.querySelector(selector).dataset['hyperQuote'];
        }
        savedPreviousNodes = [];

        // If there is a [quote] common to start and end. In other worse,
        // the selection is contained entirely within one quote.
        if (rootQuote) {
            // Then, we only quote within the deepest quote, as that makes
            // the most sense.
            var sel = document.getElementById('quickpost');
            sel.value += bbcodeChildrenTrim(rootQuote.parentNode);
            sel.scrollIntoView();
            return;
        }

        // Otherwise, quote as usual.
        var posts = htmlCopy.querySelectorAll('div[id^="post"],div[id^="msg"]');
        for (var l = 0; l < posts.length; l++) {
            QUOTEONE(posts[l]);
        }
    }

    /**
     * Returns BBCode of one whole div.post.
     *
     * @param {HTMLDivElement} postDiv
     */
    function bbcodeChildrenTrim(postDiv) {
        return bbcodeChildren(postDiv).trim();
    }

    /**
     * Returns BBCode of parentNode's children.
     *
     * BBCode which relies on adjacent siblings (e.g. quotes) must be placed
     * here, as other functions consider one HTML element only.
     *
     * Returns children's BBCode only; assumes the parent BBCode has
     * been generated elsewhere.
     *
     * @param {Node} parentNode
     */
    function bbcodeChildren(parentNode) {
        _debug && console.log('parentNode: ');
        _debug && console.log(parentNode);
        if (!(parentNode.childNodes && parentNode.childNodes.length))
            return '';
        var bbcodeString = '';
        for (var i = 0; i < parentNode.childNodes.length; i++) {
            var thisNode = parentNode.childNodes[i];
            if (thisNode.nodeType === Node.TEXT_NODE) {
                // Handles text nodes.
                var text = thisNode.nodeValue;
                // If this isn't the first child and previous is a <br>,
                // collapse leading space.
                if (i > 0 && parentNode.childNodes[i-1].nodeType === Node.ELEMENT_NODE
                    && parentNode.childNodes[i-1].tagName.toUpperCase() === 'BR')
                    text = text.replace(/^\s+/, '');
                // If this isn't the last child and next is a <br>,
                // collapse trailing space.
                if (i+1 < parentNode.childNodes.length
                    && parentNode.childNodes[i+1].nodeType === Node.ELEMENT_NODE
                    && parentNode.childNodes[i+1].tagName.toUpperCase() === 'BR')
                    text = text.replace(/\s+$/, '');
                bbcodeString += text;
                continue;
            }

            /**
             * Whether this element represents the start of a
             * post number (e.g. `[quote=#1559283]`) quote.
             */
            var isSmartQuote = false;
            try {
                // We fully expect this to throw exceptions if the element
                // is not a quote block, as the surrounding structure
                // will not be there.
                //debugger;
                isSmartQuote = (
                    (i+4 < parentNode.childNodes.length)
                    // thisNode is a <strong></strong> node containing the
                    // user link.
                    && thisNode.nodeType === Node.ELEMENT_NODE
                    && thisNode.tagName.toUpperCase() === 'STRONG'
                    && thisNode.firstElementChild.href.indexOf('user.php?id=') !== -1
                    // i+1 is a " " text node.
                    && !parentNode.childNodes[i+1].nodeValue.trim()
                    // i+2 is the <a> node linking to the post.
                    && parentNode.childNodes[i+2].textContent.indexOf('wrote') !== -1
                    && parentNode.childNodes[i+2].firstElementChild.tagName.toUpperCase() === 'SPAN'
                    && parentNode.childNodes[i+2].firstElementChild.title
                    // i+3 is the :
                    && parentNode.childNodes[i+3].nodeValue.indexOf(':') !== -1
                    // i+4 is the quote.
                    && parentNode.childNodes[i+4].classList.contains('blockquote')
                );
            } catch (exception) { _debug && console.log(exception); }
            _debug && console.log('isSmartQuote: ' + isSmartQuote);
            if (isSmartQuote) {
                bbcodeString += bbcodeSmartQuote(thisNode,
                    parentNode.childNodes[i+2], parentNode.childNodes[i+4]);
                i += 4; // Skip the next 4 nodes.
                continue;
            }

            /**
             * Whether this element represents the start of a
             * `[quote=username]` quote.
             * */
            var isBasicQuote = false;
            try {
                // Strictly speaking, we don't have to handle this here;
                // handling it with the generic code
                // (i.e. [b]username[/b] wrote ...)
                // results in identical rendered output.
                isBasicQuote = (
                    // Similar logic as above.
                    (i+2 < parentNode.childNodes.length)
                    && thisNode.nodeType === Node.ELEMENT_NODE
                    && thisNode.tagName.toUpperCase() === 'STRONG'
                    && thisNode.childNodes.length === 1
                    && thisNode.firstChild.nodeType === Node.TEXT_NODE
                    && parentNode.childNodes[i+1].nodeValue.trim() === 'wrote:'
                    && parentNode.childNodes[i+2].classList.contains('blockquote')
                );
            } catch (exception) { _debug && console.log(exception); }
            if (isBasicQuote) {
                bbcodeString += bbcodeQuote(thisNode.firstChild.nodeValue, parentNode.childNodes[i+2]);
                i += 2;
                continue;
            }

            var isMediainfo = false;
            try {
                isMediainfo = (
                    // Spoiler button
                    thisNode.classList.contains('hideContainer')
                    && (
                        (// Either followed by a .mediainfo table
                            (i+1 < parentNode.childNodes.length)
                            && parentNode.childNodes[i+1].tagName.toUpperCase() === 'TABLE'
                            && parentNode.childNodes[i+1].classList.contains('mediainfo'))
                        || ( // OR, which was originally followed by a mediainfo table.
                            (i+1 === parentNode.childNodes.length)
                            && thisNode.firstElementChild.value.length > 4
                            && thisNode.firstElementChild.value.indexOf('.') !== -1
                            && document.querySelector(
                                '.hideContainer > .spoilerButton[value="'
                                + thisNode.firstElementChild.value+'"]'
                            ).parentNode.nextElementSibling.classList.contains('mediainfo'))
                    )
                );
            } catch (exception) { _debug && console.log(exception); }
            if (isMediainfo) {
                bbcodeString += bbcodeMediainfo(thisNode,
                    parentNode.childNodes[i+1]);
                i += 1;
                continue;
            }

            // Otherwise, we handle it as a normal node.
            bbcodeString += bbcodeOneElement(thisNode);
        }
        return bbcodeString;
    }

    /**
     * Returns a quote BBCode, with quoteName as the = parameter, containing
     * the contents of quoteNode.
     *
     * @param {string} quoteName
     * @param {HTMLQuoteElement} quoteNode
     */
    function bbcodeQuote(quoteName, quoteNode) {
        var contents = bbcodeChildrenTrim(quoteNode);
        return (
            '[quote'+(quoteName?'='+quoteName:'')+']\n'
            +contents
            +'\n[/quote]\n');
    }

    /**
     * Returns an appropriate [quote] tag using a post number.
     *
     * @param {HTMLElement} strongNode Node containing username link.
     * @param {HTMLAnchorElement} wroteLink Post link element.
     * @param {HTMLQuoteElement} quoteNode Blockquote element.
     */
    function bbcodeSmartQuote(strongNode, wroteLink, quoteNode) {
        var quoteType = '';
        var href = wroteLink.href;
        if (href.indexOf('/forums.php') !== -1) quoteType = '#';
        else if (href.indexOf('/user.php') !== -1) quoteType = '*';
        else if (href.indexOf('/torrents.php') !== -1) quoteType = '-1';
        else if (href.indexOf('/torrents2.php') !== -1) quoteType = '-2';
        if (quoteType !== '') {
            var id = /#(?:msg|post)?(\d+)$/.exec(href); // post number
            // We have to be careful with newlines otherwise too much whitespace
            // will be added.
            if (id)
                return bbcodeQuote(quoteType + id[1], quoteNode);
        }
        // We shouldn't ever reach this.
        return ('[url='+wroteLink.href+']Unknown quote[/url][quote]'
            +bbcodeChildren(quoteNode)+'[/quote]');
    }

    /**
     * Returns BBCode of one <strong> node.
     *
     * @param {HTMLElement} strongNode
     */
    function bbcodeStrong(strongNode) {
        // Special case of "Added on ..." text.
        if (strongNode.childNodes.length === 1
        && strongNode.firstChild.nodeType === Node.TEXT_NODE
        && strongNode.firstChild.nodeValue.slice(0, 9) === 'Added on ') {
            var dateString = strongNode.firstChild.nodeValue.slice(9);
            var end = '';
            if (dateString.slice(-1) === ':') {
                dateString = dateString.slice(0, -1);
                end = ':';
            }
            return '[b]Added on '+formattedUTCString(dateString)+end+'[/b]';
        } else {
            return '[b]'+bbcodeChildren(strongNode)+'[/b]';
        }
    }

    /**
     * Returns BBCode of a div element.
     *
     * Possible cases:
     *
     *  - [align=...] tag.
     *  - [code] tag.
     *  - [spoiler] or [hide] tag.
     *
     * @param {HTMLDivElement} divNode
     */
    function bbcodeDiv(divNode) {
        if (divNode.style.textAlign) {
            var align = divNode.style.textAlign;
            return '[align='+align+']'+bbcodeChildren(divNode)+'[/align]';
        }
        if (divNode.classList.contains('codeBox')) {
            return '[code]'+divNode.firstElementChild.firstChild.nodeValue+'[/code]';
        }
        if (divNode.classList.contains('spoilerContainer')) {
            return bbcodeSpoiler(divNode);
        }
        // This fallback shouldn't ever occur.
        return bbcodeChildren(divNode);
    }

    /**
     * Returns BBCode of a spoiler element, considering for
     * custom button text.
     *
     * @param {HTMLDivElement} spoilerDiv
     */
    function bbcodeSpoiler(spoilerDiv) {
        var isSpoiler = !spoilerDiv.classList.contains('hideContainer');
        // [hide] or [spoiler]
        var bbcodeTag = isSpoiler ? 'spoiler' : 'hide';

        // If we have less than 2 children, then this is an abnormal spoiler.
        if (spoilerDiv.children.length < 2) {
            // If the only child of this div isn't the spoiler's contents,
            // it must be the button and we return.
            if (!spoilerDiv.firstElementChild.classList.contains('spoiler')) {
                return '';
            }
            // Otherwise, only the inside of a spoiler is selected.
            // In this case, we have no button to work with. Compromise.
            return '['+bbcodeTag+']'+bbcodeChildren(spoilerDiv.firstElementChild)+'[/'+bbcodeTag+']';
        }
        var label = spoilerDiv.firstElementChild.value.replace(/^(Hide|Show)/, '');
        if (isSpoiler) // ' spoiler' is appended automatically to spoiler buttons
            label = label.replace(/ spoiler$/, '');
        if (label) {
            label = label.slice(1); // slice space.
        }
        return '['+bbcodeTag + (label ? '='+label : '') + ']\n' +
            bbcodeChildrenTrim(spoilerDiv.children[1]) + '\n[/'+bbcodeTag+']';
    }


    /**
     * Returns BBCode for a [mediainfo] tag.
     *
     * @param {HTMLDivElement} buttonDiv Div containing the button and spoiler.
     * @param {HTMLTableElement} mediainfoTable
     */
    function bbcodeMediainfo(buttonDiv, mediainfoTable) { // eslint-disable-line no-unused-vars
        if (buttonDiv.children.length < 2) return '';
        return '[mediainfo]' + bbcodeChildren(buttonDiv.children[1]) + '[/mediainfo]';
    }


    /**
     * Returns BBCode of a <ol> or <ul> tag.
     *
     * @param {HTMLUListElement} listNode
     * @param {String} bbcodeTag Tag to insert before each line.
     */
    function bbcodeList(listNode, bbcodeTag) {
        var str = '';
        for (var c = 0; c < listNode.childElementCount; c++) {
            // Only consider element children, which we assume are
            // <li> or <ol>/<ul>.
            str += bbcodeTag + bbcodeChildren(listNode.children[c]);
            // For whitespace.
            if (str.slice(-1) !== '\n') str += '\n';
        }
        return str;
    }

    /**
     * Returns BBCode of an image element, possibly a smiley.
     *
     * @param {HTMLImageElement} imgNode
     */
    function bbcodeImage(imgNode) {
        if (imgNode.classList.contains('bbcode_smiley')) {
            return imgNode.alt;
        }
        // Note: AB proxies images, so quoted images will not
        // necessarily use the same URL as the original did.
        // Original URL is b64 encoded within the CDN URL.
        return '[img]'+imgNode.src+'[/img]';
    }

    /**
     * Returns a string containing the hex representation of a number,
     * padded to 2 hex digits.
     *
     * @param {Number} num
     */
    function numToHex(num) {
        var h = num.toString(16);
        while (h.length < 2)
            h = '0' + h;
        return h;
    }

    /** Regex matching colour in rgb(x, y, z) format. */
    var rgbRegex = /^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/i;
    /**
     * Returns BBCode of a HTML <span> element.
     *
     * Possible cases:
     *
     *  - Smiley
     *  - Color
     *  - Size
     *  - Secret
     *
     * @param {HTMLSpanElement} spanNode
     */
    function bbcodeSpan(spanNode) {
        if (spanNode.className.indexOf('smiley-') !== -1) {
            return bbcodeSmiley(spanNode);
        }
        var colour = spanNode.style.color;
        if (colour) {
            var rgbMatch = rgbRegex.exec(colour);
            // Check for rgb() format colours.
            if (rgbMatch)
                colour = ('#' + numToHex(parseInt(rgbMatch[1]))
                +numToHex(parseInt(rgbMatch[2]))
                +numToHex(parseInt(rgbMatch[3])));
            return '[color='+colour+']' + bbcodeChildren(spanNode) + '[/color]';
        }
        if (spanNode.className.slice(0, 4) === 'size') {
            var size = spanNode.className.replace('size', '');
            return '[size='+size+']'+bbcodeChildren(spanNode)+'[/size]';
        }
        if (spanNode.className === 'last-edited') {
            return '';
        }
        if (spanNode.classList.contains('secret')) {
            return '[secret]' + bbcodeChildren(spanNode) + '[/secret]';
        }
        if (spanNode.title)
            return formattedUTCString(spanNode.title);
        return bbcodeChildren(spanNode);
    }

    /**
     * Given a HTML span element representing a smiley, finds and returns
     * the smiley's BBCode.
     *
     * @param {HTMLSpanElement} smileySpan
     */
    function bbcodeSmiley(smileySpan) {
        var smiley = smileySpan.title;
        var smileyNode = document.querySelector('span[alt="' + smiley + '"]');
        if (smileyNode === null)
            smileyNode = document.querySelector('span[style*="/' + smiley + '.png"]');
        if (smileyNode === null)
            smileyNode = document.querySelector('span[style*="/' + smiley.replace(/-/g, '_') + '.png"]');
        if (smileyNode === null)
            smileyNode = document.querySelector('span[style*="/' +
                smiley.replace(/-/g, '_').toLowerCase() + '.png"]');
        if (smileyNode === null)
            smileyNode = document.querySelector('span[style*="/' + smiley.replace(/face/g, '~_~') + '.png"]');
        if (smileyNode !== null && smileyNode.parentNode !== null) {
            smileyNode = smileyNode.getAttribute('onclick').match(/'(.+?)'/i);
            if (smileyNode !== null)
                return smileyNode[1];
        }
        return ':' + smiley + ':';
    }


    var userRegex = /^\/user\.php\?id=(\d+)$/;
    var torrentRegex = /^torrents2?\.php\?id=\d+&torrentid=(\d+)$/;

    /**
     *
     * @param {HTMLAnchorElement} linkElement
     */
    function bbcodeLink(linkElement) {
        // <img> tags are often wrapped around a <a> pointing to the same image.
        if (linkElement.classList.contains('scaledImg')) {
            return bbcodeImage(linkElement.firstElementChild);
        }
        /** href with relative links resolved. */
        var href = linkElement.href;
        /** Actual href as typed into HTML */
        var realHref = linkElement.getAttribute('href');

        var userMatch = userRegex.exec(realHref);
        if (userMatch)
            return '[user='+href+']'+bbcodeChildren(linkElement)+'[/user]';
        var torrentMatch = torrentRegex.exec(realHref);
        if (torrentMatch) {
            // If the link's text contains &nbsp; we assume it is a torrent
            // link.
            if (linkElement.textContent.indexOf('\xa0\xa0[') !== -1)
                return '[torrent]'+href+'[/torrent]';
            else
                return '[torrent='+href+']'+bbcodeChildren(linkElement)+'[/torrent]';
        }
        // Actually, torrent and user links could be written using [url=]
        // and the rendered output would be the same.
        return ('[url='+realHref+']'+ bbcodeChildren(linkElement) + '[/url]');
    }

    var youtubeRegex = /\/embed\/([^?]+)\?/i;
    var soundcloudRegex = /\/player\/\?url=([^&]+)&/i;

    /**
     * Returns BBCode for embedded media.
     *
     * @param {HTMLIFrameElement} iframeNode
     */
    function bbcodeIframe(iframeNode) {
        var src = iframeNode.src;
        if (src.indexOf('youtube.com/embed') !== -1) {
            return '[youtube]https://youtube.com/watch?v='+youtubeRegex.exec(src)[1]+'[/youtube]';
        }
        if (src.indexOf('soundcloud.com/player') !== -1) {
            // The original soundcloud URL is encoded and forms a part of the
            // embed URL.
            return '[soundcloud]'+decodeURIComponent(soundcloudRegex.exec(src)[1])+'[/soundcloud]';
        }
        return 'Embedded media: ' + src;
    }

    /**
     * Returns BBCode for one element.
     *
     * Handles simple cases and routes more complex cases
     * to the appropriate function.
     *
     * @param {HTMLElement} node
     */
    function bbcodeOneElement(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            // Text nodes should be handled in bbcodeChildren.
            if (node.nodeType === Node.TEXT_NODE)
                return node.nodeValue;
            if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === 'n')
                return '[n]';
            return '';
        }
        switch (node.tagName.toUpperCase()) {
        case 'DIV': return bbcodeDiv(node);
        case 'SPAN': return bbcodeSpan(node);
        case 'BR': return '\n';
        case 'STRONG': return bbcodeStrong(node);
        case 'EM': return '[i]'+bbcodeChildren(node)+'[/i]';
        case 'U': return '[u]'+bbcodeChildren(node)+'[/u]';
        case 'S': return '[s]'+bbcodeChildren(node)+'[/s]';
        case 'OL': return bbcodeList(node, '[#] ');
        case 'UL': return bbcodeList(node, '[*] ');
        case 'A': return bbcodeLink(node);
        case 'IMG': return bbcodeImage(node);
        case 'IFRAME': return bbcodeIframe(node);
        case 'BLOCKQUOTE': return bbcodeQuote('', node);
        case 'HR': return '[hr]';
        case 'TABLE': return bbcodeChildren(node); // crude representation of a table
        case 'CAPTION': return '[b]'+bbcodeChildren(node)+'[/b]\n';
        case 'TBODY': return bbcodeChildren(node);
        case 'TH': return bbcodeChildren(node) + '\n';
        case 'TR': return bbcodeChildren(node) + '\n';
        case 'TD': return bbcodeChildren(node) + '\t';
        default:
            return '<'+node.tagName+'>' + bbcodeChildren(node) + '</'+node.tagName+'>';
        }
    }

    /**
     * Quotes one post, with post number.
     *
     * @param {Node} post
     */
    function QUOTEONE(post) {
        //_debug && console.log(post.querySelector('div.post,div.body').innerHTML);
        //var res = HTMLtoBB(post.querySelector('div.post,div.body').innerHTML),
        var res = bbcodeChildrenTrim(post.querySelector('div.post, div.body'));
        var author, creation, postid, type = '';
        if (res === '') return;

        postid = post.id.match(/(?:msg|post)(\d+)/i);
        if (postid === null)
            return;

        if (window.location.pathname === '/forums.php') type = '#';
        if (window.location.pathname === '/user.php') type = '*';
        if (window.location.pathname === '/torrents.php') type = '-1';
        if (window.location.pathname === '/torrents2.php') type = '-2';
        if (type !== '')
            res = '[quote=' + type + postid[1] + ']' + res + '[/quote]\n';
        else {
            author = post.className.match(/user_(\d+)/i);
            if (author !== null)
                author = '[b][user]' + author[1] + '[/user][/b] ';
            else {
                author = document.querySelector('#' + postid[0] + ' a[href^="/user.php?"]');
                if (author !== null) {
                    author = author.href.match(/id=(\d+)/i);
                    author = (author !== null ? '[b][user]' + author[1] + '[/user][/b] ' : '');
                }
                else
                    author = '';
            }

            creation = document.querySelector('div#' + postid[0] + ' > div > div > p.posted_info > span');
            if (creation === null)
                creation = document.querySelector('div#' + postid[0] + ' > div > span > span.usercomment_posttime');
            if (creation !== null)
                creation = ' on ' + formattedUTCString(creation.title.replace(/-/g, '/'));
            else
                creation = '';

            res = author + '[url=' + window.location.pathname + window.location.search + '#' + postid[0] + ']wrote' + creation + '[/url]:\n[quote]' + res + '[/quote]\n\n';
        }

        document.getElementById('quickpost').value += res;

        var sel = document.getElementById('quickpost');
        if (sel !== null)
            sel.scrollIntoView();
    }

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey) && (e.keyCode === 'V'.charCodeAt(0)))
            QUOTEALL();
    });
})();