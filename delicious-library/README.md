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

### Available Settings

In general, the `settings.add*` functions create and insert a setting element for you. `settings.create*` return settings elements which you need to insert somewhere. `settings.insert*` inserts a given setting element.

The following `add` functions are available (see source code for more details, and the delicious bundle for examples):

 - `addBasicCheckbox(key, label, description, options)` — Creates and inserts a checkbox to the basic section.
 
 - `addBasicSetting(setting)` — Inserts `setting` into the basic section.
 
The following `create` functions are provided. `key` is the setting key to store in, `label` is the label in the left column, `description` is placed on the right side near the input element. A default can be specified with `{default: ...}` as `options`. The givne default value must match the setting's format. Some `options` properties are mentioned, see source code for more.
 
 - `createCheckbox(key, label, description, options)` - Creates a checkbox setting.
 
 - `createSection(title)` --- Creates and returns a setting section with the given title as a heading.
 - `createTextSetting(key, label, description, options)` --- Creates a text box setting. 
 - `createDropDown(key, label, description, valuesArray, options)` --- Creates a drop-down setting. `valuesArray` is an array of 2-tuples which are `[label, value]` (both should be strings). `label` will be shown in the dropdown. When that option is selected, its corresponding `value` will be stored. If given, the default property should be a `value`.
 - `createNumberInput(key, label, description, options)` --- Creats a numeric setting. Value will be stored as a number (empty inputs will be stored as null). Within options, `allowDecimal` (default true) and `allowNegative` (default false) work as expected, `required` (default false) is whether input must be non-empty.
 - `createFieldSetSetting(key, label, fields, description, options)` --- Creates a field set setting (essentially a row of many checkboxes). Value is stored in `key` as an object with boolean properties. `default` should be a similar object.
 `fields` is an array of 2-tuples `[text, subkey]` (both strings). `text` is a short label for each checkbox, `subkey` is the property this checkbox is stored under. For example,
   ```js
   // Creates a setting with 2 checkboxes.
   delicious.settings.createFieldSetSetting('FLPoolLocations',
        'Freeleech status locations',
        [['Navbar', 'navbar'], ['User menu', 'usermenu']]);
   // Example stored value
   delicious.settings.get('FLPoolLocations') == {
        'navbar': true,
        'usermenu': false
   };
   ```
   
- `createRowSetting(key, label, columns, description, options)` ---  Creates a multi-row setting. That is, a setting with certain columns and a variable number of rows. `columns` is an array of 3-tuples of `[column label, subkey, type]` (all strings, type should be `text` or `number`). Value (and `options.default`) is stored as an array of objects. Each object represents one wor, with the specified subkeys as properties and the cell value as property values. In `options`, 
   
    - `allowSort` (default true) allows reordering rows with provided buttons, 
    - `allowDelete` (default true) allows deleting rows, 
    - `allowNew` (default true) allows creating new rows, and
    - `newButtonText` (default `+`) is the text on the add row button.
    
   You can require a certain number of rows by specifying an appropriate default and disabling new and delete.
  
- `createColourSetting(key, label, description, options)` --- Creates a colour input, with optional checkbox to enable/disable the whole setting and a reset to default button. Value is stored as a hex string `#rrggbb`, or null if checkbox is unchecked. In `options`,
    
    - `checkbox` (default true) displays the checkbox, and
    - `resetButton` (default true) displays the reset button.
    
Also,

 - `showErrorMessage(message, errorId)` --- Shows an error message in a friendly red box near the top of the page. `errorId` should be a  string identifying the type of error, used to remove previous errors of the same type before displaying the new error.

### Custom Save Handlers

### Custom Settings Pages

## Utilities

### `toggleSubnav`

### `applyDefaults`

### `htmlEscape`

### `parseBytes` / `formatBytes`

### `toDataAttr`
