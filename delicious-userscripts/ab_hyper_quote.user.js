// ==UserScript==
// @name        AB - HYPER QUOTE!
// @author      Megure, TheFallingMan
// @description Select text and press CTRL+V to quote
// @include     https://animebytes.tv/*
// @version     0.2.1
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

(function ABHyperQuote() {
    if (document.getElementById('quickpost') === null)
        return;

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
            // Start range of the current "range group".
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
                    // In this case, the current range does not continue from
                    // the previous one.
                    if (startRange !== previousRange) {
                        // Create and append a new, more sensible, range.
                        var newRange = document.createRange();
                        newRange.setStart(startRange.startContainer, startRange.startOffset);
                        newRange.setEnd(previousRange.endContainer, previousRange.endOffset);
                        allRanges.push(newRange);
                    } else {
                        // They're both the same, append one.
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

    function bbcodePostDiv(postDiv) {
        return bbcodeChildren(postDiv).trim();
    }

    /**
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
                var text = thisNode.nodeValue;
                if (i > 0 && parentNode.childNodes[i-1].nodeType === Node.ELEMENT_NODE
                    && parentNode.childNodes[i-1].tagName.toUpperCase() === 'BR')
                    text = text.replace(/^\s+/, '');
                if (i+1 < parentNode.childNodes.length
                    && parentNode.childNodes[i+1].nodeType === Node.ELEMENT_NODE
                    && parentNode.childNodes[i+1].tagName.toUpperCase() === 'BR')
                    text = text.replace(/\s+$/, '');
                bbcodeString += text;
                continue;
            }
            var isQuote = false;
            try {
                // We fully expect this to throw exceptions if the element
                // is not a quote block, as the surrounding structure
                // will not be there.
                //debugger;
                isQuote = (
                    (i+4 < parentNode.childNodes.length)
                    && thisNode.nodeType === Node.ELEMENT_NODE
                    && thisNode.tagName.toUpperCase() === 'STRONG'
                    && thisNode.firstElementChild.href.indexOf('user.php?id=') !== -1
                    && parentNode.childNodes[i+2].textContent.indexOf('wrote') !== -1
                    && parentNode.childNodes[i+2].firstElementChild.tagName.toUpperCase() === 'SPAN'
                    && parentNode.childNodes[i+2].firstElementChild.title
                    && parentNode.childNodes[i+3].nodeValue.indexOf(':') !== -1
                    && parentNode.childNodes[i+4].classList.contains('blockquote')
                );
            } catch (exception) { _debug && console.log(exception); }
            _debug && console.log('isQuote: ' + isQuote);
            if (isQuote) {
                bbcodeString += bbcodeQuote(thisNode,
                    parentNode.childNodes[i+2], parentNode.childNodes[i+4]);
                i += 4;
            } else {
                bbcodeString += bbcodeOneElement(thisNode);
            }
        }
        return bbcodeString;
    }
    /**
     *
     * @param {HTMLElement} strongNode
     * @param {HTMLAnchorElement} wroteLink
     * @param {HTMLQuoteElement} quoteNode
     */
    function bbcodeQuote(strongNode, wroteLink, quoteNode) {
        var quoteType = '';
        var href = wroteLink.href;
        if (href.indexOf('/forums.php') !== -1) quoteType = '#';
        else if (href.indexOf('/user.php') !== -1) quoteType = '*';
        else if (href.indexOf('/torrents.php') !== -1) quoteType = '-1';
        else if (href.indexOf('/torrents2.php') !== -1) quoteType = '-2';
        if (quoteType !== '') {
            var id = /#(?:msg|post)?(\d+)$/.exec(href);
            if (id)
                return '[quote=' + quoteType + id[1] + ']' + bbcodeChildren(quoteNode) + '[/quote]\n';
        }
        return ('[url='+wroteLink.href+']Unknown quote[/url][quote]'
            +bbcodeChildren(quoteNode)+'[/quote]');
    }

    function bbcodeStrong(strongNode) {
        if (strongNode.childNodes.length === 1
            && strongNode.firstChild.nodeType === Node.TEXT_NODE
            && strongNode.firstChild.nodeValue.startsWith('Added on ')) {
            var dateString = strongNode.firstChild.nodeValue.slice(9);
            var end = '';
            if (dateString.charAt(dateString.length-1) === ':') {
                dateString = dateString.slice(0, -1);
                end = ':';
            }
            return '[b]Added on '+formattedUTCString(dateString)+end+'[/b]';
        } else {
            return '[b]'+bbcodeChildren(strongNode)+'[/b]';
        }
    }

    /**
     *
     * @param {HTMLDivElement} divNode
     */
    function bbcodeDiv(divNode) {
        if (divNode.style.textAlign) {
            var align = divNode.style.textAlign;
            return '[align='+align+']'+bbcodeChildren(divNode)+'[/align]\n';
        }
        if (divNode.classList.contains('codeBox')) {
            return '[code]'+divNode.firstElementChild.firstChild.nodeValue+'[/code]\n';
        }
        if (divNode.classList.contains('spoilerContainer')) {
            return bbcodeSpoiler(divNode);
        }
    }

    /**
     *
     * @param {HTMLDivElement} spoilerDiv
     */
    function bbcodeSpoiler(spoilerDiv) {
        var isSpoiler = !spoilerDiv.classList.contains('hideContainer');
        var bbcodeTag = isSpoiler ? 'spoiler' : 'hide';
        var label = spoilerDiv.firstElementChild.value.replace(/(Hide|Show)/, '');
        if (label.length !== 0) {
            if (isSpoiler)
               label = label.replace(/ spoiler$/, '');
            label = label.substr(1);
        }
        return '['+bbcodeTag + (label.length!==0 ? '='+label : '') + ']' +
            bbcodeChildren(spoilerDiv.children[1]) + '[/'+bbcodeTag+']';
    }

    /**
     *
     * @param {HTMLUListElement} listNode
     */
    function bbcodeList(listNode, bbcodeTag) {
        var str = '';
        for (var c = 0; c < listNode.childElementCount; c++) {
            str += bbcodeTag + bbcodeChildren(listNode.children[c]);
            if (c < listNode.childElementCount-1)
                str += '\n';
        }
        return str;
    }

    function bbcodeImage(imgNode) {
        if (imgNode.classList.contains('bbcode_smiley')) {
            return imgNode.alt;
        }
        return '[img]'+imgNode.src+'[/img]';
    }

    var rgbRegex = /^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/i;

    /**
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
            if (rgbMatch)
                colour = ('#' + parseInt(rgbMatch[1]).toString(16)
                +parseInt(rgbMatch[2]).toString(16)
                +parseInt(rgbMatch[3]).toString(16));
            return '[color='+colour+']' + bbcodeChildren(spanNode) + '[/color]';
        }
        if (spanNode.className.startsWith('size')) {
            var size = spanNode.className.replace('size', '');
            return '[size='+size+']'+bbcodeChildren(spanNode)+'[/size]';
        }
        if (spanNode.className === 'last-edited') {
            return '';
        }
        if (spanNode.title)
            return formattedUTCString(spanNode.title);
        return bbcodeChildren(spanNode);
    }

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


    var userRegex = /\/user\.php\?id=(\d+)$/;
    var torrentRegex = /^torrents2?\.php\?id=\d+&torrentid=(\d+)$/;

    /**
     *
     * @param {HTMLAnchorElement} linkElement
     */
    function bbcodeLink(linkElement) {
        var href = linkElement.href;
        var realHref = linkElement.getAttribute('href');
        var userMatch = userRegex.exec(href);
        if (userMatch)
            return '[user]'+linkElement.textContent+'[/user]';
        var torrentMatch = torrentRegex.exec(realHref);
        if (torrentMatch) {
            return '[torrent]'+href+'[/torrent]';
        }
        return ('[url='+realHref+']'+ bbcodeChildren(linkElement) + '[/url]');
    }

    var youtubeRegex = /\/embed\/([^?]+)\?/i;
    var soundcloudRegex = /\/player\/\?url=([^&]+)&/i;

    /**
     *
     * @param {HTMLIFrameElement} iframeNode
     */
    function bbcodeIframe(iframeNode) {
        var src = iframeNode.src;
        if (src.indexOf('youtube.com/embed') !== -1) {
            return '[youtube]https://youtube.com/watch?v='+youtubeRegex.exec(src)[1]+'[/youtube]';
        }
        if (src.indexOf('soundcloud.com/player') !== -1) {
            return '[soundcloud]'+decodeURIComponent(soundcloudRegex.exec(src)[1])+'[/soundcloud]';
        }
        return 'Embedded media: ' + src;
    }

    function bbcodeOneElement(node) {
        if (node.nodeType !== Node.ELEMENT_NODE)
            return '';
        switch (node.tagName.toUpperCase()) {
            case 'DIV': return bbcodeDiv(node);
            case 'SPAN': return bbcodeSpan(node);
            case 'BR': return '\n';
            case 'STRONG': return bbcodeStrong(node);
            case 'EM': return '[i]'+bbcodeChildren(node)+'[/i]';
            case 'U': return '[u]'+bbcodeChildren(node)+'[/u]';
            case 'S': return '[s]'+bbcodeChildren(node)+'[/s]';
            case 'OL': return bbcodeList(node, '[#]');
            case 'UL': return bbcodeList(node, '[*]');
            case 'A': return bbcodeLink(node);
            case 'IMG': return bbcodeImage(node);
            case 'IFRAME': return bbcodeIframe(node);
            case 'BLOCKQUOTE': return '[quote]'+bbcodeChildren(node)+'[/quote]\n';
            default:
                return node.tagName+': ' + bbcodeChildren(node);
        }
    }

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
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 'V'.charCodeAt(0))
            QUOTEALL();
    });
})();