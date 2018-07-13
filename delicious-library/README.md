# Delicious Userscript Library

A library for userscripts on AnimeBytes which implements a settings page,
among other things.

You can use this library from a userscript by adding 
```
// @require https://github.com/momentary0/AB-Userscripts/raw/master/delicious-library/src/ab_delicious_library.js
```
to your header.

## `delicious.settings`

Contains everything related to generating, displaying, and storing and
retrieving settings for userscripts.

### Overview

By default, the library creates and manages one tab (Userscript Settings) within your profile settings. At the top is a basic section for checkboxes, for scripts which only need an on/off setting. Underneath these are individual sections for larger userscripts needing more complex settings.

The library manages saving all these settings when clicking the "Save Profile" button.

### Basic Usage (`basicScriptCheckbox`)

The simplest setting is a single on/off checkbox. For example,
```js
var _enabled = delicious.settings.basicScriptCheckbox(
    'SettingKey',
    'Script Title',
    'A short description of your script'
);
if (!_enabled) 
    return;
    
// Rest of userscript...
```
This will create and insert a checkbox into the basic section. `basicScriptCheckbox()` returns the value of `SettingKey`, so if the checkbox is disabled, it wont run the rest of the script.
