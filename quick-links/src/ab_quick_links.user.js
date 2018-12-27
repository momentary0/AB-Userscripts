// ==UserScript==
// @name         AB Quick Links
// @namespace    TheFallingMan
// @version      0.2.0
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
    delicious.settings.init('ABQuickLinksLabel', 'Quick Links');
    delicious.settings.init('ABQuickLinksPosition', 'navbar');
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
        s.appendChild(delicious.settings.createTextSetting(
            'ABQuickLinksLabel',
            'Label',
            'Label to display on dropdown.'
        ));
        s.appendChild(delicious.settings.createDropDown(
            'ABQuickLinksPosition',
            'Position',
            'Where quick links will be displayed.',
            [['Nav bar', 'navbar'], ['User info', 'userinfo']]
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

    function generateSubnavUL() {
        var subnavUL = document.createElement('ul');
        subnavUL.className = 'subnav nobullet';
        subnavUL.style.display = 'none';

        subnavUL.style.width = '100%';
        // subnavUL.style.width = 'fit-content';

        var links = delicious.settings.get('ABQuickLinks');
        for (var i = 0; i < links.length; i++) {
            var li = document.createElement('li');
            li.style.width = '100%';
            var a = document.createElement('a');
            a.style.width = '100%';
            a.style.boxSizing = 'border-box';
            // a.style.cssText += '; padding-right: 20px !important;';

            a.style.textOverflow = 'ellipsis';
            a.style.overflow = 'hidden';
            a.style.whiteSpace = 'nowrap';

            if (links[i]['href'])
                a.href = links[i]['href'];
            a.textContent = links[i]['text'] || '';
            li.appendChild(a);
            subnavUL.appendChild(li);
        }

        return subnavUL;
    }

    var rootLI = document.createElement('li');
    rootLI.id = 'nav_quicklinks';
    rootLI.className = 'navmenu';
    // Above search boxes, but below user menu dropdown.
    rootLI.style.zIndex = 94;

    var label = delicious.settings.get('ABQuickLinksLabel');
    rootLI.innerHTML = '<a style="cursor:pointer;">\
    <span class="dropit hover clickmenu"><span class="stext">▼</span></span></a>';
    rootLI.firstElementChild.addEventListener('click', delicious.utilities.toggleSubnav);
    rootLI.firstElementChild.insertAdjacentText('afterbegin', label);

    var subnav = generateSubnavUL();
    rootLI.appendChild(subnav);

    if (delicious.settings.get('ABQuickLinksPosition') === 'navbar') {
        document.querySelector('.main-menu').appendChild(rootLI);
        subnav.style.left = '-1px';
    } else {
        document.querySelector('#yen_count').insertAdjacentElement('beforebegin', rootLI);
    }
})();