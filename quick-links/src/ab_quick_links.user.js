// ==UserScript==
// @name         AB Quick Links
// @namespace    TheFallingMan
// @version      0.1.0
// @description  Adds quick link dropdown to the main nav bar.
// @author       TheFallingMan
// @icon         https://animebytes.tv/favicon.ico
// @match        https://animebytes.tv/*
// @license      GPL-3.0
// ==/UserScript==

(function ABQuickLinks() {
    var rootLI = document.createElement('li');
    rootLI.id = 'nav_quicklinks';
    rootLI.className = 'navmenu';
    rootLI.style.zIndex = 0;

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
        subnav.parentNode.style.zIndex = willShow?95:0;
        ev.stopPropagation();
        return false;
    });

    var subnavUL = document.createElement('ul');
    subnavUL.className = 'subnav nobullet';
    subnavUL.style.display = 'none';
    subnavUL.innerHTML = '<li><a href="https://animebytes.tv/imageupload.php">Image Upload</a></li>';

    rootLI.appendChild(subnavUL);

    document.querySelector('.main-menu').appendChild(rootLI);


})();