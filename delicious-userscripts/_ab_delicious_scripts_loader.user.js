// ==UserScript==
// @name AnimeBytes delicious user scripts (updated)
// @author aldy, potatoe, alpha, Megure
// @version 2.0.1.5
// @description Variety of userscripts to fully utilise the site and stylesheet. (Updated by TheFallingMan)
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @include *animebytes.tv/*
// @match https://*.animebytes.tv/*
// @icon http://animebytes.tv/favicon.ico
// ==/UserScript==

(function AnimeBytesDeliciousUserScripts() {

    // Placeholder function. Imports are done by an external Python script
    // inserting script files where needed.
    // This should never be executed.
    function importScriptFile(filename) {
        console.error(filename + ' was not imported into the delicious userscript');
    }

    // Some GM_ functions and Javascript polyfills
    importDeliciousCommon();

    function createSettingsPage() {
        function addCheckbox(title, description, varName, onValue, offValue) {
            if (typeof onValue !== "string" || typeof offValue !== "string" || onValue === offValue) onValue = 'true', offValue = 'false';
            var newLi = document.createElement('li');
            this[varName] = initGM(varName, onValue, false);
            newLi.innerHTML = "<span class='ue_left strong'>" + title + "</span>\n<span class='ue_right'><input type='checkbox' onvalue='" + onValue + "' offvalue='" + offValue + "' name='" + varName + "' id='" + varName + "'" + ((this[varName] === onValue) ? " checked='checked'" : " ") + ">\n<label for='" + varName + "'>" + description + "</label></span>";
            newLi.addEventListener('click', function (e) { var t = e.target; if (typeof t.checked === "boolean") { if (t.checked) { GM_setValue(t.id, t.getAttribute('onvalue')); } else { GM_setValue(t.id, t.getAttribute('offvalue')); } } });
            var poselistNode = document.getElementById('pose_list');
            poselistNode.appendChild(newLi);
            return newLi;
        }
        function addDropdown(title, description, varName, list, def) {
            var newLi = document.createElement('li'), innerHTML = '';
            this[varName] = initGM(varName, def, false);
            innerHTML += "<span class='ue_left strong'>" + title + "</span>\n<span class='ue_right'><select name='" + varName + "' id='" + varName + "'>";
            for (var i = 0; i < list.length; i++) {
                var el = list[i], selected = '';
                if (el[1] === GM_getValue(varName)) selected = " selected='selected'";
                innerHTML += "<option value='" + el[1] + "'" + selected + ">" + el[0] + "</option>";
            }
            innerHTML += "</select><label for='" + varName + "'>" + description + "</label></span>";
            newLi.innerHTML = innerHTML;
            newLi.addEventListener('change', function (e) { GM_setValue(varName, e.target.value); });
            var poseList = document.getElementById('pose_list');
            poseList.appendChild(newLi);
            return newLi;
        }
        function relink() { $j(function () { var stuff = $j('#tabs > div'); $j('ul.ue_tabs a').click(function () { stuff.hide().filter(this.hash).show(); $j('ul.ue_tabs a').removeClass('selected'); $j(this).addClass('selected'); return false; }).filter(':first,a[href="' + window.location.hash + '"]').slice(-1)[0].click(); }); }
        var pose = document.createElement('div');
        pose.id = "potatoes_settings";
        pose.innerHTML = '<div class="head colhead_dark strong">User Script Settings</div><ul id="pose_list" class="nobullet ue_list"></ul>';
        var poseanc = document.createElement('li');
        poseanc.innerHTML = '&bull;<a href="#potatoes_settings">User Script Settings</a>';
        var tabsNode = document.getElementById('tabs');
        var linksNode = document.getElementsByClassName('ue_tabs')[0];
        if (document.getElementById('potatoes_settings') == null) { tabsNode.insertBefore(pose, tabsNode.childNodes[tabsNode.childNodes.length - 2]); linksNode.appendChild(poseanc); document.body.removeChild(injectScript('(' + relink.toString() + ')();', 'settings_relink')); }
        //addCheckbox("Delicious Better Quote", "Enable/Disable delicious better <span style='color: green; font-family: Courier New;'>&gt;quoting</span>", 'deliciousquote');
        addCheckbox("Delicious HYPER Quote", "Enable/Disable experimental HYPER quoting: select text and press CTRL+V to instant-quote. [EXPERIMENTAL]", 'delicioushyperquote');
        addCheckbox("Delicious Title Flip", "Enable/Disable delicious flipping of Forum title tags.", 'delicioustitleflip');
        addCheckbox("Disgusting Treats", "Hide/Unhide those hideous treats!", 'delicioustreats');
        addCheckbox("Delicious Keyboard Shortcuts", "Enable/Disable delicious keyboard shortcuts for easier access to Bold/Italics/Underline/Spoiler/Hide and aligning.", 'deliciouskeyboard');
        addCheckbox("Delicious Title Notifications", "Display number of notifications in title.", 'delicioustitlenotifications');
        addCheckbox("Delicious Yen per X", "Shows how much yen you receive per X, and as upload equivalent.", 'deliciousyenperx');
        addCheckbox("Delicious Ratio", "Shows ratio and raw ratio and how much upload / download you need for certain ratio milestones.", 'deliciousratio');
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

    // Better Quote no longer necessary.

    // HYPER QUOTE by Megure
    // Select text and press CTRL+V to quote
    if (GM_getValue('delicioushyperquote') === 'true') {
        importScriptFile('ab_hyper_quote.user.js');
    }


    // Forums title inverter by Potatoe
    // Inverts the forums titles.
    if (GM_getValue('delicioustitleflip') === 'true') {
        importScriptFile('ab_title_inverter.user.js');
    }


    // Hide treats by Alpha
    // Hide treats on profile.
    if (GM_getValue('delicioustreats') === 'true') {
        importScriptFile('ab_hide_treats.user.js');
    }


    // Keyboard shortcuts by Alpha, mod by Megure
    // Enables keyboard shortcuts for forum (new post and edit) and PM
    if (GM_getValue('deliciouskeyboard') === 'true') {
        importScriptFile('ab_keyboard_shortcuts.user.js');
    }


    // Title Notifications by Megure
    // Will prepend the number of notifications to the title
    if (GM_getValue('delicioustitlenotifications') === 'true') {
        importScriptFile('ab_title_notifications.user.js');
    }


    // Freeleech Pool Status by Megure, inspired by Lemma, Alpha, NSC
    // Shows current freeleech pool status in navbar with a pie-chart
    // Updates only once every hour or when pool site is visited, showing a pie-chart on pool site
    if (GM_getValue('deliciousfreeleechpool', 'true') === 'true') {
        importScriptFile('ab_fl_status.user.js');
    }


    // Yen per X and ratio milestones, by Megure, Lemma, NSC, et al.
    if (/user\.php\?id=/i.test(document.URL)) {
        importScriptFile('ab_yen_stats.user.js');
    }

    // Dynamic stylesheets by Megure, requires jQuery because I'm lazy
    importScriptFile('ab_dynamic_stylesheets.user.js');


    // Enhanced Torrent View by Megure
    // Shows how much yen you would receive if you seeded torrents;
    // shows required seeding time; allows sorting and filtering of torrent tables;
    // dynamic loading of transfer history tables
    importScriptFile('ab_enhanced_torrent_view.user.js');


    // Forum search enhancement by Megure
    // Load posts into search results; highlight search terms; filter authors; slide through posts
    importScriptFile('ab_forum_search_enhancement.user.js');

    // Add settings
    if (/\/user\.php\?.*action=edit/i.test(document.URL)) {
        (function () {
            function addBooleanSetting(key, name, description, onValue, offValue, myDefault) {

                var __temp = document.createElement('li');
                __temp.className = '';
                __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'><input id='Setting_" + key + "' name='Setting_" + key + "' type='checkbox'" + (GM_getValue(key, myDefault).toString() === onValue.toString() ? " checked='checked'" : "") + "> <label for='Setting_" + key + "'>" + description + "</label></span>";
                __temp.addEventListener('change', function (ev) { var ch = ev.target.checked; (ch === true ? GM_setValue(key, onValue) : GM_setValue(key, offValue)); });
                document.getElementById('pose_list').appendChild(__temp);

            }

            function addSelectSetting(key, name, description, myDefault, values) {

                var __temp = document.createElement('li');
                __temp.className = '';
                __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'><select id='Setting_" + key + "' name='Setting_" + key + "'>" +
                    ((function () {
                        var res = "";
                        for (var i = 0; i < values.length; i++) {
                            var elem = values[i];
                            res += "<option " + (GM_getValue(key, myDefault).toString() === elem[0].toString() ? "selected='selected'" : "") + " value='" + elem[0] + "'>" + elem[1] + "</option>";
                        }
                        return res;
                    }).call(this)) + "</select> <label for='Setting_" + key + "'>" + description + "</label></span>";
                __temp.addEventListener('change', function (e) { GM_setValue(key, e.target.value); });
                document.getElementById('pose_list').appendChild(__temp);

            }

            function addColorSetting(key, name, description, myDefault, deactivatable, deactiveDefault) {

                var __temp = document.createElement('li');
                __temp.className = '';
                __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'>" +
                    (deactivatable.toString() === 'true' ? "<input id='ColorCheckBox_" + key + "' type='checkbox' " +
                        (GM_getValue(key, myDefault).toString() !== deactiveDefault.toString() ? "checked='checked'" : "") +
                        ">" : "") +
                    " <input id='Setting_" + key + "' name='Setting_" + key + "' type='color' value='" + (GM_getValue(key, myDefault).toString() === deactiveDefault.toString() ? (myDefault.toString() === deactiveDefault.toString() ? '#000000' : myDefault) : GM_getValue(key, myDefault)) + "'>" +
                    " <button type='button'>Reset</button> <label for='Setting_" + key + "'>" + description + "</label></span>";
                __temp.addEventListener('change', function (e) {
                    var a = e.target;
                    if (a.type === "checkbox") { a.checked === false ? GM_setValue(key, deactiveDefault) : GM_setValue(key, document.getElementById('Setting_' + key).value) }
                    else if (a.type === "color") { GM_setValue(key, a.value); document.getElementById('ColorCheckBox_' + key).checked = true; }
                });
                __temp.addEventListener('click', function (e) {
                    var a = e.target;
                    if (a.type === "button") {
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

            function addTextSetting(key, name, description, myDefault, maxLength) {

                var __temp = document.createElement('li');
                __temp.className = '';
                __temp.innerHTML = "<span class='ue_left strong'>" + name + "</span><span class='ue_right'><input id='Setting_" + key + "' name='Setting_" + key + "' type='text' maxlength='" + maxLength + "' value='" + GM_getValue(key, myDefault) + "'> <label for='Setting_" + key + "'>" + description + "</label></span>";
                __temp.addEventListener('keyup', function (e) {
                    var a = e.target;
                    if (a.type === "text") { GM_setValue(key, a.value); }
                });
                document.getElementById('pose_list').appendChild(__temp);

            }


            document.getElementById('pose_list').appendChild(document.createElement('hr'));
            addBooleanSetting('ABTorrentsShowYen', 'Show Yen generation', 'Show Yen generation for torrents, with detailed information when hovered.', 'true', 'false', 'true');
            addSelectSetting('ABTorrentsYenTimeFrame', 'Yen generation time frame', 'The amount of generated Yen per selected time frame.', '1', [["1", "Hour"], ["24", "Day"], ["168", "Week"]]);
            addBooleanSetting('ABTorrentsReqTime', 'Show required seeding time', 'Shows minimal required seeding time for torrents in their description and when size is hovered.', 'true', 'false', 'true');
            addBooleanSetting('ABTorrentsFilter', 'Filter torrents', 'Shows a box above torrent tables, where you can filter the torrents from that table.', 'true', 'false', 'true');
            addBooleanSetting('ABSortTorrents', 'Sort torrents', 'Allows torrent tables to be sorted.', 'true', 'false', 'true');
            addBooleanSetting('ABHistDynLoad', 'Dynamic history tables', 'Dynamically load more pages into transfer history tables.', 'true', 'false', 'true');
            document.getElementById('pose_list').appendChild(document.createElement('hr'));
            addBooleanSetting('ABForumSearchWorkInFS', 'Load posts into search results', 'Allows you to load posts and threads into search results, slide through posts and filter for authors.', 'true', 'false', 'true');
            addColorSetting('ABForumSearchHighlightBG', 'Color for search terms', 'Background color for search terms within posts and headers.', '#FFC000', 'true', 'none');
            addColorSetting('ABForumSearchHighlightFG', 'Color for search terms', 'Text color for search terms within posts and headers.', '#000000', 'true', 'none');
            addBooleanSetting('ABForumEnhWorkInRest', 'Load posts into forum view', 'Allows you to load posts and threads into the general forum view.', 'true', 'false', 'false');
            addTextSetting('ABForumLoadText', 'Text for links to be loaded', 'The text to be shown for forum links that have not been loaded yet.', '(Load)', '10');
            addTextSetting('ABForumLoadingText', 'Text for loading links', 'The text to be shown for forum links that are currently being loaded.', '(Loading)', '10');
            addTextSetting('ABForumToggleText', 'Text for loaded links', 'The text to be shown for forum links that have been loaded and can now be toggled.', '(Toggle)', '10');

        }).call(this);
    }
})();