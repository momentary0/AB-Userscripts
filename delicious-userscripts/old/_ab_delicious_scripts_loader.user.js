// ==UserScript==
// @name AnimeBytes delicious user scripts (updated)
// @author aldy, potatoe, alpha, Megure
// @version 2.0.1.9
// @description Variety of userscripts to fully utilise the site and stylesheet. (Updated by TheFallingMan)
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @include *animebytes.tv/*
// @match https://*.animebytes.tv/*
// @icon http://animebytes.tv/favicon.ico
// @require https://raw.githubusercontent.com/momentary0/AB-Userscripts/master/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

(function AnimeBytesDeliciousUserScripts() {

    // Placeholder function. Imports are done by an external Python script
    // inserting script files where needed.
    // This should never be executed.
    function importScriptFile(filename) {
        console.error(filename + ' was not imported into the delicious userscript');
    }

    // Some GM_ functions and Javascript polyfills


    // Better Quote no longer necessary.

    // HYPER QUOTE by Megure
    // Select text and press CTRL+V to quote
    importScriptFile('ab_hyper_quote.user.js');


    // Forums title inverter by Potatoe
    // Inverts the forums titles.
    importScriptFile('ab_title_inverter.user.js');


    // Hide treats by Alpha
    // Hide treats on profile.
    importScriptFile('ab_hide_treats.user.js');


    // Keyboard shortcuts by Alpha, mod by Megure
    // Enables keyboard shortcuts for forum (new post and edit) and PM
    importScriptFile('ab_keyboard_shortcuts.user.js');


    // Title Notifications by Megure
    // Will prepend the number of notifications to the title
    importScriptFile('ab_title_notifications.user.js');


    // Freeleech Pool Status by Megure, inspired by Lemma, Alpha, NSC
    // Shows current freeleech pool status in navbar with a pie-chart
    // Updates only once every hour or when pool site is visited, showing a pie-chart on pool site
    importScriptFile('ab_fl_status.user.js');


    // Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
    importScriptFile('ab_yen_stats.user.js');


    // Enhanced Torrent View by Megure
    // Shows how much yen you would receive if you seeded torrents;
    // shows required seeding time; allows sorting and filtering of torrent tables;
    // dynamic loading of transfer history tables
    importScriptFile('ab_enhanced_torrent_view.user.js');


    // Forum search enhancement by Megure
    // Load posts into search results; highlight search terms; filter authors; slide through posts
    importScriptFile('ab_forum_search_enhancement.user.js');

})();