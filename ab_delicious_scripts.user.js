// ==UserScript==
// @name AnimeBytes delicious user scripts (updated)
// @author aldy, potatoe, alpha, Megure
// @version 1.967
// @downloadURL https://pastebin.com/raw/79WAyU12
// @updateURL https://pastebin.com/raw/79WAyU12
// @description Variety of userscripts to fully utilise the site and stylesheet. (Updated by TheFallingMan)
// @include *animebytes.tv/*
// @match https://*.animebytes.tv/*
// @icon http://animebytes.tv/favicon.ico
// ==/UserScript==

/*
Version history (TheFallingMan)
2018-04-15  1.964  Fixed capping seeding duration bonus to user's age. (start of changelog)
2018-04-15  1.965  Fixed compatibility with non-ES2015 compatible browsers.
2018-04-20  1.966  Updated to recognise and use IEC (KiB, MiB, etc.) byte prefixes.
2018-04-20  1.967  Fixed inserting (CTRL + ALT + Y) too many times on Youtube buttons.
                   Refactored code of keyboard shortcuts (near function 'insert').
*/

(function AnimeBytesDeliciousUserScripts(){

// Debug flag. Used to enable/disable some verbose console logging.
var _debug = false;

// Super duper important functions
// Do not delete or something might break and stuff!! :(
    HTMLCollection.prototype.each = function (f) { for (var i=0, e=null; e=this[i]; i++) f.call(e, e); return this; };
    HTMLElement.prototype.clone = function (o) { var n = this.cloneNode(); n.innerHTML = this.innerHTML; if (o!==undefined) for (var e in o) n[e] = o[e]; return n; };
    // Thank firefox for this ugly shit. Holy shit firefox get your fucking shit together >:(
    function forEach (arr, fun) { return HTMLCollection.prototype.each.call(arr, fun); }
    function clone (ele, obj) { return HTMLElement.prototype.clone.call(ele, obj); }

    function injectScript (content, id) {
        var script = document.createElement('script');
        if (id) script.setAttribute('id', id);
        script.textContent = content.toString();
        document.body.appendChild(script);
        return script;
    }
    if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported")>-1)) {
        this.GM_getValue=function (key,def) { return localStorage[key] || def; };
        this.GM_setValue=function (key,value) { return localStorage[key]=value; };
        this.GM_deleteValue=function (key) { return delete localStorage[key]; };
    }
    function initGM(gm, def, json, overwrite) {
        if (typeof def === "undefined") throw "shit";
        if (typeof overwrite !== "boolean") overwrite = true;
        if (typeof json !== "boolean") json = true;
        var that = GM_getValue(gm);
        if (that != null) {
            var err = null;
            try { that = ((json)?JSON.parse(that):that); }
            catch (e) { if (e.message.match(/Unexpected token .*/)) err = e; }
            if (!err && Object.prototype.toString.call(that) === Object.prototype.toString.call(def)) { return that; }
            else if (overwrite) {
                GM_setValue(gm, ((json)?JSON.stringify(def):def));
                return def;
            } else { if (err) { throw err; } else { return that; } }
        } else {
            GM_setValue(gm, ((json)?JSON.stringify(def):def));
            return def;
        }
    }
    function createSettingsPage() {
        function addCheckbox(title, description, varName, onValue, offValue) {
            if (typeof onValue !== "string" || typeof offValue !== "string" || onValue === offValue) onValue='true', offValue='false';
            var newLi = document.createElement('li');
            this[varName] = initGM(varName, onValue, false);
            newLi.innerHTML = "<span class='ue_left strong'>"+title+"</span>\n<span class='ue_right'><input type='checkbox' onvalue='"+onValue+"' offvalue='"+offValue+"' name='"+varName+"' id='"+varName+"'"+((this[varName]===onValue)?" checked='checked'":" ")+">\n<label for='"+varName+"'>"+description+"</label></span>";
            newLi.addEventListener('click', function(e){var t=e.target;if(typeof t.checked==="boolean"){if(t.checked){GM_setValue(t.id,t.getAttribute('onvalue'));}else{GM_setValue(t.id,t.getAttribute('offvalue'));}}});
            var poselistNode = document.getElementById('pose_list');
            poselistNode.appendChild(newLi);
            return newLi;
        }
        function addDropdown(title, description, varName, list, def) {
            var newLi = document.createElement('li'), innerHTML = '';
            this[varName] = initGM(varName, def, false);
            innerHTML += "<span class='ue_left strong'>"+title+"</span>\n<span class='ue_right'><select name='"+varName+"' id='"+varName+"'>";
            for (var i = 0; i < list.length; i++) {
                var el = list[i], selected = '';
                if (el[1] === GM_getValue(varName)) selected = " selected='selected'";
                innerHTML += "<option value='"+el[1]+"'"+selected+">"+el[0]+"</option>";
            }
            innerHTML += "</select><label for='"+varName+"'>"+description+"</label></span>";
            newLi.innerHTML = innerHTML;
            newLi.addEventListener('change', function(e) { GM_setValue(varName, e.target.value); });
            var poseList = document.getElementById('pose_list');
            poseList.appendChild(newLi);
            return newLi;
        }
        function relink(){$j(function(){var stuff=$j('#tabs > div');$j('ul.ue_tabs a').click(function(){stuff.hide().filter(this.hash).show();$j('ul.ue_tabs a').removeClass('selected');$j(this).addClass('selected');return false;}).filter(':first,a[href="'+window.location.hash+'"]').slice(-1)[0].click();});}
        var pose = document.createElement('div');
        pose.id = "potatoes_settings";
        pose.innerHTML = '<div class="head colhead_dark strong">User Script Settings</div><ul id="pose_list" class="nobullet ue_list"></ul>';
        var poseanc = document.createElement('li');
        poseanc.innerHTML = '&bull;<a href="#potatoes_settings">User Script Settings</a>';
        var tabsNode = document.getElementById('tabs');
        var linksNode = document.getElementsByClassName('ue_tabs')[0];
        if (document.getElementById('potatoes_settings') == null) { tabsNode.insertBefore(pose, tabsNode.childNodes[tabsNode.childNodes.length-2]); linksNode.appendChild(poseanc); document.body.removeChild(injectScript('('+relink.toString()+')();', 'settings_relink')); }
        addCheckbox("Delicious Better Quote", "Enable/Disable delicious better <span style='color: green; font-family: Courier New;'>&gt;quoting</span>", 'deliciousquote');
        addCheckbox("Delicious HYPER Quote", "Enable/Disable experimental HYPER quoting: select text and press CTRL+V to instant-quote. [EXPERIMENTAL]", 'delicioushyperquote');
        addCheckbox("Delicious Title Flip", "Enable/Disable delicious flipping of Forum title tags.", 'delicioustitleflip');
        addCheckbox("Disgusting Treats", "Hide/Unhide those hideous treats!", 'delicioustreats');
        addCheckbox("Delicious Keyboard Shortcuts", "Enable/Disable delicious keyboard shortcuts for easier access to Bold/Italics/Underline/Spoiler/Hide and aligning.", 'deliciouskeyboard');
        addCheckbox("Delicious Title Notifications", "Display number of notifications in title.", 'delicioustitlenotifications');
        addCheckbox("Delicious Yen per X", "Shows how much yen you receive per X, and as upload equivalent.", 'deliciousyenperx');
        addCheckbox("Delicious Ratio", "Shows ratio and raw ratio and how much uploade / download you need for certain ratio milestones.", 'deliciousratio');
        addCheckbox("Delicious Freeleech Pool", "Shows current freeleech pool progress in the navbar and on user pages (updated once an hour or when freeleech pool site is visited).", 'deliciousfreeleechpool');
        addDropdown("FL Pool Navbar Position", "Select position of freeleech pool progress in the navbar or disable it.", 'deliciousflpoolposition', [['Before user info', 'before #userinfo_minor'], ['After user info', 'after #userinfo_minor'], ['Before menu', 'before .main-menu.nobullet'], ['After menu', 'after .main-menu.nobullet'], ['Don\'t display', 'none']], 'after #userinfo_minor');
        addCheckbox("Delicious Freeleech Pie Chart", "Adds a dropdown with pie-chart to the freeleech pool progress in the navbar.", 'delicousnavbarpiechart');
        document.getElementById('pose_list').appendChild(document.createElement('hr'));
        addCheckbox("Delicious Dynamic Stylesheets", "Define rules below for which hour to show what stylesheet.", 'deliciousdynamicstylesheets');
        document.getElementById('pose_list').appendChild(document.createElement('hr'));
    }

    if (/\/user\.php\?.*action=edit/i.test(document.URL)) createSettingsPage();


    // A couple GM variables that need initializing
    var gm_deliciousquote = initGM('deliciousquote', 'true', false);
    var gm_delicioushyperquote = initGM('delicioushyperquote', 'true', false);
    var gm_delicioustitleflip = initGM('delicioustitleflip', 'true', false);
    var gm_delicioustreats = initGM('delicioustreats', 'true', false);
    var gm_deliciouskeyboard = initGM('deliciouskeyboard', 'true', false);
    var gm_delicioustitlenotifications = initGM('delicioustitlenotifications', 'true', false);
    var gm_deliciousyenperx = initGM('deliciousyenperx', 'true', false);
    var gm_deliciousratio = initGM('deliciousratio', 'true', false);
    var gm_deliciousfreeleechpool = initGM('deliciousfreeleechpool', 'true', false);
    var gm_delicousnavbarpiechart = initGM('delicousnavbarpiechart', 'false', false);
    var gm_deliciousdynamicstylesheets = initGM('deliciousdynamicstylesheets', 'false', false);


    // Better quote by Potatoe, multi-quote by Megure
    // Makes the quoting feature on AnimeBytes better by including links back to posts and the posted date.
    // Depends on injectScript
    if (GM_getValue('deliciousquote') === 'true') {
        var quotes = document.querySelectorAll('a[onclick^="Quote"]');
        for (var i = 0, len = quotes.length; i < len; i++) {
            var elem = quotes[i],
                args = elem.getAttribute('onClick').match(/Quote\s*\((?:\s*'([^']*)'\s*)?(?:,\s*'([^']*)'\s*)?(?:,\s*'([^']*)'\s*)?\)/i),
                cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'com-quote-multiquoteCB';
            if (args[1] === undefined) args[1] = '';
            if (args[2] === undefined) args[2] = '';
            if (args[3] === undefined) args[3] = '';
            cb.setAttribute('postid', args[1]);
            cb.setAttribute('username', args[2]);
            cb.setAttribute('surround', args[3]);
            // Hide it if usercomment
            if (/usercomment/i.test(elem.className))
                cb.style.display = 'none';
            elem.parentNode.insertBefore(cb, elem);
        }
        function Quote(postid, username, surround) {
            var result = [],
                results = 0,
                multiQuote,
                temp = document.querySelector('input.com-quote-multiquoteCB[postid="' + postid + '"]');
            if (temp !== null)
                temp.checked = true;
            multiQuote = document.querySelectorAll('.com-quote-multiquoteCB:checked');
            if (multiQuote.length > 0) {
                for (var i = 0, len = multiQuote.length; i < len; i++) {
                    var elem = multiQuote[i],
                            postid = elem.getAttribute('postid'),
                            username = elem.getAttribute('username'),
                            surround = elem.getAttribute('surround');
                    retrievePost(postid, username, surround, i);
                }
            } else {
                multiQuote = [document.createElement('input')];
                retrievePost(postid, username, surround, 0);
            }
            function checkResult() {
                if (multiQuote.length === ++results) {
                    insert_text(result.join('\n\n\n'), '');
                    for (var i = 0, len = multiQuote.length; i < len; i++)
                        multiQuote[i].checked = false;
                }
            }
            function retrievePost(postid, username, surround, index) {
                $j.ajax({
                    url: window.location.pathname,
                    data: {
                        action: 'get_post',
                        post: postid
                    },
                    success: function (response) {
                        function replaceImg(text){if(text.match(/^([^]*)(\[img\][^\[]+\[\/img\])([^]*)$/mi)!=null){return text.replace(/^([^]*)(\[img\][^\[]+\[\/img\])([^]*)$/mi,function(full,$1,$2,$3){var tmp="BQTMPBQ"+new Date().getTime()+"BQTMPBQ",ssm=$1.match(/\[hide(=[^\]]*)?\]/mgi),sem=$1.match(/\[\/hide\]/mgi),esm=$3.match(/\[hide(=[^\]]*)?\]/mgi),eem=$3.match(/\[\/hide\]/mgi),ssm=(ssm!=null)?ssm.length:0,sem=(sem!=null)?sem.length:0,esm=(esm!=null)?esm.length:0,eem=(eem!=null)?eem.length:0,hsm=ssm-sem,hem=esm-eem,tmptxt=replaceImg($1+tmp+$3);$1=tmptxt.substring(0,tmptxt.search(tmp));$3=tmptxt.substring(tmptxt.search(tmp)+tmp.length,tmptxt.length);if(hsm>=hem&&hsm>0)return $1+$2+$3;return $1+'[hide=Image]'+$2+'[/hide]'+$3})}return text}
                        function replaceYouTube(text){if(text.match(/^([^]*)(\[youtube\][^\[]+\[\/youtube\])([^]*)$/mi)!=null){return text.replace(/^([^]*)(\[youtube\][^\[]+\[\/youtube\])([^]*)$/mi,function(full,$1,$2,$3){var tmp="BQTMPBQ"+new Date().getTime()+"BQTMPBQ",ssm=$1.match(/\[hide(=[^\]]*)?\]/mgi),sem=$1.match(/\[\/hide\]/mgi),esm=$3.match(/\[hide(=[^\]]*)?\]/mgi),eem=$3.match(/\[\/hide\]/mgi),ssm=(ssm!=null)?ssm.length:0,sem=(sem!=null)?sem.length:0,esm=(esm!=null)?esm.length:0,eem=(eem!=null)?eem.length:0,hsm=ssm-sem,hem=esm-eem,tmptxt=replaceYouTube($1+tmp+$3);$1=tmptxt.substring(0,tmptxt.search(tmp));$3=tmptxt.substring(tmptxt.search(tmp)+tmp.length,tmptxt.length);if(hsm>=hem&&hsm>0)return $1+$2+$3;return $1+'[hide=YouTube Video]'+$2+'[/hide]'+$3})}return text}
                        response = replaceYouTube(replaceImg(response));
                        if (window.location.pathname === '/forums.php') var type = '#';
                        if (window.location.pathname === '/user.php') var type = '*';
                        if (window.location.pathname === '/torrents.php') var type = '-1';
                        if (window.location.pathname === '/torrents2.php') var type = '-2';
                        if (typeof type === 'undefined')
                            var quoteText = '[quote=' + username + ']' + response + '[/quote]';
                        else
                            var quoteText = '[quote=' + type + postid + ']' + response + '[/quote]';
                        if (surround && surround.length > 0) quoteText = '[' + surround + ']' + quoteText + '[/' + surround + ']';
                        result[index] = quoteText;
                        checkResult();
                    },
                    error: function () {
                        result[index] = 'error retrieving post #' + postid;
                        checkResult();
                    },
                    dataType: 'html'
                });
            }
        }
        injectScript(Quote, 'BetterQuote');
    }


    // HYPER QUOTE by Megure
    // Select text and press CTRL+V to quote
    if (GM_getValue('delicioushyperquote') === 'true' && document.getElementById('quickpost') !== null) {
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
            for(var i = 0; i < sel.rangeCount; i++)
                QUOTEMANY(sel.getRangeAt(i));
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
                QUOTEONE(posts[i]);
        }


        function QUOTEONE(post) {
            function HTMLtoBB(str) {
                // Order is somewhat relevant
                var ret = str.replace(/<br.*?>/ig, '').
                        replace(/<strong><a.*?>.*?<\/a><\/strong> <a.*?href="(.*?)#(?:msg|post)(.*?)".*?>wrote(?: on )?(.*?)<\/a>:?\s*<blockquote class="blockquote">([\s\S]*?)<\/blockquote>/ig, function(html, href, id, dateString, quote) {
                            var type = '';
                            if (/\/forums\.php/i.test(href)) type = '#';
                            if (/\/user\.php/i.test(href)) type = '*';
                            if (/\/torrents\.php/i.test(href)) type = '-1';
                            if (/\/torrents2\.php/i.test(href)) type = '-2';
                            if (type !== '')
                                return '[quote=' + type + id + ']' + quote + '[/quote]';
                            else
                                return html.replace(dateString, formattedUTCString(dateString));
                        }).
                        replace(/<strong>Added on (.*?):?<\/strong>/ig, function(html,dateString) {
                            return html.replace(dateString, formattedUTCString(dateString));
                        }).
                        replace(/<span class="smiley-.+?" title="(.+?)"><\/span>/ig, function(html, smiley) {
                            var smileyNode = document.querySelector('img[alt="' + smiley + '"]');
                            if (smileyNode === null)
                                smileyNode = document.querySelector('img[src$="' + smiley + '.png"]');
                            if (smileyNode === null)
                                smileyNode = document.querySelector('img[src$="' + smiley.replace(/-/g, '_') + '.png"]');
                            if (smileyNode === null)
                                smileyNode = document.querySelector('img[src$="' + smiley.replace(/-/g, '_').toLowerCase() + '.png"]');
                            if (smileyNode === null)
                                smileyNode = document.querySelector('img[src$="' + smiley.replace(/face/g, '~_~') + '.png"]');
                            if (smileyNode !== null && smileyNode.parentNode !== null) {
                                smileyNode = smileyNode.parentNode.getAttribute('onclick').match(/'(.+?)'/i);
                                if (smileyNode !== null)
                                    return smileyNode[1];
                            }
                            return ':' + smiley + ':';
                        }).
                        replace(/<iframe.*?src="([^?"]*).*?".*?><\/iframe>/ig, '[youtube]$1[/youtube]').
                        replace(/<([^\s>\/]+)[^>]*>\s*<\/([^>]+)>/ig, function(html, match1, match2) {
                            if (match1 === match2)
                                return '';
                            return html;
                        }).
                        replace(/<ul><li>(.+?)<\/li><\/ul>/ig, '[*]$1').
                        replace(/<a.*?href="torrents\.php\?.*?torrentid=([0-9]*?)".*?>([\s\S]*?)<\/a>/ig, '[torrent=$1]$2[/torrent]').
                        replace(/<a.*?href="(.*?)".*?>([\s\S]*?)<\/a>/ig, function(html, match1, match2) {
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
                        replace(/<div.*?class=".*?spoilerContainer.*?hideContainer.*?".*?><input.*?value="(?:Show\s*|Hide\s*)(.*?)".*?><div.*?class=".*?spoiler.*?".*?>([\s\S]*?)<\/div><\/div>/ig, function(html, button, content) {
                            if (button !== '')
                                return '[hide=' + button + ']' + content + '[/hide]';
                            else
                                return '[hide]' + content + '[/hide]';
                        }).
                        replace(/<div.*?class=".*?spoilerContainer.*?".*?><input.*?><div.*?class=".*?spoiler.*?".*?>([\s\S]*?)<\/div><\/div>/ig, '[spoiler]$1[/spoiler]').
                        replace(/<img.*?src="(.*?)".*?>/ig, '[img]$1[/img]').
                        replace(/<span class="last-edited">[\s\S]*$/ig, '');
                if (ret !== str) return HTMLtoBB(ret);
                else {
                    // Decode HTML
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = ret;
                    return tempDiv.textContent.trim();
                }
            }

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
                    creation = ' on ' + formattedUTCString(creation.title.replace(/-/g,'/'));
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
            if((e.ctrlKey || e.metaKey) && e.keyCode === 'V'.charCodeAt(0))
                QUOTEALL();
        });
    }


    // Forums title inverter by Potatoe
    // Inverts the forums titles.
    if (GM_getValue('delicioustitleflip') === 'true' && document.title.indexOf(' > ') > -1) document.title = document.title.split(" :: ")[0].split(" > ").reverse().join(" < ") + " :: AnimeBytes";


    // Hide treats by Alpha
    // Hide treats on profile.
    if (GM_getValue('delicioustreats') === 'true') {
        var treatsnode = document.evaluate('//*[@id="user_leftcol"]/div[@class="box" and div[@class="head" and .="Treats"]]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (treatsnode) treatsnode.style.display = "none";
    }


    // Keyboard shortcuts by Alpha, mod by Megure
    // Enables keyboard shortcuts for forum (new post and edit) and PM
    if (GM_getValue('deliciouskeyboard') === 'true' && document.querySelector('textarea') !== null) {
        function custom_insert_text(open, close) {
            var elem = document.activeElement;
            if (elem.selectionStart || elem.selectionStart == '0') {
                var startPos = elem.selectionStart;
                var endPos = elem.selectionEnd;
                elem.value = elem.value.substring(0, startPos) + open + elem.value.substring(startPos, endPos) + close + elem.value.substring(endPos, elem.value.length);
                elem.selectionStart = elem.selectionEnd = endPos + open.length + close.length;
                elem.focus();
                if (close.length == 0)
                    elem.setSelectionRange(startPos + open.length, startPos + open.length);
                else
                    elem.setSelectionRange(startPos + open.length, endPos + open.length);
            } else if (document.selection && document.selection.createRange) {
                elem.focus();
                sel = document.selection.createRange();
                sel.text = open + sel.text + close;
                if (close.length != 0) {
                    sel.move("character", -close.length);
                    sel.select();
                }
                elem.focus();
            } else {
                elem.value += open;
                elem.focus();
                elem.value += close;
            }
        }

        var ctrlorcmd = (navigator.appVersion.indexOf('Mac') != -1) ? '⌘' : 'Ctrl';
        var insertedQueries = [];

        function insert(e, key, ctrl, alt, shift, open, close, query) {
            /* Function to handle detecting key combinations and inserting the
            shortcut text onto the relevent buttons. */
            if (false) {
                //console.log(String.fromCharCode((96 <= key && key <= 105)? key-48 : key));
                console.log(String.fromCharCode(e.charCode));
                console.log(e.ctrlKey);
                console.log(e.metaKey);
                console.log(e.altKey);
                console.log(e.shiftKey);
            }
            // Checks if correct modifiers are pressed
            if (document.activeElement.tagName.toLowerCase() === 'textarea' &&
                (ctrl === (e.ctrlKey || e.metaKey)) &&
                (alt === e.altKey) &&
                (shift === e.shiftKey) &&
                (e.keyCode === key.charCodeAt(0))) {

                e.preventDefault();
                custom_insert_text(open, close);
                return false;
            }

            if (query !== undefined) {
                if (insertedQueries.indexOf(query) === -1) {
                    insertedQueries.push(query);
                    var imgs = document.querySelectorAll(query);
                    for (var i = 0; i < imgs.length; i++) {
                        var img = imgs[i];
                        img.title += ' (';
                        if (ctrl) img.title += ctrlorcmd + '+';
                        if (alt) img.title += 'Alt+';
                        if (shift) img.title += 'Shift+';
                        img.title += key + ')';
                    }
                }
            }
        }

        function keydownHandler(e) {
            // Used as a keydown event handler.
            // Defines all keyboard shortcuts.
            /**
                * All keyboard shortcuts based on MS Word
                **/
            // Bold
            insert(e, 'B', true, false, false, '[b]', '[/b]', '#bbcode img[title="Bold"]');
            // Italics
            insert(e, 'I', true, false, false, '[i]', '[/i]', '#bbcode img[title="Italics"]');
            // Underline
            insert(e, 'U', true, false, false, '[u]', '[/u]', '#bbcode img[title="Underline"]');
            // Align right
            insert(e, 'R', true, false, false, '[align=right]', '[/align]');
            // Align left
            insert(e, 'L', true, false, false, '[align=left]', '[/align]');
            // Align center
            insert(e, 'E', true, false, false, '[align=center]', '[/align]');
            // Spoiler
            insert(e, 'S', true, false, false, '[spoiler]', '[/spoiler]', '#bbcode img[title="Spoilers"]');
            // Hide
            insert(e, 'H', true, false, false, '[hide]', '[/hide]', '#bbcode img[title="Hide"]');
            // YouTube
            insert(e, 'Y', true, true, false, '[youtube]', '[/youtube]', '#bbcode img[alt="YouTube"]');
            // Image
            insert(e, 'G', true, false, false, '[img]', '[/img]', '#bbcode img[title="Image"]');
        }

        var textAreas = document.querySelectorAll('textarea');
        // inserts shortcuts into title text on load, rather than
        // doing it when first key is pressed.
        keydownHandler({});
        for (var i = 0; i < textAreas.length; i++) {
            textAreas[i].addEventListener('keydown', keydownHandler, false);
        }

        function mutationHandler(mutations, observer) {
            _debug && console.log(mutations);
            if (mutations[0].addedNodes.length) {
                var textAreas = document.querySelectorAll('textarea');
                for (var i = 0; i < textAreas.length; i++) {
                    textAreas[i].addEventListener('keydown', keydownHandler, false);
                }
            }
        }

        // Watch for new textareas (e.g. forum edit post)
        var mutationObserver = new MutationObserver(mutationHandler);
        mutationObserver.observe(document.querySelector('body'), {childList: true, subtree:true});
    }


    // Title Notifications by Megure
    // Will prepend the number of notifications to the title
    if(GM_getValue('delicioustitlenotifications') === 'true') {
        var new_count = 0, _i, cnt, notifications = document.querySelectorAll('#alerts .new_count'), _len = notifications.length;
        for(_i = 0; _i < _len; _i++) {
            cnt = parseInt(notifications[_i].textContent, 10);
            if (!isNaN(cnt))
                new_count += cnt;
        }
        if (new_count > 0)
            document.title = '(' + new_count + ') ' + document.title;
    }


    // Freeleech Pool Status by Megure, inspired by Lemma, Alpha, NSC
    // Shows current freeleech pool status in navbar with a pie-chart
    // Updates only once every hour or when pool site is visited, showing a pie-chart on pool site
    if (GM_getValue('deliciousfreeleechpool', 'true') === 'true') {

        function niceNumber(num) {
            var res = '';
            while (num >= 1000) {
                res = ',' + ('00' + (num % 1000)).slice(-3) + res;
                num = Math.floor(num / 1000);
            }
            return num + res;
        }
        var locked = false;
        function getFLInfo() {
            function parseFLInfo(elem) {
                var boxes = elem.querySelectorAll('#content .box.pad');
                //console.log(boxes);
                if (boxes.length < 3) return;

                // The first box holds the current amount, the max amount and the user's individual all-time contribution
                var match = boxes[0].textContent.match(/have ¥([0-9,]+) \/ ¥([0-9,]+)/i),
                        max = parseInt(GM_getValue('FLPoolMax', '50000000'), 10),
                        current = parseInt(GM_getValue('FLPoolCurrent', '0'), 10);
                if (match == null) {
                    // Updated 2018-02-23 according to oregano's suggestion
                    match = boxes[0].textContent.match(/You must wait for freeleech to be over before donating/i);
                    if (match != null) current = max;
                }
                else {
                    current = parseInt(match[1].replace(/,/g, ''), 10);
                    max = parseInt(match[2].replace(/,/g, ''), 10);
                }
                if (match != null) {
                    GM_setValue('FLPoolCurrent', current);
                    GM_setValue('FLPoolMax', max);
                }
                // Check first box for user's individual all-time contribution
                match = boxes[0].textContent.match(/you've donated ¥([0-9,]+)/i);
                if (match != null)
                    GM_setValue('FLPoolContribution', parseInt(match[1].replace(/,/g, ''), 10));

                // The third box holds the top 10 donators for the current box
                var box = boxes[2],
                        firstP = box.querySelector('p'),
                        tr = box.querySelector('table').querySelectorAll('tbody > tr');

                var titles = [], hrefs = [], amounts = [], colors = [], sum = 0;
                for (var i = 0; i < tr.length; i++) {
                    var el = tr[i],
                            td = el.querySelectorAll('td');

                    titles[i] = td[0].textContent;
                    hrefs[i] = td[0].querySelector('a').href;
                    amounts[i] = parseInt(td[1].textContent.replace(/[,¥]/g, ''), 10);
                    colors[i] = 'red';
                    sum += amounts[i];
                }

                // Updated 2018-02-23. Properly draw full pie when FL active.
                if (current === max && sum === 0) {
                    titles[0] = "Freeleech!";
                    hrefs[0] = 'https://animebytes.tv/konbini/pool';
                    amounts[0] = current ;
                    colors[0] = 'red';
                    sum = current;
                }
                else {
                    // Also add others and missing to the arrays
                    // 2018-02-23 But only if FL isn't active.
                    next_index = titles.length;
                    titles[next_index] = 'Other';
                    hrefs[next_index] = 'https://animebytes.tv/konbini/pool';
                    amounts[next_index] = current - sum;
                    colors[next_index] = 'lightgrey';

                    titles[next_index + 1] = 'Missing';
                    hrefs[next_index + 1] = 'https://animebytes.tv/konbini/pool';
                    amounts[next_index + 1] = max - current;
                    colors[next_index + 1] = 'black';
                }

                GM_setValue('FLPoolLastUpdate', Date.now());
                GM_setValue('FLPoolTitles', JSON.stringify(titles));
                GM_setValue('FLPoolHrefs', JSON.stringify(hrefs));
                GM_setValue('FLPoolAmounts', JSON.stringify(amounts));
                GM_setValue('FLPoolColors', JSON.stringify(colors));
            }

            // Either parse document or retrieve freeleech pool site 60*60*1000 ms after last retrieval
            if (/konbini\/pool$/i.test(document.URL))
                parseFLInfo(document);
            else if (Date.now() - parseInt(GM_getValue('FLPoolLastUpdate', '0'), 10) > 3600000 && locked === false) {
                locked = true;
                var xhr = new XMLHttpRequest(), parser = new DOMParser();
                xhr.open('GET', "https://animebytes.tv/konbini/pool", true);
                xhr.send();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        parseFLInfo(parser.parseFromString(xhr.responseText, 'text/html'));
                        updatePieChart();
                        locked = false;
                    }
                };
            }
        }

        function getPieChart() {
            function circlePart(diff, title, href, color) {
                if (diff == 0) return '';
                var x = Math.sin(phi), y = Math.cos(phi);
                phi -= 2 * Math.PI * diff / max;
                var v = Math.sin(phi), w = Math.cos(phi);
                var z = 0;
                if (2 * diff > max)
                    z = 1; // use long arc
                var perc = (100 * diff / max).toFixed(1) + '%\n' + niceNumber(diff) + ' ¥';

                // 2018-02-23 Hardcoded since rounding errors were making the pie a thin strip when it was a single
                // slice at 100%.
                if (diff === max) {
                    /*v = -6.283185273215512e-8;
                    w = -0.999999999999998;
                    z = 1;
                    x = 1.2246467991473532e-16;
                    y = -1;*/
                    v = -0.000001;
                    w = -1;
                    z = 1;
                    x = 0;
                    y = -1;

                }
                return '<a xlink:href="' + href + '" xlink:title="' + title + '\n' + perc + '"><path title="' + title + '\n' + perc +
                    '" stroke-width="0.01" stroke="grey" fill="' + color + '" d="M0,0 L' + v + ',' + w + ' A1,1 0 ' + z + ',0 ' + x + ',' + y + 'z">\n' +

                    '<animate begin="mouseover" attributeName="d" to="M0,0 L' + 1.1 * v + ',' + 1.1 * w + ' A1.1,1.1 0 ' + z + ',0 ' + 1.1 * x + ',' + 1.1 * y + 'z" dur="0.3s" fill="freeze" />\n' +
                    '<animate begin="mouseout"  attributeName="d" to="M0,0 L' + v + ',' + w + ' A1,1 0 ' + z + ',0 ' + x + ',' + y + 'z" dur="0.3s" fill="freeze" />\n' +
                    '</path></a>\n\n';
            }

            var str = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-1.11 -1.11 2.22 2.22" height="200px" width="100%">' +
                    '<title>Most Donated To This Box Pie-Chart</title>';
            try {
                var phi = Math.PI, max = parseInt(GM_getValue('FLPoolMax', '50000000'), 10),
                        titles = JSON.parse(GM_getValue('FLPoolTitles', '[]')),
                        hrefs = JSON.parse(GM_getValue('FLPoolHrefs', '[]')),
                        amounts = JSON.parse(GM_getValue('FLPoolAmounts', '[]')),
                        colors = JSON.parse(GM_getValue('FLPoolColors', '[]'));
                for (var i = 0; i < titles.length; i++) {
                    str += circlePart(amounts[i], titles[i], hrefs[i], colors[i]);
                }
            } catch (e) {}
            return str + '</svg>';
        }

        function updatePieChart() {
            var pieChart = getPieChart();
            p.innerHTML = pieChart;
            p3.innerHTML = pieChart;
            if (GM_getValue('delicousnavbarpiechart', 'false') === 'true') {
                li.innerHTML = pieChart;
            }
            p2.innerHTML = 'There currently are ' + niceNumber(parseInt(GM_getValue('FLPoolCurrent', '0'), 10)) + ' / ' + niceNumber(parseInt(GM_getValue('FLPoolMax', '50000000'), 10)) + ' yen in the donation box.<br/>';
            p2.innerHTML += '(That means it is ' + niceNumber(parseInt(GM_getValue('FLPoolMax', '50000000'), 10) - parseInt(GM_getValue('FLPoolCurrent', '0'), 10)) + ' yen away from getting sitewide freeleech!)<br/>';
            p2.innerHTML += 'In total, you\'ve donated ' + niceNumber(parseInt(GM_getValue('FLPoolContribution', '0'), 10)) + ' yen to the freeleech pool.<br/>';
            p2.innerHTML += 'Last Update: ' + Math.round((Date.now() - parseInt(GM_getValue('FLPoolLastUpdate', Date.now()), 10)) / 60000) + ' minutes ago.';
            a.textContent = 'FL: ' + (100 * parseInt(GM_getValue('FLPoolCurrent', '0'), 10) / parseInt(GM_getValue('FLPoolMax', '50000000'), 10)).toFixed(1) + '%';
            nav.replaceChild(a, nav.firstChild);
        }

        var pos = GM_getValue('deliciousflpoolposition', 'after #userinfo_minor');

        if (pos !== 'none' || /user\.php\?id=/i.test(document.URL) || /konbini\/pool/i.test(document.URL)) {
            var p = document.createElement('p'),
                    p2 = document.createElement('center'),
                    p3 = document.createElement('p'),
                    nav = document.createElement('li'),
                    a = document.createElement('a'),
                    ul = document.createElement('ul'),
                    li = document.createElement('li');
            a.href = '/konbini/pool';
            nav.appendChild(a);
            if (GM_getValue('delicousnavbarpiechart', 'false') === 'true') {


                function dropPie(navMenu, downArrow) {
                    // UNUSED

                    // navMenu is the li.navmenu containing the button and dropdown
                    // downArrow is the outer span of the down arrow

                    // for some reason, creating the span .dropit element no longer binds the default dropdown
                    // click handler, so i've hacked together a simple replacement here.

                    var subPie = downArrow.nextSibling; // this seems to be how the default script works
                    //console.log(subPie.style.display);
                    if (subPie.style.display !== "block")
                    {
                        navMenu.className += " selected";
                        subPie.style.display = "block";
                    }
                    else
                    {
                        navMenu.className = navMenu.className.replace("selected", "");
                        subPie.style.display = "none";

                    }
                    return false;
                }

                function dropPie2(event) {
                    // because who doesn't love dropping their pies
                    var e;
                    if (typeof $ === 'undefined') {
                        e = $j;
                    } else {
                        e = $;
                    }

                    // below copied from https://animebytes.tv/static/functions/global-2acd7ec19a.js
                    e(event.target).parent().find("ul.subnav").is(":hidden") ?
                        (e("ul.subnav").hide(),
                         e("li.navmenu").removeClass("selected"),
                         e(this).parent().addClass("selected").find("ul.subnav").show())
                    : e(event.target).parent().removeClass("selected").find("ul.subnav").hide();
                    // end copy

                    // prevents global click handler from immediately closing the menu
                    event.stopPropagation();
                    return false;
                }

                var outerSpan = document.createElement('span');
                outerSpan.className += "dropit hover clickmenu";
                var e;
                if (typeof $ === 'undefined') {
                    e = $j;
                } else {
                    e = $;
                }
                e(outerSpan).click(dropPie2);
                outerSpan.innerHTML += '<span class="stext">▼</span>';

                // nav is the li.navmenu
                nav.appendChild(outerSpan);

                // this ul contains the pie (somehow)
                ul.appendChild(li);
                ul.className = 'subnav nobullet';
                ul.style.display = 'none';
                nav.appendChild(ul);
                nav.className = 'navmenu';
                nav.id = "fl_menu";
            }
            if (pos !== 'none') {
                pos = pos.split(' ');
                var parent = document.querySelector(pos[1]);
                if (parent !== null) {
                    getFLInfo();
                    if (pos[0] === 'after')
                        parent.appendChild(nav);
                    if (pos[0] === 'before')
                        parent.insertBefore(nav, parent.firstChild);
                }
            }

            updatePieChart();

            if (/user\.php\?id=/i.test(document.URL) && GM_getValue('deliciousyenperx', 'true') === 'true') {
                // Only do so on the users' profile pages if Yen per X is activated and Yen per day is present in userstats
                var userstats = document.querySelector('#user_rightcol > .box');
                if (userstats != null) {
                    var tw = document.createTreeWalker(userstats, NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /Yen per day/i.test(node.data); } });
                    if (tw.nextNode() != null) {
                        getFLInfo();
                        var cNode = document.querySelector('.userstatsleft');
                        var hr = document.createElement('hr');
                        hr.style.clear = 'both';
                        cNode.insertBefore(hr, cNode.lastElementChild);
                        cNode.insertBefore(p2, cNode.lastElementChild);
                        cNode.insertBefore(p3, cNode.lastElementChild);
                    }
                }
            }

            if (/konbini\/pool/i.test(document.URL)) {
                var tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /^\s*Most Donated to This Box\s*$/i.test(node.data); } });
                if (tw.nextNode() !== null) {
                    tw.currentNode.parentNode.insertBefore(p, tw.currentNode.nextSibling);
                }
            }
        }
    }


    // Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
    if(/user\.php\?id=/i.test(document.URL)) {
        function compoundInterest(years) {
            return (Math.pow(2, years) - 1) / Math.log(2);
        }
        function formatInteger(num) {
            var res = '';
            while (num >= 1000) {
                res = ',' + ('00' + (num % 1000)).slice(-3) + res;
                num = Math.floor(num / 1000);
            }
            return num + res;
        }
        function bytecount(num, unit) {
            // For whatever reason, this was always called with .toUpperCase()
            // by the original author, but newer KiB style prefixes have
            // a lowercase. Keeping both for compatibility.
            switch (unit) {
                case 'B':
                    return num * Math.pow(1024, 0);
                case 'KiB':
                case 'KIB':
                    return num * Math.pow(1024, 1);
                case 'MiB':
                case 'MIB':
                    return num * Math.pow(1024, 2);
                case 'GiB':
                case 'GIB':
                    return num * Math.pow(1024, 3);
                case 'TiB':
                case 'TIB':
                    return num * Math.pow(1024, 4);
                case 'PiB':
                case 'PIB':
                    return num * Math.pow(1024, 5);
                case 'EiB':
                case 'EIB':
                    return num * Math.pow(1024, 6);
            }
        }
        function humancount(num) {
            if (num == 0) return '0 B';
            var i = Math.floor(Math.log(Math.abs(num)) / Math.log(1024));
            num = (num / Math.pow(1024, i)).toFixed(2);
            switch (i) {
                case 0:
                    return num + ' B';
                case 1:
                    return num + ' KiB';
                case 2:
                    return num + ' MiB';
                case 3:
                    return num + ' GiB';
                case 4:
                    return num + ' TiB';
                case 5:
                    return num + ' PiB';
                case 6:
                    return num + ' EiB';
                default:
                    return num + ' × 1024^' + i + ' B';
            }
        }
        function addDefinitionAfter(after, definition, value, cclass) {
            dt = document.createElement('dt');
            dt.appendChild(document.createTextNode(definition));
            dd = document.createElement('dd');
            if (cclass !== undefined) dd.className += cclass;
            dd.appendChild(document.createTextNode(value));
            after.parentNode.insertBefore(dd, after.nextElementSibling.nextSibling);
            after.parentNode.insertBefore(dt, after.nextElementSibling.nextSibling);
            return dt;
        }
        function addDefinitionBefore(before, definition, value, cclass) {
            dt = document.createElement('dt');
            dt.appendChild(document.createTextNode(definition));
            dd = document.createElement('dd');
            if (cclass !== undefined) dd.className += cclass;
            dd.appendChild(document.createTextNode(value));
            before.parentNode.insertBefore(dt, before);
            before.parentNode.insertBefore(dd, before);
            return dt;
        }
        function addRawStats() {
            var tw, regExp = /([0-9,.]+)\s*([A-Z]+)\s*\(([^)]*)\)/i;
            // Find text with raw stats
            tw = document.createTreeWalker(document, NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /^Raw Uploaded:/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var rawUpMatch = tw.currentNode.data.match(regExp);
            tw = document.createTreeWalker(tw.currentNode.parentNode.parentNode, NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /^Raw Downloaded:/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var rawDownMatch = tw.currentNode.data.match(regExp);
            tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /^\s*Ratio/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var ratioNode = tw.currentNode.parentNode;
            tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /^\s*Uploaded/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var ulNode = tw.currentNode.parentNode;
            tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /^\s*Downloaded/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var dlNode = tw.currentNode.parentNode;

            var ul = ulNode.nextElementSibling.textContent.match(regExp);
            var dl = dlNode.nextElementSibling.textContent.match(regExp);
            _debug && console.log(ul);
            _debug && console.log(dl);
            var uploaded = bytecount(parseFloat(ul[1].replace(/,/g, '')), ul[2].toUpperCase());
            var downloaded = bytecount(parseFloat(dl[1].replace(/,/g, '')), dl[2].toUpperCase());
            var rawuploaded = bytecount(parseFloat(rawUpMatch[1].replace(/,/g, '')), rawUpMatch[2].toUpperCase());
            var rawdownloaded = bytecount(parseFloat(rawDownMatch[1].replace(/,/g, '')), rawDownMatch[2].toUpperCase());
            var rawRatio = Infinity;
            if (bytecount(parseFloat(rawDownMatch[1].replace(/,/g, '')), rawDownMatch[2].toUpperCase()) > 0)
                rawRatio = (bytecount(parseFloat(rawUpMatch[1].replace(/,/g, '')), rawUpMatch[2].toUpperCase()) / bytecount(parseFloat(rawDownMatch[1].replace(/,/g, '')), rawDownMatch[2].toUpperCase())).toFixed(2);

            // Color ratio
            var color = 'r99';
            if (rawRatio < 1)
                color = 'r' + ('0' + Math.ceil(10 * rawRatio)).slice(-2);
            else if (rawRatio < 5)
                color = 'r20';
            else if (rawRatio < 99)
                color = 'r50';

            // Add to user stats after ratio
            var hr = document.createElement('hr');
            hr.style.clear = 'both';
            ratioNode.parentNode.insertBefore(hr, ratioNode.nextElementSibling.nextSibling);
            var rawRatioNode = addDefinitionAfter(ratioNode, 'Raw Ratio:', rawRatio, color);
            addDefinitionAfter(ratioNode, 'Raw Downloaded:', rawDownMatch[0]);
            addDefinitionAfter(ratioNode, 'Raw Uploaded:', rawUpMatch[0]);
            ratioNode.nextElementSibling.title = 'Ratio\t  Buffer';
            rawRatioNode.nextElementSibling.title = 'Raw ratio\t Raw Buffer';

            function printBuffer(u, d, r) {
                if (u / r - d >= 0)
                    return '\n' + r.toFixed(1) + '\t' + (humancount(u / r - d)).slice(-10) + '    \tcan be downloaded'
                else
                    return '\n' + r.toFixed(1) + '\t' + (humancount(d * r - u)).slice(-10) + '    \tmust be uploaded'
            }
            for (var i = 0; i < 10; i++) {
                var myRatio = [0.2, 0.5, 0.7, 0.8, 0.9, 1.0, 1.5, 2.0, 5.0, 10.0][i];
                ratioNode.nextElementSibling.title += printBuffer(uploaded, downloaded, myRatio);
                rawRatioNode.nextElementSibling.title += printBuffer(rawuploaded, rawdownloaded, myRatio);
            }
        }
        function addYenPerStats() {
            var dpy = 365.256363; // days per year
            var tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return /Yen per day/i.test(node.data); } });
            if (tw.nextNode() == null) return;
            var ypdNode = tw.currentNode.parentNode;
            var ypy = parseInt(ypdNode.nextElementSibling.textContent, 10) * dpy; // Yen per year
            addDefinitionAfter(ypdNode, 'Yen per year:', formatInteger(Math.round(ypy * compoundInterest(1))));
            addDefinitionAfter(ypdNode, 'Yen per month:', formatInteger(Math.round(ypy * compoundInterest(1 / 12))));
            addDefinitionAfter(ypdNode, 'Yen per week:', formatInteger(Math.round(ypy * compoundInterest(7 / dpy))));
            // 1 Yen = 1 MB = 1024^2 B * yen per year * interest for 1 s
            var hr = document.createElement('hr');
            hr.style.clear = 'both';
            ypdNode.parentNode.insertBefore(hr, ypdNode);
            addDefinitionBefore(ypdNode, 'Yen as upload:', humancount(Math.pow(1024, 2) * ypy * compoundInterest(1 / dpy / 24 / 60 / 60)) + '/s');
            addDefinitionBefore(ypdNode, 'Yen per hour:', (ypy * compoundInterest(1 / dpy / 24)).toFixed(1));
        }
        if (GM_getValue('deliciousratio', 'true') === 'true')
            addRawStats();
        if (GM_getValue('deliciousyenperx', 'true') === 'true')
            addYenPerStats();
    }


    // Dynamic stylesheets by Megure, requires jQuery because I'm lazy
    (function DynamicStylesheets() {
        function updateSettings() {
            var rules = document.querySelectorAll('li.deliciousdynamicstylesheetsrule');
            var result = [];
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                var hour = rule.children[0].value;
                var stylesheet = rule.children[1].value;
                if (hour !== '' && stylesheet !== '')
                    result.push([parseInt(hour, 10), stylesheet]);
            }
            result.sort(function(a, b) { return a[0] - b[0]; });

            GM_setValue('deliciousdynamicstylesheetsrules', JSON.stringify(result));
        }

        function addRule(hour, stylesheet) {
            var newLi = document.createElement('li');
            newLi.className = 'deliciousdynamicstylesheetsrule';

            var hour_input = document.createElement('input');
            hour_input.type = 'number';
            hour_input.min = '0';
            hour_input.max = '23';
            hour_input.step = '1';
            hour_input.placeholder = '0-23';
            hour_input.style.width = '10%';
            hour_input.addEventListener('keyup', updateSettings);
            if (typeof hour === 'number')
                hour_input.value = hour;

            var stylesheet_input = document.createElement('input');
            stylesheet_input.type = 'text';
            stylesheet_input.placeholder = 'Either a name of an existing stylesheet like Milkyway (case-sensitive), or an external URL like https://aldy.nope.bz/toblerone.css';
            stylesheet_input.style.width = '75%';
            stylesheet_input.addEventListener('keyup', updateSettings);
            if (typeof stylesheet === 'string')
                stylesheet_input.value = stylesheet;

            var delete_button = document.createElement('button');
            delete_button.textContent = 'Delete rule';
            delete_button.addEventListener('click', function(e) {
                e.preventDefault();
                newLi.parentNode.removeChild(newLi);
                updateSettings();
            });

            newLi.appendChild(hour_input);
            newLi.appendChild(stylesheet_input);
            newLi.appendChild(delete_button);

            var rules = document.querySelectorAll('li.deliciousdynamicstylesheetsrule');
            if (rules.length > 0) {
                var lastRule = rules[rules.length - 1];
                lastRule.parentNode.insertBefore(newLi, lastRule.nextSibling);
            }
            else {
                var settings = document.getElementById('deliciousdynamicstylesheets');
                settings.parentNode.parentNode.parentNode.insertBefore(newLi, settings.parentNode.parentNode.nextSibling);
            }
        }

        function setStylesheet(stylesheet) {
            var settings_xhr = new XMLHttpRequest(), settings_dom_parser = new DOMParser();
            settings_xhr.open('GET', "https://animebytes.tv/user.php?action=edit", true);
            settings_xhr.send();
            settings_xhr.onreadystatechange = function() {
                if (settings_xhr.readyState === 4) {
                    var settings_document = settings_dom_parser.parseFromString(settings_xhr.responseText, 'text/html');
                    var form = settings_document.getElementById('userform');

                    if (form !== null) {
                        var styleurl = form.querySelector('input#styleurl');
                        var stylesheet_select = form.querySelector('select#stylesheet');
                        if (styleurl === null || stylesheet_select === null) {
                            console.log("Could not find style url or stylesheet input on settings page.");
                            return;
                        }
                        var stylesheet_options = settings_document.evaluate('//option[text()="' + stylesheet + '"]', settings_document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (stylesheet_options.snapshotItem(0) !== null) {
                            if (stylesheet_select.value === stylesheet_options.snapshotItem(0).value && styleurl.value === '') {
                                // Stylesheet settings are already properly set, nothing to do
                                return;
                            }
                            else {
                                stylesheet_select.setAttribute('onchange', '');
                                stylesheet_select.value = stylesheet_options.snapshotItem(0).value;
                                styleurl.value = '';
                            }
                        }
                        else {
                            if (styleurl === stylesheet) {
                                // Stylesheet settings are already properly set, nothing to do
                                return;
                            }
                            else {
                                styleurl.value = stylesheet;
                            }
                        }

                        $.ajax({
                            url: "https://animebytes.tv/user.php?action=edit",
                            type: "post",
                            data: $(form).serialize()
                        });
                    }
                }
            }
        }

        // Add to user script settings
        if (/\/user\.php\?.*action=edit/i.test(document.URL)) {
            var settings = document.getElementById('deliciousdynamicstylesheets');
            var add_button = document.createElement('button');
            add_button.textContent = 'Add rule';
            add_button.addEventListener('click', function(e) {
                e.preventDefault();
                addRule();
            });
            settings.parentNode.appendChild(add_button);

            // Add existing rules
            var rules = JSON.parse(GM_getValue('deliciousdynamicstylesheetsrules', '[]'));
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                addRule(rule[0], rule[1]);
            }
        }

        // Do we have to set the stylesheet?
        if (GM_getValue('deliciousdynamicstylesheets', 'false') === 'true') {
            var current_hour = (new Date()).getHours();
            var rules = JSON.parse(GM_getValue('deliciousdynamicstylesheetsrules', '[]'));
            if (rules.length > 0) {
                var result = rules[rules.length - 1][1];
                for (var i = 0; i < rules.length; i++) {
                    var rule = rules[i];
                    if (rule[0] <= current_hour)
                        result = rule[1];
                }
                if (GM_getValue('currentdeliciousdynamicstylesheet', '') !== result) {
                    setStylesheet(result);
                    GM_setValue('currentdeliciousdynamicstylesheet', result);
                }
            }
        }
    }).call(this);


    // Enhanced Torrent View by Megure
    // Shows how much yen you would receive if you seeded torrents; shows required seeding time; allows sorting and filtering of torrent tables; dynamic loading of transfer history tables
    (function EnhancedTorrentView() {
        var days_per_year = 365.256363;
        var show_yen = GM_getValue('ABTorrentsShowYen', 'true') === 'true';
        var show_required_time = GM_getValue('ABTorrentsReqTime', 'true') === 'true';
        var sort_rows = GM_getValue('ABSortTorrents', 'true') === 'true';
        var filter_torrents = GM_getValue('ABTorrentsFilter', 'true') === 'true';
        var dynamic_load = GM_getValue('ABHistDynLoad', 'true') === 'true';
        var time_frame = parseInt(GM_getValue('ABTorrentsYenTimeFrame', '24'), 10);
        var time_frame_string = time_frame + ' hours';
        if (time_frame === 1) {
            time_frame_string = 'hour';
        }
        else if (time_frame === 24) {
            time_frame_string = 'day';
        }
        else if (time_frame === 168) {
            time_frame_string = 'week';
        }
        // How many digits to show for Yen over time_frame, see yen_to_string
        var log10 = Math.round(Math.log(time_frame) / Math.LN10);
        var size_RegExp = /^([\d\.]+)\s(?:([a-zA-Z])i)?B(?:\s\(([\d\.]+)%\))?$/;
        var ratio_RegExp = /^(∞|\-\-|[\d\.]+)$/;
        var and_RegExp = /(and|\s)/ig;
        var duration_RegExp = /^(?:(\d+)years?)?(?:(\d+)months?)?(?:(\d+)weeks?)?(?:(\d+)days?)?(?:(\d+)hours?)?(?:(\d+)minutes?)?(?:(\d+)seconds?)?(?:\s*\([^)]*\)\s*)*$/;
        var datetime_RegExp = /^(\d+)\-(\d{1,2})\-(\d{1,2})\s+(\d{1,2}):(\d{1,2})$/;
        var currency_RegExp = /^(?:[¥|€|£|\$]\s*)([\d\.]+)$/;
        function unit_prefix(prefix) {
            // This is called with only the prefix of the byte unit
            switch (prefix.toUpperCase()) {
                case '':
                    return 1 / 1073741824;
                case 'K':
                    return 1 / 1048576;
                case 'M':
                    return 1 / 1024;
                case 'G':
                    return 1;
                case 'T':
                    return 1024;
                case 'P':
                    return 1048576;
                case 'E':
                    return 1073741824;
                default:
                    return 0;
            }
        }
        function get_column(row, cell) {
            var cells = row.cells;
            var column = 0;
            for (var i = 0, length = cells.length; i < length; i++) {
                var row_cell = cells[i];
                if (row_cell === cell) {
                    break;
                }
                column += row_cell.colSpan;
            }
            return column;
        }
        function get_cell(row, index) {
            var cells = row.cells;
            var column = 0;
            for (var i = 0, length = cells.length; i < length; i++) {
                var row_cell = cells[i];
                if (column === index) {
                    return row_cell;
                }
                column += row_cell.colSpan;
            }
            return null;
        }
        function get_next_separator_element_sibling(row) {
            while ((row != null) && row.id.indexOf('group_') !== 0 && row.className.indexOf('edition_info') === -1) {
                row = row.nextElementSibling;
            }
            return row;
        }
        function get_corresponding_torrent_row(row) {
            var anchor = row.querySelector('a[title="Download"]');
            if (anchor !== null) {
                //console.log(anchor.href);
                var match = anchor.href.match(/torrent\/(\d+)\/download/i);
                if (match !== null) {
                    var new_row = document.getElementById('torrent_' + match[1]);
                    if (new_row !== row) {
                        return new_row;
                    }
                }
            }
            return null;
        }
        // Converts a duration of hours into a string, like 3 days, 4 hours and 17 minutes
        function duration_to_string(duration) {
            var days = Math.floor(duration / 24);
            var hours = Math.floor(duration % 24);
            var minutes = Math.ceil((duration * 60) % 60);
            var res = days + ' days';
            if (hours > 0) {
                res += minutes === 0 ? ' and ' : ', ';
                res += hours + ' hours';
            }
            if (minutes > 0) {
                res += ' and ' + minutes + ' minutes';
            }
            return res;
        }
        // Show 2 - log10 digits
        function yen_to_string(yen) {
            return yen.toFixed(Math.max(2 - log10, 0));
        }
        // The compound interest factor for yen generation over time_frame hours
        // time_frame is in hours and is the number of hours to find yen for.
        // Oversimplified. I think this tries to account for the increase of yen/h over time as seeding duration increases
        // when displaying yen/week.
        //var f_interest = 24 * days_per_year / time_frame * (Math.pow(2, time_frame / (24 * days_per_year)) - 1) / Math.log(2);
        var f_interest = 1;


        // The duration factor for yen generation
        // seeding duration is only available on the "Seeding Torrents" page. Assumes 0 on any other.
        // duration is in hours.
        function f_duration(duration) {
            // user_age in hours
            var user_age = ((new Date()).getTime() - parseInt(GM_getValue('creation', '0'), 10))/1000/60/60;
            _debug && console.log('age: ' + user_age);
            _debug && console.log('duration: ' + duration);
            // number of years + 2
            // 2018-04-11 - caps duration bonus to user age
            return Math.min(duration, user_age) / (24 * days_per_year) + 2;
        }
        // The size factor for yen
        // Size is in GB
        function f_size(size) {
            // max function handles the size < 10MB condition
            return Math.max(0.1, Math.sqrt(size)) / 4;
        }
        // The seeders factor for yen generation
        // Reciprocal of the wiki article's formula to allow calculation of % increase.
        function f_seeders(seeders){
            if (seeders > 3) {
                return 3/ Math.sqrt(seeders + 4);
            } else {
                return 2;
            }
        }
        // The age factor for yen generation
        // 'creation' is milliseconds. 1728000000 is 20 days in ms.
        // Calculates how old the account is, then divides that by 20 days (in ms).
        // Logistics function starting at 2 then declining to approach 1 over time.
        var f_age = 2 - 1 / (1 + Math.exp(5 - ((new Date()).getTime() - parseInt(GM_getValue('creation', '0'), 10)) / 1728000000));
        if (isNaN(f_age)) {
            f_age = 1;
        }

        // Compound function for yen generation
        function f(size, seeders, duration) {
            //console.log("size: " + size + " seed: " + seeders + " dur: " + duration + " f_age: " + f_age + " time_f: " + time_frame + " int: " + f_interest);
            //console.log(GM_getValue('creation', '0'));
            return f_size(size) * f_seeders(seeders) * f_duration(duration) * f_age * time_frame * f_interest ;
        }
        // Creates title when hovering over yen generation to break down factors
        function yen_generation_title(size, seeders, duration) {
            var title = 'Click to toggle between Yen per ' + time_frame_string + '\nand Yen per ' + time_frame_string + ' per GB of size.\n\n';

            // Added f_duration(0) and f_seeders(1) to account for 2017 yen changes.
            // The changes altered the initial values of these and hence altered the 'base' yen/h here.
            title += '¥' + (f_seeders(1) * f_duration(0) * time_frame * f_size(size)).toPrecision(6) + ' \tbase for size';
            var temp = (100 * (f_interest - 1)).toFixed(1);
            if (temp !== '0.0') {
                title += '\n+' + temp + '% \tfor interest per ' + time_frame_string;
            }
            temp = (100 * (f_age - 1)).toFixed(1);
            if (temp !== '0.0') {
                title += '\n+' + temp + '% \tfor your account\'s age';
            }
            // added divide by f_duration(0) to get accurate % change from initial
            temp = (100 * (f_duration(duration)/f_duration(0) - 1)).toFixed(1);
            if (temp !== '0.0') {
                title += '\n+' + temp + '% \tfor your seeding time';
            }
            // added divide by f_seeders(1) to get accurate % change from initial
            temp = (100 * (f_seeders(seeders)/f_seeders(1) - 1)).toFixed(1);
            if (temp !== '0.0') {
                title += '\n' + temp + '% \tfor the number of seeders';
            }
            title += '\n\n¥ per ' + time_frame_string + ' \t¥ per ' + time_frame_string + ' per GB\t#seeders\n';
            var start = Math.max(seeders - 1, 3);
            var end = Math.max(seeders + 1, 3);

            // edited to <= 3, 2017.
            for (var i = start; i <= end; i++) {
                title += '¥' + f(size, i, duration).toPrecision(6) + '  \t';
                title += '¥' + (f(size, i, duration) / size).toPrecision(6) + ' \t\t';
                if (i === 3) {
                    title += '≤';
                }
                title += i;
                if (i !== end) {
                    title += '\n';
                }
            }
            return title;
        }
        // Toggle yen generation per time and per time and size
        var yen_per_GB = false;
        function toggle_yen(toggle) {
            if (toggle === void 0) { toggle = true; }
            return function () {
                if (toggle) {
                    yen_per_GB = yen_per_GB !== true;
                }
                var cells = document.querySelectorAll('th.UserScriptToggleYenPerGB,td.UserScriptToggleYenPerGB');
                for (var i = 0, length = cells.length; i < length; i++) {
                    var cell = cells[i];
                    if (yen_per_GB) {
                        cell.style.display = '';
                    }
                    else {
                        cell.style.display = 'none';
                    }
                }
                cells = document.querySelectorAll('th.UserScriptToggleYen,td.UserScriptToggleYen');
                for (var i = 0, length = cells.length; i < length; i++) {
                    var cell = cells[i];
                    if (yen_per_GB) {
                        cell.style.display = 'none';
                    }
                    else {
                        cell.style.display = '';
                    }
                }
            };
        }
        // Parses a single HTMLElement's textContent using regular expressions
        function parse_cell(cell) {
            var text_content = cell.textContent.trim();
            var text_content_no_comma = text_content.replace(/,/g, '').trim();
            var image = cell.querySelector('img');
            if (cell.textContent === '' && (image !== null)) {
                return image.alt.toUpperCase();
            }
            var match = text_content_no_comma.match(size_RegExp);
            if (match !== null) {
                return parseFloat(match[1]) * unit_prefix(match[2]);
            }
            match = text_content_no_comma.match(datetime_RegExp);
            if (match !== null) {
                return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), parseInt(match[4], 10), parseInt(match[5], 10));
            }
            match = text_content_no_comma.replace(and_RegExp, '').match(duration_RegExp);
            if (match !== null) {
                var durations = [];
                // Starting at 1, because 0 is full string
                for (var i = 1, length = match.length; i < length; i++) {
                    var num = match[i];
                    if (num !== undefined) {
                        durations.push(parseInt(num, 10));
                    }
                    else {
                        durations.push(0);
                    }
                }
                // Calculates number of days inside the brackets, then times by 24.
                // Returns hours.
                //     24 * (years                            months                               wweeks            days      ) + hours           minutes               seconds
                return 24 * (durations[0] * days_per_year + durations[1] * days_per_year / 12 + durations[2] * 7 + durations[3]) + durations[4] + durations[5] / 60 + durations[6] / 3600;
            }
            match = text_content_no_comma.match(currency_RegExp);
            if (match !== null) {
                return parseFloat(match[1]);
            }
            match = text_content_no_comma.match(ratio_RegExp);
            if (match !== null) {
                switch (match[1]) {
                    case '∞':
                        return Infinity;
                    case '--':
                        return -0.2;
                    case '0':
                        return -0.1;
                    default:
                        return parseFloat(match[1]);
                }
            }
            if (/^Never(\s*\([^)]*\)\s*)*$/i.test(text_content_no_comma)) {
                return 0;
            }
            else {
                return text_content.toUpperCase();
            }
        }
        // Processes a row and parses its cells' contents
        function parse_row(row, size_index, seeders_index, duration_index, hr_index) {
            var size_cell = get_cell(row, size_index);
            var seeders_cell = get_cell(row, seeders_index);
            var duration_cell = get_cell(row, duration_index);
            var size = (size_index !== null && size_cell !== null) ? parse_cell(size_cell) : 1;
            var seeders = (seeders_index !== null && seeders_cell !== null) ? parse_cell(seeders_cell) : 6;
            var duration = (duration_index !== null && duration_cell !== null) ? parse_cell(duration_cell) : 0;
            var torrent_row = get_corresponding_torrent_row(row);
            // Add required time to size_cell and blockquote in torrent_row
            if (size_index !== null && show_required_time) {
                var seeding_time = Math.max(0, size - 10) * 5 + 72;
                size_cell.title = 'You need to seed this torrent for at least\n' + duration_to_string(seeding_time) + '\nor it will become a hit and run!';
                if (torrent_row !== null) {
                    var block_quote = torrent_row.querySelector('blockquote');
                    if (block_quote !== null) {
                        block_quote.appendChild(document.createElement('br'));
                        block_quote.innerHTML += 'You need to seed this torrent for at least <span class="r01">' + duration_to_string(seeding_time) + '</span> or it will become a hit and run!';
                    }
                }
            }
            // Add yen generation to row
            if (size_index !== null && seeders_index !== null && show_yen) {
                _debug && console.log('adding yen to row: ' + row.innerHTML);
                var title = yen_generation_title(size, seeders, duration);
                var td1 = document.createElement('td');
                td1.textContent = '¥' + yen_to_string(f(size, seeders, duration));
                td1.title = title;
                td1.className = 'UserScriptToggleYen';
                var td2 = document.createElement('td');
                td2.textContent = '¥' + yen_to_string(f(size, seeders, duration) / size);
                td2.title = title;
                td2.className = 'UserScriptToggleYenPerGB';
                td2.style.display = 'none';
                td1.addEventListener('click', toggle_yen());
                td2.addEventListener('click', toggle_yen());
                row.appendChild(td2);
                row.appendChild(td1);
            }
            // Parse row data
            var row_data = [row, torrent_row];
            if (sort_rows) {
                var cells = row.cells;
                for (var i = 0, length = cells.length; i < length; i++) {
                    var cell = cells[i];
                    row_data.push(parse_cell(cell));
                    if (cell.colSpan > 1) {
                        for (var j = 2; j <= cell.colSpan; j++) {
                            row_data.push(null);
                        }
                    }
                }
            }
            // Replace H&R row content by remaining seed time if available in duration row
            if (hr_index !== null && duration_index !== null) {
                var cell = get_cell(row, duration_index);
                var match = cell.textContent.replace(/^[^(]*(\(|$)/, '').replace(/\s*left\s*\)[^)]*$/, '').replace(and_RegExp, '').match(duration_RegExp);
                var remaining = 0.0.toFixed(4);
                if (match !== null) {
                    var durations = [];
                    // Starting at 1 because 0 is full matched string
                    for (var i = 1, length = match.length; i < length; i++) {
                        var num = match[i];
                        if (num !== undefined) {
                            durations.push(parseInt(num, 10));
                        }
                        else {
                            durations.push(0);
                        }
                    }
                    remaining = (24 * (durations[0] * days_per_year + durations[1] * days_per_year / 12 + durations[2] * 7 + durations[3]) + durations[4] + durations[5] / 60 + durations[6] / 3600).toFixed(4);
                }
                while (remaining.length < 16) {
                    remaining = '0' + remaining;
                }
                row_data[hr_index + 2] = remaining + row_data[hr_index + 2];
            }
            return row_data;
        }
        // Processes a table and parses its rows' contents
        function parse_table(table) {
            var size_index = null;
            var seeders_index = null;
            var duration_index = null;
            var hr_index = null;
            var headers = table.querySelector('tr');
            var cells = headers.cells;
            var column = 0;
            for (var i = 0, length = cells.length; i < length; i++) {
                var cell = cells[i];
                //console.log(cell);

                // Get rid of non-breakable spaces -.-
                var text_content = cell.textContent.replace(/\u00a0/g, ' ').trim().toLowerCase();
                var title = cell.title.trim().toLowerCase();
                //console.log(title);
                if (size_index === null && (text_content === 'size' || title === 'size' || cell.querySelector('*[title="Size"]') !== null)) {
                    size_index = column;
                }
                if (seeders_index === null && (title === 'seeders' || cell.querySelector('*[title="Seeders"]') !== null)) {
                    seeders_index = column;
                }
                if (duration_index === null && (text_content === 'seeding time' || text_content === 'seed time')) {
                    duration_index = column;
                }
                if (hr_index === null && text_content === 'h&r') {
                    hr_index = column;
                }
                column += cell.colSpan;
            }
            if (size_index !== null && seeders_index !== null && show_yen) {
                var td1 = document.createElement(headers.cells[0].nodeName);
                td1.textContent = '¥/' + time_frame_string.charAt(0);
                td1.title = '¥ per ' + time_frame_string;
                td1.className = 'UserScriptToggleYen';
                var td2 = document.createElement(headers.cells[0].nodeName);
                td2.textContent = '¥/' + time_frame_string.charAt(0) + '/GB';
                td2.title = '¥ per ' + time_frame_string + ' per GB';
                td2.className = 'UserScriptToggleYenPerGB';
                td2.style.display = 'none';
                td1.addEventListener('click', toggle_yen());
                td2.addEventListener('click', toggle_yen());
                headers.appendChild(td2);
                headers.appendChild(td1);
                // Increase colSpan of non-torrent rows in the table
                var non_torrents = table.querySelectorAll('tr.edition_info,tr.pad,tr[id^="group_"]');
                for (var i = 0, length = non_torrents.length; i < length; i++) {
                    var non_torrent = non_torrents[i];
                    var cells_1 = non_torrent.cells;
                    var last_cell = cells_1[cells_1.length - 1];
                    last_cell.colSpan += 1;
                }
            }
            // Parse table data
            var table_data = [];
            var real_torrents = table.querySelectorAll('tr.torrent,tr.group_torrent');
            for (var i = 0, length = real_torrents.length; i < length; i++) {
                var row = real_torrents[i];
                table_data.push(parse_row(row, size_index, seeders_index, duration_index, hr_index));
            }
            // Sorting...
            var table_body = table_data[0][0].parentNode;
            var sort_index = null;
            var sort_descending = true;
            function sort_function(index) {
                return function (a, b) {
                    if ((a[index + 2] !== null) && (b[index + 2] !== null)) {
                        if (a[index + 2] > b[index + 2]) {
                            return -1;
                        }
                        else if (a[index + 2] < b[index + 2]) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                    else if ((a[index + 2] !== null) && (b[index + 2] === null)) {
                        return -1;
                    }
                    else if ((b[index + 2] !== null) && (a[index + 2] === null)) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                };
            }
            function sort_by_index(index, toggle) {
                if (toggle === void 0) { toggle = true; }
                return function (event) {
                    if (event !== null) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                    if (index !== null) {
                        if (sort_index === index && toggle) {
                            sort_descending = sort_descending !== true;
                            table_data.reverse();
                        }
                        else {
                            if (toggle) {
                                sort_descending = true;
                            }
                            sort_index = index;
                            table_data.sort(sort_function(index));
                            if (!sort_descending) {
                                table_data.reverse();
                            }
                        }
                    }
                    for (var i = 0, length = table_data.length; i < length; i++) {
                        var row = table_data[i];
                        var next_separator_element = get_next_separator_element_sibling(row[0]);
                        if (next_separator_element !== null) {
                            table_body.insertBefore(row[0], next_separator_element);
                            if (row[1] !== null) {
                                table_body.insertBefore(row[1], next_separator_element);
                            }
                        }
                        else {
                            table_body.appendChild(row[0]);
                            if (row[1] !== null && row[0] !== row[1]) {
                                table_body.appendChild(row[1]);
                            }
                        }
                    }
                };
            }
            if (sort_rows && table_data.length > 1) {
                // Add * to headers which will trigger sort
                for (var i = 0, length = cells.length; i < length; i++) {
                    var cell = cells[i];
                    var index = get_column(headers, cell);
                    var a = document.createElement('a');
                    a.href = '#';
                    a.textContent = '*';
                    a.addEventListener('click', sort_by_index(index));
                    cell.appendChild(a);
                }
            }
            if (dynamic_load) {
                var current_page_match = document.URL.match(/page=(\d+)/i);
                var current_page = current_page_match != null ? parseInt(current_page_match[1], 10) : 1;
                var previous_page = current_page - 1;
                var next_page = current_page + 1;
                var last_page = Infinity;
                var pagenums = [];
                if (table.previousElementSibling !== null) {
                    var pagenum = table.previousElementSibling.querySelector('div.pagenums');
                    if (pagenum !== null) {
                        pagenums.push(pagenum);
                    }
                }
                if (table.nextElementSibling !== null) {
                    var pagenum = table.nextElementSibling.querySelector('div.pagenums');
                    if (pagenum !== null) {
                        pagenums.push(pagenum);
                    }
                }
                var previous_anchors = [];
                var next_anchors = [];
                // Loads the previous or next page into tableData, triggered by MouseEvent
                function load_history_page(prev) {
                    if (prev === void 0) { prev = false; }
                    return function (event) {
                        if (event !== null) {
                            event.stopPropagation();
                            event.preventDefault();
                        }
                        var new_page = prev ? previous_page-- : next_page++;
                        if (new_page < 1 || new_page > last_page) {
                            return;
                        }
                        // Remove links to dynamically load more pages if we've reached the end
                        if (new_page === 1) {
                            for (var i = 0, length = previous_anchors.length; i < length; i++) {
                                var pagenum = previous_anchors[i];
                                pagenum.parentNode.removeChild(pagenum);
                            }
                        }
                        if (new_page === last_page) {
                            for (var i = 0, length = next_anchors.length; i < length; i++) {
                                var pagenum = next_anchors[i];
                                pagenum.parentNode.removeChild(pagenum);
                            }
                        }
                        var url = document.URL.split('#')[0];
                        if (url.indexOf('page=') >= 0) {
                            url = url.replace(/page=(\d+)/i, 'page=' + new_page);
                        }
                        else {
                            url = url + '&page=' + new_page;
                        }
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, true);
                        xhr.send();
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === 4) {
                                var parser = new DOMParser();
                                var new_document = parser.parseFromString(xhr.responseText, 'text/html');
                                var new_torrents = new_document.querySelectorAll('tr.torrent,tr.group_torrent');
                                for (var i = 0, length = new_torrents.length; i < length; i++) {
                                    var new_torrent = new_torrents[i];
                                    table_data.push(parse_row(new_torrent, size_index, seeders_index, duration_index, hr_index));
                                }
                                sort_by_index(sort_index, false)(null);
                                toggle_yen(false)();
                            }
                        };
                    };
                }
                for (var i = 0, length = pagenums.length; i < length; i++) {
                    var pagenum = pagenums[i];
                    // Figure out what the last page is
                    var last_child = pagenum.lastElementChild;
                    if (last_child !== null && last_child.href !== null) {
                        var lastPageMatch = last_child.href.match(/page=(\d+)/i);
                        last_page = lastPageMatch !== null ? parseInt(lastPageMatch[1], 10) : 1;
                    }
                    else {
                        last_page = parseInt(last_child.textContent.trim(), 10);
                        if (isNaN(last_page)) {
                            last_page = 1;
                        }
                    }
                    var clone = pagenum.parentNode.cloneNode(true);
                    var new_pagenum = clone.querySelector('div.pagenums');
                    while (new_pagenum.hasChildNodes()) {
                        new_pagenum.removeChild(new_pagenum.lastChild);
                    }
                    // Add buttons to dynamically load previous or next page
                    if (current_page > 1) {
                        var a = document.createElement('a');
                        a.href = '#';
                        a.className = 'next-prev';
                        a.textContent = '← Load previous page dynamically';
                        a.addEventListener('click', load_history_page(true), true);
                        new_pagenum.appendChild(a);
                        previous_anchors.push(a);
                    }
                    if (current_page < last_page) {
                        var a = document.createElement('a');
                        a.href = '#';
                        a.className = 'next-prev';
                        a.textContent = 'Load next page dynamically →';
                        a.addEventListener('click', load_history_page(false), true);
                        new_pagenum.appendChild(a);
                        next_anchors.push(a);
                    }
                    // Insert new pagenum after old pagenum
                    pagenum.parentNode.parentNode.insertBefore(clone, pagenum.parentNode.nextSibling);
                }
            }
            // Function to filter torrent tables with deselected tags
            function filter_torrent_table(filter_body) {
                // Calculate deselected tags on demand
                var deselected = {};
                if (filter_body.hasChildNodes()) {
                    var checkboxes = filter_body.firstElementChild.querySelectorAll('input[type="checkbox"]');
                    for (var i = 0, length = checkboxes.length; i < length; i++) {
                        var checkbox = checkboxes[i];
                        if (!checkbox.checked) {
                            deselected[checkbox.value] = true;
                        }
                    }
                }
                // Create new form
                var new_form = document.createElement('form');
                // value = 0: all hidden, value = 1: at least one visible
                var available_tags = {};
                var values_by_column = [];
                // Check if there are both options for these binary traits, and if so display, else ignore
                var dual_audio = 0;
                var freeleech = 0;
                var remastered = 0;
                for (var i = 0, length = real_torrents.length; i < length; i++) {
                    var torrent = real_torrents[i];
                    var is_freeleech = /freeleech/.test(torrent.className) || torrent.querySelector('img[alt="Freeleech!"]') !== null;
                    var is_remastered = torrent.querySelector('img[alt="Remastered"]') !== null;
                    var is_dual_audio = /Dual Audio/.test(torrent.cells[0].lastElementChild.textContent);
                    dual_audio |= is_dual_audio ? 1 : 2;
                    freeleech |= is_freeleech ? 1 : 2;
                    remastered |= is_remastered ? 1 : 2;
                }
                for (var i = 0, length = real_torrents.length; i < length; i++) {
                    var torrent = real_torrents[i];
                    var corresponding = get_corresponding_torrent_row(torrent);
                    var is_freeleech = /freeleech/.test(torrent.className) || torrent.querySelector('img[alt="Freeleech!"]') !== null;
                    var is_remastered = torrent.querySelector('img[alt="Remastered"]') !== null;
                    // Check for deselected tags in cleaned textContent of first cell
                    var text = torrent.cells[0].lastElementChild.textContent;
                    var is_dual_audio = /Dual Audio/i.test(text);
                    // Remove » from beginning, format, Dual Audio, end empty tags (images, will handle them separately down below)
                    text = text.replace(/^\s*»/i, '').replace(/\d+:\d+/g, '').replace(/Dual Audio/ig, '').replace(/\|(\s*\|)+/g, '|').replace(/^\s*\|/, '').replace(/\|\s*$/, '');
                    // Split text content to get tags
                    var torrent_tags = (text.indexOf('|') >= 0 ? text.split('|') : text.split('/')).map(function (e) { return e.trim(); });
                    // Add Dual Audio, Freeleech, and Remastered status, only if torrents with yes and no are available
                    if (dual_audio === 3) {
                        torrent_tags.push(is_dual_audio ? 'Dual Audio' : 'No Dual Audio');
                    }
                    if (freeleech === 3) {
                        torrent_tags.push(is_freeleech ? 'Freeleech' : 'No Freeleech');
                    }
                    if (remastered === 3) {
                        torrent_tags.push(is_remastered ? 'Remastered' : 'Not Remastered');
                    }
                    // Keep track of tags and whether this element needs to be hidden
                    var to_be_collapsed = false;
                    for (var j = 0; j < torrent_tags.length; j++) {
                        var tag = torrent_tags[j];
                        if (deselected.hasOwnProperty(tag)) {
                            to_be_collapsed = true;
                            break;
                        }
                    }
                    for (var j = 0; j < torrent_tags.length; j++) {
                        var tag = torrent_tags[j];
                        // Fucking ISOs...
                        if (tag.indexOf('ISO') === 0) {
                            torrent_tags.splice(j + 1, 0, '');
                        }
                        if (tag !== '') {
                            if (!available_tags.hasOwnProperty(tag)) {
                                available_tags[tag] = 0;
                            }
                            if (!to_be_collapsed) {
                                available_tags[tag] = 1;
                            }
                            while (values_by_column.length <= j) {
                                values_by_column.push({});
                            }
                            if (!values_by_column[j].hasOwnProperty(tag)) {
                                values_by_column[j][tag] = 1;
                            }
                        }
                    }
                    // Hide or show torrent row and corresponding row if deselected tags are found
                    if (to_be_collapsed) {
                        torrent.style.display = 'none';
                        if (corresponding !== null) {
                            corresponding.style.display = 'none';
                        }
                    }
                    else {
                        torrent.style.display = '';
                        if (corresponding !== null) {
                            corresponding.style.display = '';
                        }
                    }
                }
                // If we found any tags or anything is deselected, create filter box
                if (values_by_column.length > 0 || Object.keys(deselected).length > 0) {
                    // Only show each tag once, even across multiple columns, so keep track
                    var shown_values = {};
                    for (var i = 0, length = values_by_column.length; i < length; i++) {
                        var index = values_by_column[i];
                        var sorted_tags = Object.keys(index).sort(function (a, b) { if (a.toUpperCase() > b.toUpperCase())
                            return 1;
                        else
                            return -1; });
                        for (var j = 0, len = sorted_tags.length; j < len; j++) {
                            var tag = sorted_tags[j];
                            if (shown_values.hasOwnProperty(tag)) {
                                // Skip values we have already shown
                                continue;
                            }
                            else {
                                shown_values[tag] = 1;
                            }
                            var label = document.createElement('label');
                            label.innerHTML = '<input type="checkbox" ' + (deselected[tag] != null ? '' : 'checked="checked"') + '> ' + tag;
                            var input = label.querySelector('input');
                            input.value = tag;
                            label.style.marginRight = '1em';
                            label.style.display = 'inline-block';
                            // No visible torrents have this property, but it's also not deselected
                            if (available_tags[tag] === 0 && !deselected.hasOwnProperty(tag)) {
                                label.style.opacity = '0.25';
                            }
                            // Only one option, grey it out slightly
                            if (sorted_tags.length <= 1) {
                                label.style.opacity = '0.5';
                            }
                            new_form.appendChild(label);
                        }
                        new_form.appendChild(document.createElement('hr'));
                    }
                    // Remove excessive hr at end (where do they come from?)
                    while (new_form.lastElementChild.tagName === 'HR') {
                        new_form.removeChild(new_form.lastChild);
                    }
                    // With every change (all changes are checkbox changes), update deselected and filter anew
                    new_form.addEventListener('change', function (e) {
                        filter_torrent_table(filter_body);
                    });
                    // Replace old_form with new_form
                    if (filter_body.hasChildNodes()) {
                        filter_body.replaceChild(new_form, filter_body.firstElementChild);
                    }
                    else {
                        filter_body.appendChild(new_form);
                    }
                }
            }
            if (filter_torrents && real_torrents.length > 1) {
                var box = document.createElement('div');
                var head = document.createElement('div');
                var body = document.createElement('div');
                box.className = 'box torrent_filter_box';
                head.className = 'head colhead strong';
                body.className = 'body pad';
                body.style.display = 'none';
                head.innerHTML = '<a href="#"><span class="triangle-right-md"><span class="stext">+/-</span></span> Filter </a>';
                // Show or hide filter box
                function head_click_event(e) {
                    if (e !== null) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    var span = head.querySelector('span');
                    if (body.style.display !== 'none') {
                        body.style.display = 'none';
                        span.className = 'triangle-right-md';
                    }
                    else {
                        filter_torrent_table(body);
                        body.style.display = '';
                        span.className = 'triangle-down-md';
                    }
                }
                head.addEventListener('click', head_click_event);
                box.appendChild(head);
                box.appendChild(body);
                table.parentNode.insertBefore(box, table);
            }
        }
        // Process and parse all tables
        if (show_yen || show_required_time || sort_rows || dynamic_load || filter_torrents) {
            var all_torrent_tables = document.querySelectorAll('table.torrent_table,table.torrent_group');
            for (var i = 0, length = all_torrent_tables.length; i < length; i++) {
                var table = all_torrent_tables[i];
                parse_table(table);
            }
        }

        // If yen should be shown and user creation is not yet saved, try to get and save it
        if ( show_yen && (GM_getValue('creation', '0').toString() === '0' || GM_getValue('creation', '0') === 'null')) {


            // no longer works because header profile link uses username.
            //var user_id = document.querySelector('div#header div#userinfo li#username_menu a.username');

            // checks if the current page's URL matches the profile page
            // of the logged in user.
            // var user_id_re = new RegExp('/user\\.php\\?id=' + CURRENT_USER["userId"]);
            //console.log(CURRENT_USER["userId"]);
            //console.log();
            //if (document.URL.match(user_id_re) !== null) {

            // ^ broken on some browsers if CURRENT_USER isn't passed.

            // checks if the username link in navbar is the same as the current heading.
            // if it is, we are on a profile page.
            // hopefully no edge cases
            // - TFM 2017-12-28
            var user_link = document.querySelector('div#header div#userinfo li#username_menu a.username');
            var user_heading = document.querySelector('div#content h2 a');
            var user_profile_re = /\/user\.php\?id=/i;

            if (document.URL.match(user_profile_re) !== null && user_link !== null && user_heading !== null && user_link.href === user_heading.href) {

                var user_stats = document.querySelector('div#content div#user_rightcol div.userstatsleft dl.userprofile_list');
                var children = user_stats.children;
                //console.log(children);
                for (var i = 0, length = children.length; i < length; i++) {

                    var child = children[i];
                    //console.log(child);
                    if (child.textContent.indexOf("Join") !== -1) {
                        try {
                            var join_date = child.nextElementSibling.firstElementChild.title;

                            // deletes timezone because it was causing issues with Date.parse()
                            // worst case is +/- 12 hours anyway
                            var timezone_re = /( \d\d:\d\d) [A-Z]+$/;
                            GM_setValue('creation', JSON.stringify(Date.parse(join_date.replace(timezone_re, '$1'))));
                        }
                        catch (error) { }
                    }
                }
            }
        }
    }).call(this);


    if((/^http.*:\/\/animebytes\.tv\/forums\.php/i.test(document.URL)) && !/action=viewthread/i.test(document.URL)){
    // Generated by CoffeeScript 1.9.1

    /*
    // ==UserScript==
    // @name        AnimeBytes - Forum Search - Enhancement
    // @namespace   Megure@AnimeBytes.tv
    // @description Load posts into search results; highlight search terms; filter authors; slide through posts
    // @include     http*://animebytes.tv/forums.php*
    // @exclude     *action=viewthread*
    // @version     0.72
    // @grant       GM_getValue
    // @icon        http://animebytes.tv/favicon.ico
    // ==/UserScript==
     */

    (function ForumSearchEnhancement() {
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

      getFirstTagParent = function(elem, tag) {
        while (elem !== null && elem.tagName !== 'BODY' && elem.tagName !== tag) {
          elem = elem.parentNode;
        }
        if (elem === null || elem.tagName !== tag) {
          return null;
        } else {
          return elem;
        }
      };

      textReplace = function(elem) {
        var node, regExp, walk;
        if (patt !== '' && (background_color !== 'none' || text_color !== 'none')) {
          walk = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false);
          node = walk.nextNode();
          regExp = new RegExp('(' + patt + ')', 'i');
          while (node != null) {
            node.textContent.replace(regExp, function(term) {
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

      processThreadPage = function(id, threadid, page, parent, link) {
        return function() {
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

      loadThreadPage = function(threadid, page) {
        var threadPage, xhr;
        threadPage = "threadid=" + threadid + "&page=" + page;
        tP[threadPage] = 'Loading';
        cb[threadPage] = [];
        xhr = new XMLHttpRequest();
        xhr.open('GET', "https://animebytes.tv/forums.php?action=viewthread&" + threadPage, true);
        xhr.send();
        xhr.onreadystatechange = function() {
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

      loadPost = function(link, index, filtered) {
        return function(event) {
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

      toggleVisibility = function(id) {
        var elem;
        elem = sR[id];
        if (elem.td.parentNode.style.visibility === 'collapse') {
          showPost(id, null)();
          return elem.td.parentNode.style.visibility = 'visible';
        } else {
          return elem.td.parentNode.style.visibility = 'collapse';
        }
      };

      showPost = function(id, prev) {
        return function(event) {
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

      filterPost = function(id) {
        return function() {
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
        button.addEventListener('click', function(event) {
          var j, len1, results, userName;
          if (input.value.replace(/[,\s]/g, '') !== '') {
            user_filter = (function() {
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
        if (hideSubSelection) {
          searchForumsNew = searchForums.cloneNode(true);
          searchForums.style.visibility = 'collapse';
          searchForumsCB = searchForumsNew.cells[1];
          while (searchForumsCB.hasChildNodes()) {
            searchForumsCB.removeChild(searchForumsCB.lastChild);
          }
          newCheckbox = document.createElement('input');
          newCheckbox.type = 'checkbox';
          searchForumsCB.appendChild(newCheckbox);
          searchForumsCB.appendChild(document.createTextNode(' Show forum selection: select (sub-) forums to search in.'));
          searchForums.parentNode.insertBefore(searchForumsNew, searchForums);
          newCheckbox.addEventListener('change', function(event) {
            searchForums.style.visibility = 'visible';
            return searchForumsNew.style.visibility = 'collapse';
          }, true);
        }
      }

      if (showFastSearchLinks) {
        forumid = document.URL.match(/forumid=(\d+)/i);
        if (forumid != null) {
          forumid = parseInt(forumid[1], 10);
          quickLink = document.createElement('a');
          quickLink.textContent = ' [Search this forum] ';
          quickLink.href = "/forums.php?action=search&forums[]=" + forumid;
          linkbox1 = document.querySelector('div.linkbox');
          newLinkBox = linkbox1.cloneNode(true);
          while (newLinkBox.hasChildNodes()) {
            newLinkBox.removeChild(newLinkBox.lastChild);
          }
          linkbox1.parentNode.insertBefore(newLinkBox, linkbox1);
          newLinkBox.appendChild(quickLink);
          forumIds = document.querySelectorAll('table a[href^="/forums.php?action=viewforum&forumid="]');
          forumIds = (function() {
            var j, len1, results;
            results = [];
            for (j = 0, len1 = forumIds.length; j < len1; j++) {
              myLINK = forumIds[j];
              results.push(parseInt((myLINK.href.match(/forumid=(\d*)/i))[1], 10));
            }
            return results;
          })();
          if (forumIds.length > 0) {
            forumIds.push(forumid);
            quickLinkSubs = document.createElement('a');
            quickLinkSubs.textContent = ' [Search this forum and all direct subforums] ';
            quickLinkSubs.href = "/forums.php?action=search&forums[]=" + forumIds.join('&forums[]=');
            newLinkBox.appendChild(quickLinkSubs);
          }
        }
      }

    }).call(this);

    }
    // Add settings
    if(/\/user\.php\?.*action=edit/i.test(document.URL)){
        (function(){
        function addBooleanSetting(key, name, description, onValue, offValue, myDefault){

          var __temp = document.createElement('li');
          __temp.className = '';
          __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'><input id='Setting_" + key + "' name='Setting_" + key + "' type='checkbox'" + (GM_getValue(key, myDefault).toString() === onValue.toString() ? " checked='checked'" : "") + "> <label for='Setting_" + key + "'>" + description + "</label></span>";
          __temp.addEventListener('change', function(ev){var ch = ev.target.checked; (ch === true ? GM_setValue(key, onValue) : GM_setValue(key, offValue));});
          document.getElementById('pose_list').appendChild(__temp);

    }

    function addSelectSetting(key, name, description, myDefault, values){

          var __temp = document.createElement('li');
          __temp.className = '';
          __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'><select id='Setting_" + key + "' name='Setting_" + key + "'>" +
          ((function(){var res = "";
            for(var i = 0; i < values.length; i++){
              var elem = values[i];
              res += "<option " + (GM_getValue(key, myDefault).toString() === elem[0].toString() ? "selected='selected'" : "") + " value='"+elem[0]+"'>"+elem[1]+"</option>";
            }
            return res;
          }).call(this)) + "</select> <label for='Setting_" + key + "'>" + description + "</label></span>";
          __temp.addEventListener('change', function(e){GM_setValue(key, e.target.value);});
          document.getElementById('pose_list').appendChild(__temp);

    }

    function addColorSetting(key, name, description, myDefault, deactivatable, deactiveDefault){

          var __temp = document.createElement('li');
          __temp.className = '';
          __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'>" +
        (deactivatable.toString() === 'true' ? "<input id='ColorCheckBox_" + key + "' type='checkbox' " +
              (GM_getValue(key, myDefault).toString() !== deactiveDefault.toString() ? "checked='checked'" : "") +
        ">" : "") +
        " <input id='Setting_" + key + "' name='Setting_" + key + "' type='color' value='" + (GM_getValue(key, myDefault).toString() === deactiveDefault.toString() ? (myDefault.toString() === deactiveDefault.toString() ? '#000000' : myDefault) : GM_getValue(key, myDefault)) + "'>" +
        " <button type='button'>Reset</button> <label for='Setting_" + key + "'>" + description + "</label></span>";
          __temp.addEventListener('change', function(e){var a = e.target;
              if(a.type === "checkbox"){ a.checked === false ? GM_setValue(key, deactiveDefault) : GM_setValue(key, document.getElementById('Setting_' + key).value) }
              else if(a.type === "color"){ GM_setValue(key, a.value); document.getElementById('ColorCheckBox_' + key).checked = true; }
        });
    __temp.addEventListener('click', function(e){var a = e.target;
            if(a.type === "button"){
                GM_deleteValue(key);
                if (myDefault.toString() === deactiveDefault.toString()) {
                    document.getElementById('ColorCheckBox_' + key).checked = false;
                    document.getElementById('Setting_' + key).value = '#000000';
                }
                else {
                    document.getElementById('ColorCheckBox_' + key).checked = true;
                    document.getElementById('Setting_' + key).value = myDefault;
                }
            }
        });
          document.getElementById('pose_list').appendChild(__temp);

    }

    function addTextSetting(key, name, description, myDefault, maxLength){

          var __temp = document.createElement('li');
          __temp.className = '';
          __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'><input id='Setting_" + key + "' name='Setting_" + key + "' type='text' maxlength='" + maxLength + "' value='" + GM_getValue(key, myDefault) + "'> <label for='Setting_" + key + "'>" + description + "</label></span>";
          __temp.addEventListener('keyup', function(e){var a = e.target;
              if(a.type === "text"){ GM_setValue(key, a.value); }});
          document.getElementById('pose_list').appendChild(__temp);

    }


        document.getElementById('pose_list').appendChild(document.createElement('hr'));
        addBooleanSetting('ABTorrentsShowYen', 'Show Yen generation', 'Show Yen generation for torrents, with detailed information when hovered.', 'true', 'false', 'true');
        addSelectSetting('ABTorrentsYenTimeFrame', 'Yen generation time frame', 'The amount of generated Yen per selected time frame.', '1', [["1","Hour"],["24","Day"],["168","Week"]]);
        addBooleanSetting('ABTorrentsReqTime', 'Show required seeding time', 'Shows minimal required seeding time for torrents in their description and when size is hovered.', 'true', 'false', 'true');
        addBooleanSetting('ABTorrentsFilter', 'Filter torrents', 'Shows a box above torrent tables, where you can filter the torrents from that table.', 'true', 'false', 'true');
        addBooleanSetting('ABSortTorrents', 'Sort torrents', 'Allows torrent tables to be sorted.', 'true', 'false', 'true');
        addBooleanSetting('ABHistDynLoad', 'Dynamic history tables', 'Dynamically load more pages into transfer history tables.', 'true', 'false', 'true');
        document.getElementById('pose_list').appendChild(document.createElement('hr'));
        addBooleanSetting('ABForumEnhFastSearch', 'Create links to search forums', 'Add links to search forums (including or excluding direct subforums) at the top of a forums page.', 'true', 'false', 'true');
        addBooleanSetting('ABForumSearchWorkInFS', 'Load posts into search results', 'Allows you to load posts and threads into search results, slide through posts and filter for authors.', 'true', 'false', 'true');
        addBooleanSetting('ABForumSearchHideSubfor', 'Hide subforum selection in search', 'This will hide the subforum selection in the search until a checkbox is clicked.', 'true', 'false', 'true');
        addColorSetting('ABForumSearchHighlightBG', 'Color for search terms', 'Background color for search terms within posts and headers.', '#FFC000', 'true', 'none');
        addColorSetting('ABForumSearchHighlightFG', 'Color for search terms', 'Text color for search terms within posts and headers.', '#000000', 'true', 'none');
        addBooleanSetting('ABForumEnhWorkInRest', 'Load posts into forum view', 'Allows you to load posts and threads into the general forum view.', 'true', 'false', 'false');
        addTextSetting('ABForumLoadText', 'Text for links to be loaded', 'The text to be shown for forum links that have not been loaded yet.', '(Load)', '10');
        addTextSetting('ABForumLoadingText', 'Text for loading links', 'The text to be shown for forum links that are currently being loaded.', '(Loading)', '10');
        addTextSetting('ABForumToggleText', 'Text for loaded links', 'The text to be shown for forum links that have been loaded and can now be toggled.', '(Toggle)', '10');

        }).call(this);
    }
})();