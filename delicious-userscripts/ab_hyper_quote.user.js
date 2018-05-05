// ==UserScript==
// @name        AB - HYPER QUOTE!
// @author      Megure
// @description Select text and press CTRL+V to quote
// @include     https://animebytes.tv/*
// @version     0.1.1.2
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

// HYPER QUOTE by Megure
// Select text and press CTRL+V to quote
(function ABHyperQuote() {
    if (document.getElementById('quickpost') === null)
    {
        return;
    }

    var _debug = true;

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


    function QUOTEONE(post) {
        function HTMLtoBB(str) {
            // Order is somewhat relevant.
            // We can be certain that < and > denote HTML tags because 'str'
            // is obtained from .innerHTML; < and similar are HTML escaped.
                // Eliminates insignificant whitespace between HTML elements.
            var ret = str.replace(/>\s+</ig, '><').
                // Quotes of a specific user.
                replace(/<strong><a.*?>.*?<\/a><\/strong> <a.*?href="(.*?)#(?:msg|post)(.*?)".*?>wrote(?: on )?(.*?)<\/a>:?\s*<blockquote class="blockquote">([\s\S]*?)<\/blockquote>/ig, function (html, href, id, dateString, quote) {
                    var type = '';
                    _debug && console.log('inner quote href: ' +href);
                    if (/\/forums\.php/i.test(href)) type = '#';
                    if (/\/user\.php/i.test(href)) type = '*';
                    if (/\/torrents\.php/i.test(href)) type = '-1';
                    if (/\/torrents2\.php/i.test(href)) type = '-2';
                    if (type !== '')
                        return '[quote=' + type + id + ']' + quote + '[/quote]';
                    else
                        return html.replace(dateString, formattedUTCString(dateString));
                }).
                replace(/<strong>Added on (.*?):?<\/strong>/ig, function (html, dateString) {
                    return html.replace(dateString, formattedUTCString(dateString));
                }).
                // Currently only :shitpizza:
                replace(/<img.* alt="(:[^:]+:)" .*class="bbcode_smiley">/ig, '$1').
                // Searches for BBCode input buttons to find string to insert.
                replace(/<span class="smiley-.+?" title="(.+?)"><\/span>/ig, function (html, smiley) {
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
                }).
                replace(/<iframe.*?src="([^?"]*).*?".*?><\/iframe>/ig, '[youtube]$1[/youtube]').
                // Eliminates empty HTML tags.
                replace(/<([^\s>\/]+)[^>]*>\s*<\/([^>]+)>/ig, function (html, match1, match2) {
                    if (match1 === match2)
                        return '';
                    return html;
                }).
                replace(/<ul><li>(.+?)<\/li><\/ul>/ig, '[*]$1').
                replace(/<a.*?href="torrents\.php\?.*?torrentid=([0-9]*?)".*?>([\s\S]*?)<\/a>/ig, '[torrent=$1]$2[/torrent]').
                replace(/<a.*?href="(.*?)".*?>([\s\S]*?)<\/a>/ig, function (html, match1, match2) {
                    if (match1.indexOf('://') === -1 && match1.length > 0 && match1[0] !== '/')
                        return '[url=/' + match1 + ']' + match2 + '[/url]'
                    else
                        return '[url=' + match1 + ']' + match2 + '[/url]'
                }).
                replace(/<strong>([\s\S]*?)<\/strong>/ig, '[b]$1[/b]').
                replace(/<em>([\s\S]*?)<\/em>/ig, '[i]$1[/i]').
                replace(/<u>([\s\S]*?)<\/u>/ig, '[u]$1[/u]').
                replace(/<s>([\s\S]*?)<\/s>/ig, '[s]$1[/s]').
                replace(/<div style="text-align: center;">([\s\S]*?)<\/div>/ig, '[align=center]$1[/align]').
                replace(/<div style="text-align: left;">([\s\S]*?)<\/div>/ig, '[align=left]$1[/align]').
                replace(/<div style="text-align: right;">([\s\S]*?)<\/div>/ig, '[align=right]$1[/align]').
                replace(/<span style="color:\s*(.*?);?">([\s\S]*?)<\/span>/ig, '[color=$1]$2[/color]').
                replace(/<span class="size(.*?)">([\s\S]*?)<\/span>/ig, '[size=$1]$2[/size]').
                replace(/<blockquote class="blockquote">([\s\S]*?)<\/blockquote>/ig, '[quote]$1[/quote]').
                replace(/<div.*?class=".*?spoilerContainer.*?hideContainer.*?".*?><input.*?value="(?:Show\s*|Hide\s*)(.*?)".*?><div.*?class=".*?spoiler.*?".*?>([\s\S]*?)<\/div><\/div>/ig, function (html, button, content) {
                    if (button !== '')
                        return '[hide=' + button + ']' + content + '[/hide]';
                    else
                        return '[hide]' + content + '[/hide]';
                }).
                replace(/<div class="spoilerContainer"><input type="button" class="spoilerButton" value="(?:Show|Hide) ([^"]+) spoiler"><div class="spoiler"[^>]*>([^<]*)<\/div><\/div>/ig, function (html, button, content) {
                    if (button !== '')
                        return '[spoiler=' + button + ']' + content + '[/spoiler]';
                    else
                        return '[spoiler]' + content + '[/spoiler]';
                }).
                replace(/<img.*?src="(.*?)".*?>/ig, '[img]$1[/img]').
                replace(/<div class="codeBox"><pre>([^<]*)<\/pre><\/div>/ig, '[code]$1[/code]').
                replace(/<span class="last-edited">[\s\S]*$/ig, '');
            if (ret !== str) return HTMLtoBB(ret);
            else {
                // We cannot replace <br> earlier because the \n
                // would be deleted by the whitespace replacement.
                ret = ret.replace(/<br[^>]*>/ig, '\n');
                _debug && console.log(ret);
                // Decode HTML
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = ret;
                // Note: textContent has the effect of removing all unmatched
                // HTML tags from the string.
                return tempDiv.textContent.trim();
            }
        }

        _debug && console.log(post.querySelector('div.post,div.body').innerHTML);
        var res = HTMLtoBB(post.querySelector('div.post,div.body').innerHTML),
            author, creation, postid, type = '';
        if (res === '') return;

        postid = post.id.match(/(?:msg|post)(\d+)/i);
        if (postid === null)
            return;

        if (window.location.pathname === '/forums.php') type = '#';
        if (window.location.pathname === '/user.php') type = '*';
        if (window.location.pathname === '/torrents.php') type = '-1';
        if (window.location.pathname === '/torrents2.php') type = '-2';
        if (type !== '')
            res = '[quote=' + type + postid[1] + ']' + res + '[/quote]';
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