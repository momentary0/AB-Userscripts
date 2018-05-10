// ==UserScript==
// @name        AnimeBytes - Forum Search - Enhancement
// @namespace   Megure@AnimeBytes.tv
// @description Load posts into search results; highlight search terms; filter authors; slide through posts
// @include     http*://animebytes.tv/forums.php*
// @exclude     *action=viewthread*
// @version     0.72.1
// @grant       GM_getValue
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

if ((/^http.*:\/\/animebytes\.tv\/forums\.php/i.test(document.URL)) && !/action=viewthread/i.test(document.URL)) {
    (function ForumSearchEnhancement() {
        /* === Inserted from _delicious_common.js === */
        // Common functions used by many scripts.
        // Will be inserted once into the delicious bundle,
        // and prepended to each individual userscript.
        
        // Debug flag. Used to enable/disable some verbose console logging.
        var _debug = false;
        
        // jQuery, just for Pale Moon.
        // Note: this doesn't actually import jQuery successfully,
        // but for whatever reason, it lets PM load the script.
        if ((typeof jQuery) === 'undefined') {
            _debug && console.log('setting window.jQuery');
            jQuery = window.jQuery;
            $ = window.$;
            $j = window.$j;
        }
        
        // Super duper important functions
        // Do not delete or something might break and stuff!! :(
        HTMLCollection.prototype.each = function (f) { for (var i = 0, e = null; e = this[i]; i++) f.call(e, e); return this; };
        HTMLElement.prototype.clone = function (o) { var n = this.cloneNode(); n.innerHTML = this.innerHTML; if (o !== undefined) for (var e in o) n[e] = o[e]; return n; };
        // Thank firefox for this ugly shit. Holy shit firefox get your fucking shit together >:(
        function forEach(arr, fun) { return HTMLCollection.prototype.each.call(arr, fun); }
        function clone(ele, obj) { return HTMLElement.prototype.clone.call(ele, obj); }
        
        function injectScript(content, id) {
            var script = document.createElement('script');
            if (id) script.setAttribute('id', id);
            script.textContent = content.toString();
            document.body.appendChild(script);
            return script;
        }
        if (typeof GM_getValue === 'undefined'
                || (GM_getValue.toString && GM_getValue.toString().indexOf("not supported") > -1)) {
            _debug && console.log('Setting fallback localStorage GM_* functions');
            // There is some difference between this.GM_getValue and just GM_getValue.
            _debug && console.log(this.GM_getValue);
            _debug && typeof GM_getValue !== 'undefined' && console.log(GM_getValue.toString());
            // Previous versions lacked a @grant GM_getValue header, which resulted
            // in these being used when they shouldn't have been.
            this.GM_getValue = function (key, def) { return localStorage[key] || def; };
            this.GM_setValue = function (key, value) { return localStorage[key] = value; };
            this.GM_deleteValue = function (key) { return delete localStorage[key]; };
            // We set this when we have used localStorage so if in future we switch,
            // it will be imported.
            GM_setValue('deliciousSettingsImported', 'false');
            _debug && console.log(GM_getValue);
        } else {
            _debug&& console.log('Using default GM_* functions.');
            // For backwards compatibility,
            // we'll implement migrating localStorage to GM settings.
            // However, we can't implement the reverse because when localStorage is
            // used, GM_getValue isn't even defined so we obviously can't import.
            if (GM_getValue('deliciousSettingsImported', 'false') !== 'true') {
                _debug && console.log('Importing localStorage to GM settings');
                GM_setValue('deliciousSettingsImported', 'true');
                var keys = Object.keys(localStorage);
                keys.forEach(function(key){
                    if (GM_getValue(key, 'undefined') === 'undefined') {
                        _debug && console.log('Imported ' + key);
                        GM_setValue(key, localStorage[key]);
                    } else {
                        _debug && console.log('Key exists ' + key);
                    }
                });
            }
        }
        
        function initGM(gm, def, json, overwrite) {
            if (typeof def === "undefined") throw "shit";
            if (typeof overwrite !== "boolean") overwrite = true;
            if (typeof json !== "boolean") json = true;
            var that = GM_getValue(gm);
            if (that != null) {
                var err = null;
                try { that = ((json) ? JSON.parse(that) : that); }
                catch (e) { if (e.message.match(/Unexpected token .*/)) err = e; }
                if (!err && Object.prototype.toString.call(that) === Object.prototype.toString.call(def)) { return that; }
                else if (overwrite) {
                    GM_setValue(gm, ((json) ? JSON.stringify(def) : def));
                    return def;
                } else { if (err) { throw err; } else { return that; } }
            } else {
                GM_setValue(gm, ((json) ? JSON.stringify(def) : def));
                return def;
            }
        }
        /* === End _delicious_common.js === */

        var a, allResults, background_color, button, cb, filterPost, forumIds, forumid, getFirstTagParent, hideSubSelection, i, index, input, len, linkbox1, loadPost, loadText, loadThreadPage, loadingText, myCell, myLINK, newCheckbox, newLinkBox, patt, processThreadPage, quickLink, quickLinkSubs, result, sR, searchForums, searchForumsCB, searchForumsNew, showFastSearchLinks, showPost, strong, tP, textReplace, text_color, toggleText, toggleVisibility, user_filter, user_td, user_tr, workInForumSearch, workInRestOfForum;

        background_color = GM_getValue('ABForumSearchHighlightBG', '#FFC000');

        text_color = GM_getValue('ABForumSearchHighlightFG', '#000000');

        toggleText = GM_getValue('ABForumToggleText', '(Toggle)');

        loadText = GM_getValue('ABForumLoadText', '(Load)');

        loadingText = GM_getValue('ABForumLoadingText', '(Loading)');

        hideSubSelection = GM_getValue('ABForumSearchHideSubfor', 'true') === 'true';

        workInForumSearch = GM_getValue('ABForumSearchWorkInFS', 'true') === 'true' && document.URL.indexOf('action=search') >= 0;

        workInRestOfForum = GM_getValue('ABForumEnhWorkInRest', 'false') === 'true' && (document.URL.indexOf('action=viewforum') >= 0 || document.URL.indexOf('?') === -1);

        showFastSearchLinks = GM_getValue('ABForumEnhFastSearch', 'true') === 'true' && document.URL.indexOf('action=viewforum') >= 0;

        user_filter = [];

        sR = [];

        tP = [];

        cb = [];

        getFirstTagParent = function (elem, tag) {
            while (elem !== null && elem.tagName !== 'BODY' && elem.tagName !== tag) {
                elem = elem.parentNode;
            }
            if (elem === null || elem.tagName !== tag) {
                return null;
            } else {
                return elem;
            }
        };

        textReplace = function (elem) {
            var node, regExp, walk;
            if (patt !== '' && (background_color !== 'none' || text_color !== 'none')) {
                walk = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false);
                node = walk.nextNode();
                regExp = new RegExp('(' + patt + ')', 'i');
                while (node != null) {
                    node.textContent.replace(regExp, function (term) {
                        var args, newSpan, newTextNode, offset;
                        args = [].slice.call(arguments);
                        offset = args[args.length - 2];
                        newTextNode = node.splitText(offset);
                        newTextNode.textContent = newTextNode.textContent.substr(term.length);
                        newSpan = document.createElement('span');
                        if (background_color !== 'none') {
                            newSpan.style.backgroundColor = background_color;
                        }
                        if (text_color !== 'none') {
                            newSpan.style.color = text_color;
                        }
                        newSpan.appendChild(document.createTextNode(term));
                        node.parentNode.insertBefore(newSpan, newTextNode);
                        return node = walk.nextNode();
                    });
                    node = walk.nextNode();
                }
            }
        };

        processThreadPage = function (id, threadid, page, parent, link) {
            return function () {
                var _i, cell, i, j, len, len1, linkbox, myColsp, nextPost, pagenums, post, prevPost, ref, ref1, td, threadPage, tr, user_id;
                threadPage = "threadid=" + threadid + "&page=" + page;
                link.textContent = toggleText;
                sR[id] = [];
                sR[id].parent = parent;
                sR[id].index = 0;
                sR[id].page = page;
                sR[id].threadid = threadid;
                ref = tP[threadPage];
                for (_i = i = 0, len = ref.length; i < len; _i = ++i) {
                    post = ref[_i];
                    if (post.id === id) {
                        sR[id].index = _i;
                    }
                }
                user_id = tP[threadPage][sR[id].index].className.split('_');
                user_id = user_id[user_id.length - 1];
                sR[id].user = tP[threadPage][sR[id].index].querySelector('a[href="/user.php?id=' + user_id + '"]').textContent;
                linkbox = document.createElement('div');
                pagenums = document.createElement('div');
                linkbox.className = 'linkbox';
                pagenums.className = 'pagenums';
                prevPost = document.createElement('a');
                nextPost = document.createElement('a');
                prevPost.href = '#';
                nextPost.href = '#';
                prevPost.className = 'page-link';
                nextPost.className = 'page-link';
                prevPost.textContent = '← Prev';
                nextPost.textContent = 'Next →';
                pagenums.appendChild(prevPost);
                pagenums.appendChild(nextPost);
                linkbox.appendChild(pagenums);
                prevPost.addEventListener('click', showPost(id, true), true);
                nextPost.addEventListener('click', showPost(id, false), true);
                tr = document.createElement('tr');
                td = document.createElement('td');
                myColsp = 0;
                ref1 = parent.cells;
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    cell = ref1[j];
                    myColsp += cell.colSpan;
                }
                td.colSpan = myColsp;
                td.appendChild(linkbox);
                td.appendChild(tP[threadPage][sR[id].index]);
                tr.appendChild(td);
                sR[id].td = td;
                sR[id].parent.parentNode.insertBefore(tr, sR[id].parent.nextSibling);
            };
        };

        loadThreadPage = function (threadid, page) {
            var threadPage, xhr;
            threadPage = "threadid=" + threadid + "&page=" + page;
            tP[threadPage] = 'Loading';
            cb[threadPage] = [];
            xhr = new XMLHttpRequest();
            xhr.open('GET', "https://animebytes.tv/forums.php?action=viewthread&" + threadPage, true);
            xhr.send();
            xhr.onreadystatechange = function () {
                var callback, i, j, len, len1, parser, post, ref, ref1;
                if (xhr.readyState === 4) {
                    parser = new DOMParser();
                    tP[threadPage] = (parser.parseFromString(xhr.responseText, 'text/html')).querySelectorAll('div[id^="post"]');
                    ref = tP[threadPage];
                    for (i = 0, len = ref.length; i < len; i++) {
                        post = ref[i];
                        textReplace(post);
                    }
                    ref1 = cb[threadPage];
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        callback = ref1[j];
                        callback();
                    }
                    return delete cb[threadPage];
                }
            };
        };

        loadPost = function (link, index, filtered) {
            return function (event) {
                var cell, id, match, newLink, node, page, threadPage, threadid;
                if (event != null) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                newLink = link.previousSibling;
                cell = link.parentNode;
                node = getFirstTagParent(link, 'TR');
                threadid = link.href.match(/threadid=(\d+)/i);
                threadid = threadid != null ? threadid[1] : '0';
                match = link.href.match(/([^#]*)(?:#post(\d+))?/i);
                if (match != null) {
                    id = match[2] != null ? 'post' + match[2] : id = index + link.href;
                } else {
                    return;
                }
                if (id in sR) {
                    if (filtered === true) {
                        filterPost(id)();
                    } else {
                        toggleVisibility(id);
                    }
                } else {
                    page = link.href.match(/page=(\d+)/i);
                    page = page != null ? parseInt(page[1], 10) : 1;
                    link.previousSibling.textContent = loadingText;
                    threadPage = "threadid=" + threadid + "&page=" + page;
                    if (threadPage in tP) {
                        if (tP[threadPage] === 'Loading') {
                            cb[threadPage].push(processThreadPage(id, threadid, page, node, newLink));
                            if (filtered === true) {
                                cb[threadPage].push(filterPost(id));
                            }
                        } else {
                            processThreadPage(id, threadid, page, node, newLink)();
                            if (filtered === true) {
                                filterPost(id)();
                            }
                        }
                    } else {
                        loadThreadPage(threadid, page);
                        cb[threadPage].push(processThreadPage(id, threadid, page, node, newLink));
                        if (filtered === true) {
                            cb[threadPage].push(filterPost(id));
                        }
                    }
                }
            };
        };

        toggleVisibility = function (id) {
            var elem;
            elem = sR[id];
            if (elem.td.parentNode.style.visibility === 'collapse') {
                showPost(id, null)();
                return elem.td.parentNode.style.visibility = 'visible';
            } else {
                return elem.td.parentNode.style.visibility = 'collapse';
            }
        };

        showPost = function (id, prev) {
            return function (event) {
                var elem, nextTP, prevTP, threadPage;
                elem = sR[id];
                threadPage = "threadid=" + elem.threadid + "&page=" + elem.page;
                nextTP = "threadid=" + elem.threadid + "&page=" + (elem.page + 1);
                prevTP = "threadid=" + elem.threadid + "&page=" + (elem.page - 1);
                if (event != null) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                if (prev === true) {
                    if (elem.index === 0 && elem.page > 1) {
                        if (prevTP in tP) {
                            if (tP[prevTP] === 'Loading') {
                                cb[prevTP].push(showPost(id, prev));
                            } else {
                                elem.page = elem.page - 1;
                                elem.index = tP[prevTP].length - 1;
                                elem.td.replaceChild(tP[prevTP][elem.index], elem.td.lastChild);
                            }
                        } else {
                            loadThreadPage(elem.threadid, elem.page - 1);
                            cb[prevTP].push(showPost(id, prev));
                        }
                    } else {
                        elem.index = Math.max(elem.index - 1, 0);
                        if (elem.td.children.length === 2) {
                            elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
                        } else {
                            elem.td.appendChild(tP[threadPage][elem.index]);
                        }
                    }
                } else if (prev === false) {
                    if (elem.index === 24) {
                        if (nextTP in tP) {
                            if (tP[nextTP] === 'Loading') {
                                cb[prevTP].push(showPost(id, prev));
                            } else {
                                if (tP[nextTP].length > 0) {
                                    elem.page = elem.page + 1;
                                    elem.index = 0;
                                    elem.td.replaceChild(tP[nextTP][0], elem.td.lastChild);
                                }
                            }
                        } else {
                            loadThreadPage(elem.threadid, elem.page + 1);
                            cb[nextTP].push(showPost(id, prev));
                        }
                    } else {
                        elem.index = Math.min(elem.index + 1, tP[threadPage].length - 1);
                        if (elem.td.children.length === 2) {
                            elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
                        } else {
                            elem.td.appendChild(tP[threadPage][elem.index]);
                        }
                    }
                } else {
                    if (elem.td.children.length === 2) {
                        elem.td.replaceChild(tP[threadPage][elem.index], elem.td.lastChild);
                    } else {
                        elem.td.appendChild(tP[threadPage][elem.index]);
                    }
                }
            };
        };

        filterPost = function (id) {
            return function () {
                var elem, i, len, toFilter, user_name;
                elem = sR[id];
                toFilter = true;
                for (i = 0, len = user_filter.length; i < len; i++) {
                    user_name = user_filter[i];
                    if (elem.user.toUpperCase() === user_name.toUpperCase()) {
                        toFilter = false;
                        break;
                    }
                }
                if (toFilter) {
                    elem.td.parentNode.style.visibility = 'collapse';
                    elem.parent.style.visibility = 'collapse';
                }
            };
        };

        if (workInRestOfForum || workInForumSearch) {
            patt = document.querySelector('form[action=""] input[name="search"]');
            if (patt != null) {
                patt = patt.value.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\s+/g, '|');
            } else {
                patt = '';
            }
            allResults = document.querySelectorAll('a[href^="/forums.php?action=viewthread"]');
            for (index = i = 0, len = allResults.length; i < len; index = ++i) {
                result = allResults[index];
                textReplace(result);
                a = document.createElement('a');
                a.href = '#';
                a.textContent = loadText;
                a.addEventListener('click', loadPost(result, index, false), true);
                myCell = result.parentNode;
                myCell.insertBefore(a, result);
            }
        }

        if (workInForumSearch) {
            user_tr = document.createElement('tr');
            user_td = [];
            user_td.push(document.createElement('td'));
            user_td.push(document.createElement('td'));
            user_td[0].className = 'label';
            strong = document.createElement('strong');
            strong.textContent = 'Filter author(s):';
            user_td[0].appendChild(strong);
            input = document.createElement('input');
            input.placeholder = 'Comma- or space-separated list of authors';
            input.size = '64';
            button = document.createElement('button');
            button.textContent = 'Filter';
            button.type = 'button';
            user_td[1].appendChild(input);
            user_td[1].appendChild(button);
            user_tr.appendChild(user_td[0]);
            user_tr.appendChild(user_td[1]);
            searchForums = document.querySelector('select[name="forums[]"]').parentNode.parentNode;
            searchForums.parentNode.insertBefore(user_tr, searchForums);
            button.addEventListener('click', function (event) {
                var j, len1, results, userName;
                if (input.value.replace(/[,\s]/g, '') !== '') {
                    user_filter = (function () {
                        var j, len1, ref, results;
                        ref = input.value.trim().replace(/[,\s]+/g, ',').split(',');
                        results = [];
                        for (j = 0, len1 = ref.length; j < len1; j++) {
                            userName = ref[j];
                            results.push(userName.trim());
                        }
                        return results;
                    })();
                    button.disabled = 'disabled';
                    results = [];
                    for (index = j = 0, len1 = allResults.length; j < len1; index = ++j) {
                        result = allResults[index];
                        results.push(loadPost(result, index, true)());
                    }
                    return results;
                }
            }, true);
        }
    }).call(this);
}