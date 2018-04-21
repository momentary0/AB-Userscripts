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