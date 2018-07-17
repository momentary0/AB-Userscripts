// ==UserScript==
// @name         AB Quick Links
// @namespace    TheFallingMan
// @version      0.1.0
// @description  Adds quick link dropdown to the main nav bar.
// @author       TheFallingMan
// @icon         https://animebytes.tv/favicon.ico
// @match        https://animebytes.tv/*
// @license      GPL-3.0
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://github.com/momentary0/AB-Userscripts/raw/master/delicious-library/src/ab_delicious_library.js
// ==/UserScript==

(function ABQuickLinks() {
    delicious.settings.init('ABQuickLinksEnabled', true);
    var defaultLinks = [
        {text: 'Image Upload', href: '/imageupload.php'},
        {text: 'Profile Settings', href: '/user.php?action=edit'},
    ];
    delicious.settings.init('ABQuickLinks', defaultLinks);

    if (delicious.settings.ensureSettingsInserted()) {
        var section = delicious.settings.createCollapsibleSection('Quick Links');
        var s = section.querySelector('.settings_section_body');
        s.appendChild(delicious.settings.createCheckbox(
            'ABQuickLinksEnabled',
            'Enable/Disable',
            'Adds dropdown quick links to the main nav bar.'
        ));
        s.appendChild(delicious.settings.createRowSetting(
            'ABQuickLinks',
            'Links',
            [['Label', 'text', 'text'], ['Link', 'href', 'text']],
            null,
            {newButtonText: '+ Add Link'}
        ));
        delicious.settings.insertSection(section);
    }

    var rootLI = document.createElement('li');
    rootLI.id = 'nav_quicklinks';
    rootLI.className = 'navmenu';
    // Above search boxes, but below user menu dropdown.
    rootLI.style.zIndex = 94;

    rootLI.innerHTML = '<a style="cursor:pointer;">Quick Links\
    <span class="dropit hover clickmenu"><span class="stext">▼</span></span></a>';
    rootLI.firstElementChild.addEventListener('click', delicious.utilities.toggleSubnav);

    var subnavUL = document.createElement('ul');
    subnavUL.className = 'subnav nobullet';
    subnavUL.style.display = 'none';

    subnavUL.style.width = '100%';
    subnavUL.style.left = '-1px'; // Shift so border is symmetrical

    var links = delicious.settings.get('ABQuickLinks');
    for (var i = 0; i < links.length; i++) {
        var li = document.createElement('li');
        li.style.width = '100%';
        var a = document.createElement('a');
        a.style.width = '100%';
        a.style.boxSizing = 'border-box';
        if (links[i]['href'])
            a.href = links[i]['href'];
        a.textContent = links[i]['text'] || '';
        li.appendChild(a);
        subnavUL.appendChild(li);
    }

    rootLI.appendChild(subnavUL);

    document.querySelector('.main-menu').appendChild(rootLI);
})();