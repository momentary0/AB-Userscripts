// ==UserScript==
// @name AnimeBytes forums title inverter
// @author potatoe
// @version 0.1
// @description Inverts the forums titles.
// @icon https://animebytes.tv/favicon.ico
// @include https://animebytes.tv/forums.php?*
// @match https://animebytes.tv/forums.php?*
// @grant none
// ==/UserScript==

/* === Script generated at 2018-04-21T16:45:41.194179 === */


// Forums title inverter by Potatoe
// Inverts the forums titles.
(function ABTitleInverter() {
    if (document.title.indexOf(' > ') !== -1) {
    document.title = document.title.split(" :: ")[0].split(" > ").reverse().join(" < ") + " :: AnimeBytes";
    }
})();