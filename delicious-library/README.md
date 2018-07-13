# Delicious Userscript Library

A library for userscripts on AnimeBytes which implements a settings page,
among other things.

You can use this library from a userscript by adding 
```
// @require https://github.com/momentary0/AB-Userscripts/raw/master/delicious-library/src/ab_delicious_library.js
```
to your header.

## Settings

Contains everything related to generating, displaying, and storing and
retrieving settings for userscripts.

### Overview

By default, the library creates and manages one tab (Userscript Settings) within your profile settings. At the top is a basic section for checkboxes, for scripts which only need an on/off setting. Underneath these are individual sections for larger userscripts needing more complex settings.

All these settings are saved when clicking the "Save Profile" button.

### Get and Set Settings

There are 3 functions relating to storing and retrieving settings within code.

 - `delicious.settings.init(key, defaultValue)` — If `key` is not set to any value, sets it to `defaultValue`. Otherwise, does nothing. This is intended to set default values for settings, avoiding the need to specify a default whenever the setting is retrieved via `settings.get` or `GM_getValue`.
 - `delicious.settings.get(key, defaultValue)` — If `key` is set, returns its value. Otherwise, returns `defaultValue`. 
 - `delicious.settings.set(key, value)` — Sets `key` to `value`. 
 
 > **Note.** Internally, GM_setValue/GM_getValue are used but values are JSON encoded so types are preserved. For example,
 > ```js
 > delicious.settings.set('Test', true);
 > delicious.settings.get('Test'); // Returns boolean true, not the string true.
 > delicious.settings.set('Test2', {key: [1, 2, 3]});
 > delicious.settings.get('Test2'); // Returns {key: [1, 2, 3]}.
 > ```

### Basic Usage

The simplest setting is a single on/off checkbox. For example,
```js
var enabled = delicious.settings.basicScriptCheckbox(
    'SettingKey',
    'Script Title',
    'A short description of your script'
);
if (!enabled) 
    return;
    
// Rest of userscript...
```
This will create and insert a checkbox into the basic section. `basicScriptCheckbox()` returns the value of `SettingKey`, so if the checkbox is disabled, it wont run the rest of the script.

> **Note.** This basic section is sorted alphabetically. This means there is no guarantee that two settings will be adjacent to each other. If you have two or more related settings, it is recommended to use a separate section (see below). 

### Custom Script Sections

If your userscript has more than one setting, I recommend you create a section to keep everything tidy and grouped. To do this, you have a few options:

 - `addScriptSection()` will create, insert and return a section element. Additionally, it can insert an "Enable/Disable" checkbox as the first setting in this section (use `checkbox: true` in `options`). 
 - `createScriptSection()` will create and return a section element. You will need to insert it into the page with `insertSection()`.
 
 
In both cases, the function returns a HTMLElement. To add settings, use any of the `settings.create*` functions, then append that element. For example, to add a text box,
```js
var section = delicious.settings.createSection('Foo Script'); // Create a setting section.

section.appendChild(delicious.settings.createTextSetting('FooText', 'Text for foo', 'Enter some text to be fooed');
// Add more settings if needed...

delicious.settings.insertSection(section); // Insert onto the settings page.
```

### Custom Save Handlers

### Custom Settings Pages

## Utilities

### `toggleSubnav`

### `applyDefaults`

### `htmlEscape`

### `parseBytes` / `formatBytes`

### `toDataAttr`
