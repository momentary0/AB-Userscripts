// ==UserScript==
// @name AnimeBytes forums title inverter
// @author potatoe
// @version 0.1
// @description Inverts the forums titles.
// @icon https://animebytes.tv/favicon.ico
// @include https://animebytes.tv/forums.php?*
// @match https://animebytes.tv/forums.php?*
// @grant       GM_setValue
// @grant       GM_getValue
// @require https://github.com/momentary0/AB-Userscripts/raw/master/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

// Forums title inverter by Potatoe
// Inverts the forums titles.
(function ABTitleInverter() {
    var _enabled = delicious.settings.basicScriptCheckbox(
        'delicioustitleflip',
        'Delicious Title Flip',
        'Flips the tab title.'
    );
    if (!_enabled)
        return;

    if (document.title.indexOf(' > ') !== -1) {
        document.title = document.title.split(" :: ")[0].split(" > ").reverse().join(" < ") + " :: AnimeBytes";
    }
})();