// ==UserScript==
// @name        AB - Dynamic stylesheets
// @author      Megure
// @description Hide treats on profile.
// @include     https://animebytes.tv/*
// @version     0.1
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

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
        result.sort(function (a, b) { return a[0] - b[0]; });

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
        delete_button.addEventListener('click', function (e) {
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
        settings_xhr.onreadystatechange = function () {
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
        add_button.addEventListener('click', function (e) {
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