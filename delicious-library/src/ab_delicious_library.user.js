// ==UserScript==
// @name        AB Delicious Userscript Library
// @namespace   TheFallingMan
// @version     0.0.1
// @description Provides useful functions for AnimeBytes userscripts.
// @author      TheFallingMan
// @icon        https://animebytes.tv/favicon.ico
// @include     https://animebytes.tv/*
// @license     GPL-3.0
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

/* eslint-disable-next-line no-unused-vars */
var delicious = (function ABDeliciousLibrary(){

    function newElement(tagName, properties, children) {
        var elem = document.createElement(tagName);
        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                elem[key] = properties[key];
            }
        }
        if (children) {
            for (var i = 0; i < children.length; i++) {
                if (typeof children[i] === 'string') {
                    elem.appendChild(document.createTextNode(children[i]));
                } else {
                    elem.appendChild(children[i]);
                }
            }
        }
        return elem;
    }


    function log(message) {
        if (typeof message === 'string')
            message = '[Delicious] ' + message;
        console.debug(message);
    }

    var settings = {};

    settings.isSettingsPage = window.location.href.indexOf('/user.php?action=edit') !== -1;
    log('Is settings page: ' +settings.isSettingsPage);

    settings.createSettingsPage = function() {
        log('Creating settings page...');
        var settingsDiv = document.createElement('div');
        settingsDiv.id = 'delicious_settings';

        var header = document.createElement('div');
        header.className = 'head colhead_dark strong';
        header.textContent = 'Userscript Settings';
        settingsDiv.appendChild(header);

        var settingsList = document.createElement('ul');
        settingsList.className = 'nobullet ue_list';

        var simpleSection = document.createElement('div');
        simpleSection.id = 'delicious_basic_settings';
        settingsList.appendChild(simpleSection);

        settingsDiv.appendChild(settingsList);

        return settingsDiv;
    };

    /**
     *
     * @param {MouseEvent} ev
     */
    settings._tabLinkClick = function(ev) {
        log('Clicked tab link: ' + ev.target.textContent);
        document.querySelector('.ue_tabs .selected').classList.remove('selected');
        var tabs = document.querySelectorAll('#tabs > div');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].style.display = 'none';
        }
        var settingsPage = document.querySelector(ev.target.getAttribute('href'));
        settingsPage.style.display = 'block';

        ev.target.classList.add('selected');
        ev.stopPropagation();
        ev.preventDefault();
        return false;
    };

    settings._relinkClickHandlers = function() {
        log('Rebinding tab click handlers...');
        var tabLinks = document.querySelectorAll('.ue_tabs a');
        for (var i = 0; i < tabLinks.length; i++) {
            tabLinks[i].addEventListener('click', settings._tabLinkClick);
        }
    };

    settings._insertSettingsPage = function() {
        log('Inserting settings page...');
        var linkItem = document.createElement('li');
        linkItem.appendChild(document.createTextNode('•'));

        var link = document.createElement('a');
        link.href = '#delicious_settings';
        link.textContent = 'Userscript Settings';
        linkItem.appendChild(link);

        document.querySelector('.ue_tabs').appendChild(linkItem);
        settings._relinkClickHandlers();

        var page = settings.createSettingsPage();
        page.style.display = 'none';
        var tabs = document.querySelector('#tabs');

        tabs.insertBefore(page, tabs.lastElementChild);

        var userform = document.querySelector('form#userform');

        userform.addEventListener('submit', settings.saveAllSettings);

        userform.dataset['onsubmit'] = userform.getAttribute('onsubmit');
        userform.removeAttribute('onsubmit');
        log('Previous onsubmit: ' + userform.dataset['onsubmit']);
    };

    settings._settingsInserted = !settings.isSettingsPage;

    settings._ensureSettingsInserted = function() {
        if (!settings.isSettingsPage) {
            if (!settings.rootSettingsList) {
                settings.basicSettingsDiv = newElement('div',
                    {id: 'delicious_basic_settings',
                        className: 'dummy_element'});
                settings.rootSettingsList = newElement('ul', {className: 'nobullet ue_list'}, [
                    settings.basicSettingsDiv
                ]);
            }
            return false;
        }

        if (!settings._settingsInserted) {
            log('Settings not yet inserted; inserting...');
            settings._settingsInserted = true;

            settings._insertSettingsPage();
            settings.rootSettingsList = document.querySelector('#delicious_settings .ue_list');
            settings.basicSettingsDiv = settings.rootSettingsList.querySelector('#delicious_basic_settings');
        }
        return true;
    };

    settings.saveAllSettings = function(ev) {
        log('Saving all settings...');
        var cancelled = false;
        var settingsItems = settings.rootSettingsList.querySelectorAll('[data-delicious-key]');
        for (var i = 0; i < settingsItems.length; i++) {
            log('Sending save event for setting key: ' + settingsItems[i].dataset['deliciousKey']);
            var subevent = new Event('delicioussave', {
                cancelable: true,
            });
            if (!settingsItems[i].dispatchEvent(subevent)) {
                cancelled = true;
            }
        }
        log('Form submit cancelled: ' + cancelled);
        if (cancelled) {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        } else {
            ev.target.removeEventListener('submit', settings.saveAllSettings);
            ev.target.setAttribute('onsubmit', ev.target.dataset['onsubmit']);
            ev.target.submit();
        }
    };

    settings.saveOneElement = function(element, property) {
        if (element.dataset['deliciousKey'])
            settings.set(element.dataset['deliciousKey'], element[property]);
        else
            log('Skipping blank: ' + element.outerHTML);
    };

    settings.set = function(key, value) {
        /* eslint-disable-next-line no-undef */
        GM_setValue(key, JSON.stringify(value));
    };

    settings.get = function(key, defaultValue) {
        /* eslint-disable-next-line no-undef */
        var value = GM_getValue(key, undefined);
        if (value !== undefined) {
            return JSON.parse(value);
        } else {
            return defaultValue;
        }
    };

    settings.getExisting = function(key) {
        return document.getElementById(key);
    };

    settings.addScriptCheckbox = function(key, label, description, options) {
        var existing = settings.getExisting(key);
        if (existing)
            return existing;

        var checkboxLI = settings.createCheckbox(
            key, label, description, options);
        checkboxLI.id = key;
        settings.basicSettingsDiv.appendChild(checkboxLI);

        return checkboxLI;
    };

    settings.createCheckbox = function(key, label, description, options) {
        if (options === undefined)
            options = {};
        var input = newElement('input', {type: 'checkbox'});
        input.dataset['deliciousKey'] = key;

        var defaultValue = options['default'];
        if (defaultValue === undefined) defaultValue = true;
        if (settings.get(key, defaultValue)) input.setAttribute('checked', 'checked');

        if (options['onsave'] !== null) {
            var saveHandler = options['onsave'] || function(ev) {
                settings.saveOneElement(ev.target, 'checked');
            };
            input.addEventListener('delicioussave', saveHandler);
        }

        var li = newElement('li', {}, [
            newElement('span', {className: 'ue_left strong', innerHTML: label}),
            newElement('span', {className: 'ue_right'}, [
                input,
                ' ',
                newElement('label', {innerHTML: description}),
            ]),
        ]);

        return li;
    };

    settings.createSection = function(title) {
        var heading = newElement('h3', {innerHTML: title});
        heading.style.marginTop = '5px';
        var section = newElement('div', {}, [
            newElement('li', {}, [heading])
        ]);
        return section;
    };

    settings.addScriptSection = function(key, title, description, options) {
        var existing = settings.getExisting(key);
        if (existing)
            return existing;

        var section = settings.createSection(title);
        section.id = key;

        var enableBox = settings.createCheckbox(key, 'Enabled', description, options);
        enableBox.style.marginTop = '10px';
        section.appendChild(enableBox);

        settings.rootSettingsList.appendChild(section);
        return section;
    };

    settings.createTextField = function(key, label, description, options) {
        options = options || {};
        var input = newElement('input', {
            type: 'text',
            size: options['width'] || 50,
        });
        input.value = settings.get(key, options['default'] || '');
        input.dataset['deliciousKey'] = key;

        var li = newElement('li', {}, [
            newElement('span', {className: 'ue_left strong', innerHTML: label}),
            newElement('span', {className: 'ue_right'}, [
                input,
                options['lineBreak'] ? newElement('br') : ' ',
                newElement('span', {innerHTML: description})
            ])
        ]);

        if (options['onsave'] !== null) {
            var saveHandler = options['onsave'] || function(ev) {
                settings.saveOneElement(ev.target, 'value');
            };
            input.addEventListener('delicioussave', saveHandler);
        }

        return li;
    };

    settings.showErrorBox = function(message) {
        var errorDiv = newElement('div', {
            className: 'error_message',
            innerHTML: message
        });
        var thinDiv = document.querySelector('div.thin');
        thinDiv.parentNode.insertBefore(errorDiv, thinDiv);
        return errorDiv;
    };


    settings._ensureSettingsInserted();

    settings.addScriptCheckbox('ABQuickLinks', 'Quick Links', 'Adds quick links to the main navbar.');
    settings.addScriptCheckbox('ABQuickLinks2', 'Quick Links 2.0', 'Adds quick links to the main navbar.');

    var s = settings.addScriptSection('ABDynamicStylesheets', 'Dynamic Stylesheets', 'Automatically changes stylesheets.');

    s.appendChild(settings.createCheckbox('TEST', 'The label', 'Does things'));

    var c = settings.createCheckbox('', 'Error test', 'Will throw an error if ticked', {
        onsave: function(ev) {
            if (ev.target.checked) {
                settings.showErrorBox('Error thrown.');
                ev.preventDefault();
            }
        }
    });
    settings.basicSettingsDiv.appendChild(c);
    settings.basicSettingsDiv.appendChild(
        settings.createTextField('ABTestText', 'Text field', 'description', {
            default: 1234,
            lineBreak: false,
        })
    );

    var util = {
        toggleSubnav: function(ev) {
            var subnav = ev.currentTarget.parentNode.children[1];
            var willShow = (subnav.style.display==='none');
            subnav.style.display = willShow?'block':'none';
            if (willShow)
                subnav.parentNode.classList.add('selected');
            else
                subnav.parentNode.classList.remove('selected');
            ev.stopPropagation();
            ev.preventDefault();
            return false;
        }
    };

    return {
        settings: settings,
        util: util
    };
})();