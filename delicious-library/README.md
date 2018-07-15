# Delicious Userscript Library

A library for userscripts on AnimeBytes which implements a settings page,
among other things.

You can use this library from a userscript by adding
```
// @grant   GM_setValue
// @grant   GM_getValue
// @require https://github.com/momentary0/AB-Userscripts/raw/master/delicious-library/src/ab_delicious_library.js
```
to your header.

### Example Usage

 - [Hide Treats](../delicious-userscripts/src/ab_hide_treats.user.js) — Most basic checkbox.
 - [FL Pool Status](../delicious-userscripts/src/ab_fl_status.user.js) — Script section containing drop down and fieldset.
 - [Forum Search Enhancements](../delicious-userscripts/src/ab_forum_search_enhancement.user.js) — Script section containing checkbox, text and colour settings.
 - [Quick Links](../quick-links/src/ab_quick_links.user.js) — Script section with multi-row setting.

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

### Ensure Settings Inserted

**Important.** Wrap all settings page related activity inside `settings.ensureSettingsInserted`.
This checks the URL is a profile settings page, and ensure the settings page is inserted and valid.
For example,
```js
delicious.settings.init('Key', true);
if (delicious.settings.ensureSettingsInserted()) {
    var section = delicious.settings.createSection('Script Section');
    // Do whatever...
    delicious.settings.insertSection(section);
}
// Rest of script.
```
This is not required for merely accessing/storing values (`get`, `set`, etc.). Also,
this is not needed for `basicScriptCheckbox`, as it does this automatically.


### Custom Script Sections

If your userscript has more than one setting, I recommend you create a section to keep everything tidy and grouped. To do this, you have a few options:

 - `addScriptSection()` will create, insert and return a section element. Additionally, it can insert an "Enable/Disable" checkbox as the first setting in this section (use `checkbox: true` in `options`).
 - `createSection()` will create and return a section element. You will need to insert it into the page with `insertSection()`.


In both cases, the function returns a HTMLElement. To add settings, use any of the `settings.create*` functions, then append that element. For example, to add a text box,
```js
var section = delicious.settings.createSection('Foo Script'); // Create a setting section.

section.appendChild(delicious.settings.createTextSetting('FooText', 'Text for foo', 'Enter some text to be fooed');
// Add more settings if needed...

delicious.settings.insertSection(section); // Insert onto the settings page.
```

### Available Settings

### `settings.add*`

In general, the `settings.add*` functions create and insert a setting element for you. `settings.create*` return settings elements which you need to insert somewhere. `settings.insert*` inserts a given setting element.

The following `add` functions are available (see source code for more details, and the delicious bundle for examples):

 - `addBasicCheckbox(key, label, description, options)` — Creates and inserts a checkbox to the basic section.

### `settings.insert*`

The following `insert` functions are available:

 - `insertBasicSetting(setting)` — Inserts `setting` into the basic section.

 - `insertSection(section)` — Inserts `section`, a HTML element containing a script section, into the settings page.

 - `insertSettingsPage(label, settingsPage)` — Inserts `settingsPage` onto the user settings page, with `label` as the tab bar label. This shouldn't be needed for most scripts.

### `settings.create*`

> **Note.** Specifying a default when creating a setting _does not_ store that
> value into the setting until "Save Profile" is clicked.
> This results in the following behaviour:
> ```js
> settings.createTextSetting('TextSetting', 'Text', 'Some text',
>     {default: "Default Value"});
> settings.get('TextSetting'); // Returns undefined.
> ```
> You can either specify a default when calling `settings.get` or use
> `settings.init` (see above) to store the default. If you use `settings.init`,
> specifying the default when creating the setting would be unnecessary.
> ```js
> settings.init('TextSetting', 'Default Value');
> // Text setting will still have "Default Value" as default.
> settings.createTextSetting('TextSetting', 'Text', 'Some text');
> settings.get('TextSetting'); // Returns "Default Value".
> ```

The following `create` functions are provided. `key` is the setting key to store in, `label` is the label in the left column, `description` is placed on the right side near the input element. A default can be specified with `{default: ...}` as `options`. The given default value must match the setting's format. Some `options` properties are mentioned, see source code for more.

