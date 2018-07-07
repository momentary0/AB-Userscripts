// ==UserScript==
// @name AnimeBytes forums title inverter
// @author potatoe
// @version 0.1
// @description Inverts the forums titles.
// @icon https://animebytes.tv/favicon.ico
// @include https://animebytes.tv/forums.php?*
// @match https://animebytes.tv/forums.php?*
// @grant none
// @require https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

// Forums title inverter by Potatoe
// Inverts the forums titles.
(function ABTitleInverter() {
    delicious.settings.init('delicioustitleflip', true);
    if (delicious.settings.ensureSettingsInserted()) {
        delicious.settings.addScriptCheckbox('delicioustitleflip', 'Title inverter',
            'Flips the tab title.');
    }
    if (!delicious.settings.get('delicioustitleflip'))
        return;

    if (document.title.indexOf(' > ') !== -1) {
        document.title = document.title.split(" :: ")[0].split(" > ").reverse().join(" < ") + " :: AnimeBytes";
    }
})();