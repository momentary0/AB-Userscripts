// ==UserScript==
// @name        AB - Hide treats
// @author      Alpha
// @description Hide treats on profile.
// @include     https://animebytes.tv/*
// @version     0.1
// @icon        http://animebytes.tv/favicon.ico
// @require     https://raw.githubusercontent.com/momentary0/AB-Userscripts/delicious-settings/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

// Hide treats by Alpha
// Hide treats on profile.
(function ABHideTreats(){
    var _enabled = delicious.settings.basicScriptCheckbox(
        'delicioustreats',
        'Disgusting Treats',
        'Hide those hideous treats on profile pages!'
    );
    if (!_enabled)
        return;

    var treatsnode = document.evaluate('//*[@id="user_leftcol"]/div[@class="box" and div[@class="head" and .="Treats"]]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (treatsnode) treatsnode.style.display = "none";
})();