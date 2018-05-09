// ==UserScript==
// @name        AB - HYPER QUOTE!
// @author      Megure, TheFallingMan
// @description Select text and press CTRL+V to quote
// @include     https://animebytes.tv/*
// @version     0.2.2
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

(function ABHyperQuote() {
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
        function inArray(arr, elem) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === elem)
                    return i;
            }
            return -1;
        }

        if (range.collapsed === true) return;

        var html1, html2, copy, res, start = [], end = [], startNode, endNode;
        html1 = range.startContainer;
        while (html1.parentNode !== null) {
            start.push(inArray(html1.parentNode.childNodes, html1));
            html1 = html1.parentNode;
        }
        html2 = range.endContainer;
        while (html2.parentNode !== null) {
            end.push(inArray(html2.parentNode.childNodes, html2));
            html2 = html2.parentNode;
        }
        if (html1 !== html2 || html1 === null) return;
        copy = html1.cloneNode(true);

        startNode = copy;
        for (var i = start.length - 1; i >= 0; i--) {
            if (start[i] === -1) return;
            startNode = startNode.childNodes[start[i]];
        }
        endNode = copy;
        for (var i = end.length - 1; i >= 0; i--) {
            if (end[i] === -1) return;
            endNode = endNode.childNodes[end[i]];
        }

        if (endNode.nodeType === 3)
            endNode.data = endNode.data.substr(0, range.endOffset);
        else if (endNode.nodeType === 1)
            for (var i = endNode.childNodes.length; i > range.endOffset; i--)
                endNode.removeChild(endNode.lastChild);
        if (range.startOffset > 0) {
            if (startNode.nodeType === 3)
                startNode.data = startNode.data.substr(range.startOffset);
            else if (startNode.nodeType === 1)
                for (var i = 0; i < range.startOffset; i++)
                    startNode.removeChild(startNode.firstChild);
        }

        removeChildren(startNode, true);
        removeChildren(endNode, false);

        var posts = copy.querySelectorAll('div[id^="post"],div[id^="msg"]');
        for (var i = 0; i < posts.length; i++)
        {
            _debug && console.log(posts[i]);
            QUOTEONE(posts[i]);
        }
    }

    /**
     * Returns BBCode of one whole div.post.
     *
     * @param {HTMLDivElement} postDiv
     */
    function bbcodePostDiv(postDiv) {
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
                bbcodeString += ('[quote='+thisNode.firstChild.nodeValue+']'
                    +bbcodeChildren(parentNode.childNodes[i+2])+'\n[/quote]');
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
                return '[quote=' + quoteType + id[1] + ']' + bbcodeChildren(quoteNode) + '\n[/quote]';
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
            return '[code]\n'+divNode.firstElementChild.firstChild.nodeValue+'\n[/code]';
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
            bbcodeChildren(spoilerDiv.children[1]) + '\n[/'+bbcodeTag+']';
    }


    /**
     * Returns BBCode for a [mediainfo] tag.
     *
     * @param {HTMLDivElement} buttonDiv Div containing the button and spoiler.
     * @param {HTMLTableElement} mediainfoTable
     */
    function bbcodeMediainfo(buttonDiv, mediainfoTable) {
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
                colour = ('#' + parseInt(rgbMatch[1]).toString(16)
                +parseInt(rgbMatch[2]).toString(16)
                +parseInt(rgbMatch[3]).toString(16));
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
            if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
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
            case 'BLOCKQUOTE': return '[quote]'+bbcodeChildren(node)+'[/quote]';
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
        var res = bbcodePostDiv(post.querySelector('div.post, div.body'));
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

        sel = document.getElementById('quickpost');
        if (sel !== null)
            sel.scrollIntoView();
    }

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey) && (e.keyCode === 'V'.charCodeAt(0)))
            QUOTEALL();
    });
})();