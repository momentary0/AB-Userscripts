// ==UserScript==
// @name        AB - Yen per X and ratio milestones
// @author      Megure, Lemma, NSC, et al.
// @description Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
// @include     https://animebytes.tv/user.php*
// @version     0.1
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

// Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
(function ABYenStats() {
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
        tw = document.createTreeWalker(document, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^Raw Uploaded:/i.test(node.data); } });
        if (tw.nextNode() == null) return;
        var rawUpMatch = tw.currentNode.data.match(regExp);
        tw = document.createTreeWalker(tw.currentNode.parentNode.parentNode, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^Raw Downloaded:/i.test(node.data); } });
        if (tw.nextNode() == null) return;
        var rawDownMatch = tw.currentNode.data.match(regExp);
        tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Ratio/i.test(node.data); } });
        if (tw.nextNode() == null) return;
        var ratioNode = tw.currentNode.parentNode;
        tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Uploaded/i.test(node.data); } });
        if (tw.nextNode() == null) return;
        var ulNode = tw.currentNode.parentNode;
        tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /^\s*Downloaded/i.test(node.data); } });
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
        var tw = document.createTreeWalker(document.getElementById('content'), NodeFilter.SHOW_TEXT, { acceptNode: function (node) { return /Yen per day/i.test(node.data); } });
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
})();