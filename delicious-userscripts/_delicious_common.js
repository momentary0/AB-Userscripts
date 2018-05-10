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