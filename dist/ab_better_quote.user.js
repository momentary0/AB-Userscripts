// ==UserScript==
// @name        AnimeBytes - Better quote
// @author      Potatoe, Megure
// @description Makes the quoting feature on AnimeBytes better by including links back to posts and the posted date.
// @include     https://animebytes.tv/forums.php*action=viewthread*
// @version     0.1
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

/* === Script generated at 2018-04-21T16:45:41.111404 === */

/* === Inserted from _delicious_common.js === */
// Common functions used by many scripts.
// Will be inserted once into the delicious bundle, 
// and prepended to each individual userscript.

// Debug flag. Used to enable/disable some verbose console logging.
var _debug = false;

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
if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported") > -1)) {
    this.GM_getValue = function (key, def) { return localStorage[key] || def; };
    this.GM_setValue = function (key, value) { return localStorage[key] = value; };
    this.GM_deleteValue = function (key) { return delete localStorage[key]; };
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

// Better quote by Potatoe, multi-quote by Megure
// Makes the quoting feature on AnimeBytes better by including links back to posts and the posted date.
// Depends on injectScript
function ABBetterQuote() {
    if (typeof injectScript === 'undefined') {
        injectScript = function injectScript(content, id) {
            var script = document.createElement('script');
            if (id) script.setAttribute('id', id);
            script.textContent = content.toString();
            document.body.appendChild(script);
            return script;
        };
    }
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
                    function replaceImg(text) { if (text.match(/^([^]*)(\[img\][^\[]+\[\/img\])([^]*)$/mi) != null) { return text.replace(/^([^]*)(\[img\][^\[]+\[\/img\])([^]*)$/mi, function (full, $1, $2, $3) { var tmp = "BQTMPBQ" + new Date().getTime() + "BQTMPBQ", ssm = $1.match(/\[hide(=[^\]]*)?\]/mgi), sem = $1.match(/\[\/hide\]/mgi), esm = $3.match(/\[hide(=[^\]]*)?\]/mgi), eem = $3.match(/\[\/hide\]/mgi), ssm = (ssm != null) ? ssm.length : 0, sem = (sem != null) ? sem.length : 0, esm = (esm != null) ? esm.length : 0, eem = (eem != null) ? eem.length : 0, hsm = ssm - sem, hem = esm - eem, tmptxt = replaceImg($1 + tmp + $3); $1 = tmptxt.substring(0, tmptxt.search(tmp)); $3 = tmptxt.substring(tmptxt.search(tmp) + tmp.length, tmptxt.length); if (hsm >= hem && hsm > 0) return $1 + $2 + $3; return $1 + '[hide=Image]' + $2 + '[/hide]' + $3 }) } return text }
                    function replaceYouTube(text) { if (text.match(/^([^]*)(\[youtube\][^\[]+\[\/youtube\])([^]*)$/mi) != null) { return text.replace(/^([^]*)(\[youtube\][^\[]+\[\/youtube\])([^]*)$/mi, function (full, $1, $2, $3) { var tmp = "BQTMPBQ" + new Date().getTime() + "BQTMPBQ", ssm = $1.match(/\[hide(=[^\]]*)?\]/mgi), sem = $1.match(/\[\/hide\]/mgi), esm = $3.match(/\[hide(=[^\]]*)?\]/mgi), eem = $3.match(/\[\/hide\]/mgi), ssm = (ssm != null) ? ssm.length : 0, sem = (sem != null) ? sem.length : 0, esm = (esm != null) ? esm.length : 0, eem = (eem != null) ? eem.length : 0, hsm = ssm - sem, hem = esm - eem, tmptxt = replaceYouTube($1 + tmp + $3); $1 = tmptxt.substring(0, tmptxt.search(tmp)); $3 = tmptxt.substring(tmptxt.search(tmp) + tmp.length, tmptxt.length); if (hsm >= hem && hsm > 0) return $1 + $2 + $3; return $1 + '[hide=YouTube Video]' + $2 + '[/hide]' + $3 }) } return text }
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
};

ABBetterQuote();
