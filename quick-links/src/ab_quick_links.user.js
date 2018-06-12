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
// ==/UserScript==

(function ABQuickLinks() {
    var defaultLinks = [
        {text: 'Image Upload', href: '/imageupload.php'},
        {text: 'Profile Settings', href: '/user.php?action=edit'},
    ];
    function setLinks(linksArray) {
        GM_setValue('ABQuickLinks', JSON.stringify(linksArray));
    }
    function getLinks() {
        var stored = GM_getValue('ABQuickLinks', 'null');
        if (stored === 'null') {
            setLinks(defaultLinks);
            return defaultLinks;
        }
        return JSON.parse(stored);
    }

    var rootLI = document.createElement('li');
    rootLI.id = 'nav_quicklinks';
    rootLI.className = 'navmenu';
    // Above search boxes, but below user menu dropdown.
    rootLI.style.zIndex = 94;

    rootLI.innerHTML = '<a style="cursor:pointer;">Quick Links\
    <span class="dropit hover clickmenu"><span class="stext">▼</span></span></a>';
    rootLI.firstElementChild.addEventListener('click', function(ev) {
        var subnav = ev.currentTarget.parentNode.children[1];
        var willShow = (subnav.style.display==='none');
        subnav.style.display = willShow?'block':'none';
        if (willShow)
            subnav.parentNode.classList.add('selected');
        else
            subnav.parentNode.classList.remove('selected');
        ev.stopPropagation();
        return false;
    });

    var subnavUL = document.createElement('ul');
    subnavUL.className = 'subnav nobullet';
    subnavUL.style.display = 'none';

    subnavUL.style.width = '100%';
    subnavUL.style.left = '-1px'; // Shift so border is symmetrical

    var links = getLinks();
    for (var i = 0; i < links.length; i++) {
        var li = document.createElement('li');
        li.style.width = '100%';
        var a = document.createElement('a');
        a.style.width = '100%';
        a.style.boxSizing = 'border-box';
        if (links[i]['href']) a.href = links[i]['href'];
        a.textContent = links[i]['text'] || '';
        li.appendChild(a);
        subnavUL.appendChild(li);
    }

    rootLI.appendChild(subnavUL);

    document.querySelector('.main-menu').appendChild(rootLI);


})();