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

/* global GM_setValue:false, GM_getValue:false */

/* eslint-disable-next-line no-unused-vars */
var delicious = (function ABDeliciousLibrary(){
    "use strict";

    function newElement(tagName, properties, children) {
        var elem = document.createElement(tagName);
        if (properties) {
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    elem[key] = properties[key];
                }
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
        console.debug(
            typeof message === 'string' ? ('[Delicious] '+message) : message
        );
    }

    var utilities = {
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
        },

        applyDefaults: function(options, defaults) {
            if (!options)
                return defaults;
            var newObject = {};
            for (var key in defaults) {
                if (defaults.hasOwnProperty(key)) {
                    if (options.hasOwnProperty(key))
                        newObject[key] = options[key];
                    else
                        newObject[key] = defaults[key];
                }
            }
            return newObject;
        },

        htmlEscape: function(text) {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        _bytes_units: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'],
        _bytes_base: 1024,
        nbsp: '\xa0',

        parseBytes: function(bytesString) {
            var split = bytesString.split(/\s+/);
            var significand = parseFloat(split[0]);
            var magnitude = this._bytes_units.indexOf(split[1]);
            if (magnitude === -1)
                throw 'Bytes unit not recognised. Make sure you are using KiB, MiB, or similar.';
            return significand * Math.pow(this._bytes_base, magnitude);
        },

        // Adapted from https://stackoverflow.com/a/18650828
        formatBytes: function(numBytes, decimals) {
            if (numBytes === 0) return '0 ' + this._bytes_units[0];
            var magnitude = Math.floor(Math.log(numBytes) / Math.log(this._bytes_base));
            // Extra parseFloat is so trailing 0's are removed.
            return parseFloat(
                (numBytes / Math.pow(this._bytes_base, magnitude)).toFixed(decimals)
            ) + ' ' + this._bytes_units[magnitude];
        }
    };


    var _isSettingsPage = window.location.href.indexOf('/user.php?action=edit') !== -1;

    var settings = {
        isSettingsPage: _isSettingsPage,

        createSettingsPage: function() {
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
        },

        /**
         *
         * @param {MouseEvent} ev
         */
        _tabLinkClick: function(ev) {
            log('Clicked tab link: ' + ev.target.textContent);
            var clickedId = ev.target.getAttribute('href').replace(/^#/, '');
            document.querySelector('.ue_tabs .selected').classList.remove('selected');
            var tabs = document.querySelectorAll('#tabs > div');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].style.display = (tabs[i].id === clickedId)?'block':'none';
            }

            ev.target.classList.add('selected');
            ev.stopPropagation();
            ev.preventDefault();
            return false;
        },

        _relinkClickHandlers: function() {
            log('Rebinding tab click handlers...');
            var tabLinks = document.querySelectorAll('.ue_tabs a');
            for (var i = 0; i < tabLinks.length; i++) {
                tabLinks[i].addEventListener('click', this._tabLinkClick);
            }
        },

        _insertSettingsPage: function() {
            log('Inserting settings page...');
            var linkItem = document.createElement('li');
            linkItem.appendChild(document.createTextNode('•'));

            var link = document.createElement('a');
            link.href = '#delicious_settings';
            link.textContent = 'Userscript Settings';
            linkItem.appendChild(link);

            document.querySelector('.ue_tabs').appendChild(linkItem);
            this._relinkClickHandlers();

            var page = this.createSettingsPage();
            page.style.display = 'none';
            var tabs = document.querySelector('#tabs');

            tabs.insertBefore(page, tabs.lastElementChild);

            var userform = document.querySelector('form#userform');

            userform.addEventListener('submit', this.saveAllSettings);

            userform.dataset['onsubmit'] = userform.getAttribute('onsubmit');
            userform.removeAttribute('onsubmit');
            log('Previous onsubmit: ' + userform.dataset['onsubmit']);
        },

        _settingsInserted: !!document.getElementById('delicious_settings'),

        ensureSettingsInserted: function() {
            if (!this.isSettingsPage) {
                if (!this.rootSettingsList) {
                    this._basicSection = newElement('div',
                        {id: 'delicious_basic_settings',
                            className: 'dummy'});
                    this.rootSettingsList = newElement('ul',
                        {className: 'dummy nobullet ue_list'},
                        [this._basicSection]);
                }
                return false;
            }

            if (!this._settingsInserted) {
                log('Settings not yet inserted; inserting...');
                this._settingsInserted = true;

                this._insertSettingsPage();
            }
            if (!this.rootSettingsList) {
                this.rootSettingsList = document.querySelector('#delicious_settings .ue_list');
                this._basicSection = this.rootSettingsList.querySelector('#delicious_basic_settings');
            }
            return true;
        },

        saveAllSettings: function(ev) {
            log('Saving all settings...');
            var cancelled = false;
            var settingsItems = ev.target.querySelectorAll('[data-settings-key]');
            for (var i = 0; i < settingsItems.length; i++) {
                log('Sending save event for setting key: ' + settingsItems[i].dataset['settingsKey']);
                var subevent = new Event('saveEvent', {
                    cancelable: true,
                });
                if (!settingsItems[i].dispatchEvent(subevent)) {
                    cancelled = true;
                }
            }
            log('Form submit cancelled: ' + cancelled);
            if (cancelled) {
                var errorBox = document.querySelector('.error_message');
                if (errorBox)
                    errorBox.scrollIntoView();
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            } else {
                ev.target.removeEventListener('submit', settings.saveAllSettings);
                ev.target.setAttribute('onsubmit', ev.target.dataset['onsubmit']);
                ev.target.submit();
            }
        },

        saveOneElement: function(element, property) {
            if (element.dataset['settingsKey'])
                this.set(element.dataset['settingsKey'], element[property]);
            else
                log('Skipping blank: ' + element.outerHTML);
        },

        init: function(key, defaultValue) {
            if (GM_getValue(key, undefined) === undefined) {
                this.set(defaultValue);
            }
        },

        set: function(key, value) {
            GM_setValue(key, JSON.stringify(value));
        },

        get: function(key, defaultValue) {
            var value = GM_getValue(key, undefined);
            if (value !== undefined) {
                return JSON.parse(value);
            } else {
                return defaultValue;
            }
        },

        _insertSorted: function(newText, newElement, rootElement, skipFirst) {
            var current = rootElement.firstElementChild;
            if (skipFirst)
                current = current.nextElementSibling;
            while (current && (current.firstElementChild.textContent < newText)) {
                current = current.nextElementSibling;
            }
            if (current) {
                rootElement.insertBefore(newElement, current);
            } else {
                rootElement.appendChild(newElement);
            }
        },

        addScriptCheckbox: function(key, label, description, options) {
            var checkboxLI = this.createCheckbox(
                key, label, description, options);
            //this._basicSection.appendChild(checkboxLI);
            this.addBasicSetting(checkboxLI);
            return checkboxLI;
        },

        addBasicSetting: function(setting) {
            this._insertSorted(setting.textContent,
                setting, this._basicSection);
        },

        addScriptSection: function(key, title, description, options) {
            var section = this.createSection(title);

            var enableBox = this.createCheckbox(key, 'Enable/Disable', description, options);
            enableBox.style.marginTop = '10px';
            section.appendChild(enableBox);

            this._insertSorted(title.textContent || title, section, this.rootSettingsList, true);
            return section;
        },

        _createSettingLI: function(label, rightElements) {
            return newElement('li', {}, [
                newElement('span', {className: 'ue_left strong'}, [label]),
                newElement('span', {className: 'ue_right'}, rightElements),
            ]);
        },

        createCheckbox: function(key, label, description, options) {
            options = utilities.applyDefaults(options, {
                default: true,
                onSave: function(ev) {
                    settings.saveOneElement(ev.target, 'checked');
                }
            });

            var checkbox = newElement('input', {type: 'checkbox'});
            checkbox.dataset['settingsKey'] = key;

            var currentValue = options['default'];
            if (this.get(key, currentValue))
                checkbox.setAttribute('checked', 'checked');

            if (options['onSave'] !== null) {
                checkbox.addEventListener('saveEvent', options['onSave']);
            }

            var li = this._createSettingLI(label, [
                checkbox,
                ' ',
                newElement('label', {}, [description]),
            ]);

            return li;
        },

        createSection: function(title) {
            var heading = newElement('h3', {}, [title]);
            var section = newElement('div', {className: 'delicious_settings_section'}, [
                newElement('li', {}, [heading])
            ]);
            section.style.marginTop = '25px';
            return section;
        },

        createTextField: function(key, label, description, options) {
            options = utilities.applyDefaults(options, {
                width: 50,
                lineBreak: false,
                default: '',
                onSave: function(ev) {
                    settings.saveOneElement(ev.target, 'value');
                }
            });

            var inputElem = newElement('input', {
                type: 'text',
                size: options['width']
            });
            inputElem.value = this.get(key, options['default']);
            inputElem.dataset['settingsKey'] = key;

            var li = this._createSettingLI(label, [
                inputElem,
                (options['lineBreak'] && description) ? newElement('br') : ' ',
                description
            ]);

            if (options['onSave'] !== null) {
                inputElem.addEventListener('saveEvent', options['onSave']);
            }

            return li;
        },

        createDropDown: function(key, label, description, valuesArray, options) {
            options = utilities.applyDefaults(options, {
                lineBreak: false,
                default: null,
                onSave: function(ev) {
                    settings.saveOneElement(ev.target, 'value');
                }
            });

            var select = newElement('select');
            select.dataset['settingsKey'] = key;


            var currentValue = null;
            if (options['default'] !== null)
                currentValue = this.get(key, options['default']);

            for (var i = 0; i < valuesArray .length; i++) {
                var newOption = newElement('option', {
                    value: valuesArray[i][1],
                    textContent: valuesArray[i][0]
                });
                if (valuesArray[i][1] === currentValue)
                    newOption.setAttribute('selected', 'selected');
                select.appendChild(newOption);
            }

            var li = this._createSettingLI(label, [
                select,
                (options['lineBreak'] && description) ? newElement('br') : ' ',
                description
            ]);

            if (options['onSave'] !== null) {
                select.addEventListener('saveEvent', options['onSave']);
            }

            return li;
        },

        createNumberInput: function(key, label, description, options) {
            options = utilities.applyDefaults(options, {
                lineBreak: false,
                default: '',
                onSave: function(ev) {
                    settings.set(key, parseFloat(ev.target.value));
                }
            });

            var input = newElement('input');
            input.dataset['settingsKey'] = key;
            input.type = 'number';
            input.value = this.get(key, options['default']);

            var li = this._createSettingLI(label, [
                input,
                (options['lineBreak'] && description) ? newElement('br') : ' ',
                description
            ]);

            if (options['onSave'] !== null) {
                input.addEventListener('saveEvent', options['onSave']);
            }

            return li;
        },



        showErrorMessage: function(message, errorId) {
            var errorDiv = newElement('div', {className: 'error_message'},
                [message]);
            if (errorId) {
                errorDiv.dataset['errorId'] = errorId;
                var existing = document.querySelector('[data-error-id="'+errorId+'"');
                if (existing)
                    existing.parentNode.removeChild(existing);
            }
            var thinDiv = document.querySelector('div.thin');
            thinDiv.parentNode.insertBefore(errorDiv, thinDiv);
            return errorDiv;
        },
    };


    settings.ensureSettingsInserted();

    settings.addScriptCheckbox('ABQuickLinks', 'Quick Links', 'Adds quick links to the main navbar.');
    settings.addScriptCheckbox('ABQuickLinks2', 'Quick Links 2.0', 'Adds quick links to the main navbar.');
    settings.addScriptCheckbox('ABQuickLinks3', 'AA Quick Links 2.0', 'Adds quick links to the main navbar.');
    settings.addScriptCheckbox('ABQuickLinks4', 'ZZ Quick Links 2.0', 'Adds quick links to the main navbar.');

    var s = settings.addScriptSection('ABDynamicStylesheets', 'Dynamic Stylesheets', 'Automatically changes stylesheets.');

    s.appendChild(settings.createCheckbox('TEST', 'The label', 'Does things'));

    var c = settings.createCheckbox('', 'Error test', 'Will throw an error if ticked', {
        onSave: function(ev) {
            if (ev.target.checked) {
                settings.showErrorMessage('Error thrown.', 'testId');
                ev.preventDefault();
            }
        }
    });
    settings.addBasicSetting(c);
    settings.addBasicSetting(
        settings.createTextField('ABTestText', 'Text field', 'description', {
            default: 1234,
            lineBreak: false,
        })
    );
    settings.addBasicSetting(
        settings.createDropDown('dropdownkey', 'A drop down', 'Drops down some things',
            [['Text', '1'], ['Value', '2'], ['This', '3']], {
                default: '2',
            })
    );
    settings.addBasicSetting(
        settings.createNumberInput('numberkey', 'An integer', 'Whole numbers!', {
        default: 2,
        lineBreak: true,
        })
    );

    settings.addScriptSection('ABDynamicStyleasheets', 'Adynamic Stylesheets', 'Automatically changes stylesheets.');

    return {
        settings: settings,
        utilities: utilities
    };
})();