In all cases, you will need to insert the returned setting element onto the page yourself.

 - `createCheckbox(key, label, description, options)` - Creates a checkbox setting.

 - `createSection(title)` — Creates and returns a setting section with the given title as a heading.
 Use `appendChild` on the returned section to add setting elements.

 - `createTextSetting(key, label, description, options)` — Creates a text box setting.
 - `createDropDown(key, label, description, valuesArray, options)` — Creates a drop-down setting. `valuesArray` is an array of 2-tuples which are `[label, value]` (both should be strings). `label` will be shown in the dropdown. When that option is selected, its corresponding `value` will be stored. If given, the default property should be a `value`.
 - `createNumberInput(key, label, description, options)` — Creats a numeric setting. Value will be stored as a number (empty inputs will be stored as null). Within options, `allowDecimal` (default true) and `allowNegative` (default false) work as expected, `required` (default false) is whether input must be non-empty.
 - `createFieldSetSetting(key, label, fields, description, options)` — Creates a field set setting (essentially a row of many checkboxes). Value is stored in `key` as an object with boolean properties. `default` should be a similar object.
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

- `createRowSetting(key, label, columns, description, options)` —  Creates a multi-row setting. That is, a setting with certain columns and a variable number of rows. `columns` is an array of 3-tuples of `[column label, subkey, type]` (all strings, type should be `text` or `number`). Value (and `options.default`) is stored as an array of objects. Each object represents one row, with the specified subkeys as properties and the cell value as property values. In `options`,

    - `allowSort` (default true) allows reordering rows with provided buttons,
    - `allowDelete` (default true) allows deleting rows,
    - `allowNew` (default true) allows creating new rows, and
    - `newButtonText` (default `+`) is the text on the add row button.

   You can require a certain number of rows by specifying an appropriate default and disabling new and delete.

- `createColourSetting(key, label, description, options)` — Creates a colour input, with optional checkbox to enable/disable the whole setting and a reset to default button. Value is stored as a hex string `#rrggbb`, or null if checkbox is unchecked. In `options`,

    - `checkbox` (default true) displays the checkbox, and
    - `resetButton` (default true) displays the reset button.

Also,

 - `showErrorMessage(message, errorId)` — Shows an error message in a friendly red box near the top of the page. `errorId` should be a  string identifying the type of error, used to remove previous errors of the same type before displaying the new error.

### Custom Save Handlers

On clicking the "Save Profile" button, a `deliciousSave` event is sent to all
elements with a `data-setting-key` attribute. The attached event handler is
responsible for storing the setting value.

If, for whatever reason, the setting cannot be saved, the event handler can
call `event.preventDefault()` which will prevent the form from being submitted.
`settings.showErrorMessage` is provided to display an error message.

### Custom Settings Pages

It is possible to create and use a completely new settings page. Refer to:

 - `settings._createDeliciousPage` — Creates the delicious settings page, with required structure and sections.
 - `settings._insertDeliciousSettings` — Creates and inserts the delicious settings page, attaching event handlers.
 - `settings.insertSettingsPage` — Inserts a setting page into the user profile settings.

## Utilities

Various utility functions related to AnimeBytes.

 - `toggleSubnav(ev)` — Event handler to be attached to the little drop-down triangles.
 Toggles displaying the adjacent menu.

 - `applyDefaults(options, defaults)` — Accepts two objects with properties. Returns an
 objetc combining the two, using values from `options` if present, `default` otherwise.
 Essentially used to define defaults on parameters specified as objects.

 - `htmlEscape(text)` — Returns `text` escaped for HTML (e.g. `&` is replaced with `&amp;`).

 - `parseBytes(bytesString)` — Accepts `bytesString`, a string containing a
 number and a bytes unit. Returns the number of bytes. **Note:** Unit must use
 IEC prefixes (KiB, GiB, etc.).

 - `formatBytes(numBytes, decimals)` — Formats a number of bytes as a string
 with an appropriate unit, to a certain number of decimal places.

 - `toDataAttr(str)` — Given an `element.dataset` property name in camelCase,
 returns the corresponding `data-` attribute name with hyphens.
