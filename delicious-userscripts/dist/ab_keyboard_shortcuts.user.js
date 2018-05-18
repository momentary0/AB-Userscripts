// ==UserScript==
// @name        AnimeBytes - Forum Keyboard Shortcuts
// @author      Alpha, modified by Megure
// @description Enables keyboard shortcuts for forum (new post and edit) and PM
// @include     https://animebytes.tv/*
// @version     0.1.1
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==


// Keyboard shortcuts by Alpha, mod by Megure
// Enables keyboard shortcuts for forum (new post and edit) and PM
(function ABKeyboardShortcuts() {
    if (document.querySelector('textarea') === null)
        return;

    function custom_insert_text(open, close) {
        var elem = document.activeElement;
        if (elem.selectionStart || elem.selectionStart == '0') {
            var startPos = elem.selectionStart;
            var endPos = elem.selectionEnd;
            elem.value = elem.value.substring(0, startPos) + open + elem.value.substring(startPos, endPos) + close + elem.value.substring(endPos, elem.value.length);
            elem.selectionStart = elem.selectionEnd = endPos + open.length + close.length;
            elem.focus();
            if (close.length == 0)
                elem.setSelectionRange(startPos + open.length, startPos + open.length);
            else
                elem.setSelectionRange(startPos + open.length, endPos + open.length);
        } else if (document.selection && document.selection.createRange) {
            elem.focus();
            sel = document.selection.createRange();
            sel.text = open + sel.text + close;
            if (close.length != 0) {
                sel.move("character", -close.length);
                sel.select();
            }
            elem.focus();
        } else {
            elem.value += open;
            elem.focus();
            elem.value += close;
        }
    }

    var ctrlorcmd = (navigator.appVersion.indexOf('Mac') != -1) ? '⌘' : 'Ctrl';
    var insertedQueries = [];

    function insert(e, key, ctrl, alt, shift, open, close, query) {
        /* Function to handle detecting key combinations and inserting the
        shortcut text onto the relevent buttons. */
        if (false) {
            //console.log(String.fromCharCode((96 <= key && key <= 105)? key-48 : key));
            console.log(String.fromCharCode(e.charCode));
            console.log(e.ctrlKey);
            console.log(e.metaKey);
            console.log(e.altKey);
            console.log(e.shiftKey);
        }
        // Javascript has some discrepancies with symbols and their keycodes.
        var keyCode;
        switch (key) {
        case '.':
            keyCode = 190;
            break;
        case '/':
            keyCode = 191;
            break;
        default:
            keyCode = key.charCodeAt(0);
        }

        // Checks if correct modifiers are pressed
        if (document.activeElement.tagName.toLowerCase() === 'textarea' &&
        (ctrl === (e.ctrlKey || e.metaKey)) &&
        (alt === e.altKey) &&
        (shift === e.shiftKey) &&
        (e.keyCode === keyCode)) {
            e.preventDefault();
            custom_insert_text(open, close);
            return false;
        }

        if (query !== undefined) {
            if (insertedQueries.indexOf(query) === -1) {
                insertedQueries.push(query);
                var imgs = document.querySelectorAll(query);
                for (var i = 0; i < imgs.length; i++) {
                    var img = imgs[i];
                    img.title += ' (';
                    if (ctrl) img.title += ctrlorcmd + '+';
                    if (alt) img.title += 'Alt+';
                    if (shift) img.title += 'Shift+';
                    img.title += key + ')';
                }
            }
        }
    }

    function keydownHandler(e) {
        // Used as a keydown event handler.
        // Defines all keyboard shortcuts.
        /**
            * All keyboard shortcuts based on MS Word
            **/
        // Bold
        insert(e, 'B', true, false, false, '[b]', '[/b]', '#bbcode img[title="Bold"]');
        // Italics
        insert(e, 'I', true, false, false, '[i]', '[/i]', '#bbcode img[title="Italics"]');
        // Underline
        insert(e, 'U', true, false, false, '[u]', '[/u]', '#bbcode img[title="Underline"]');
        // Align right
        insert(e, 'R', true, false, false, '[align=right]', '[/align]');
        // Align left
        insert(e, 'L', true, false, false, '[align=left]', '[/align]');
        // Align center
        insert(e, 'E', true, false, false, '[align=center]', '[/align]');
        // Spoiler
        insert(e, 'S', true, false, false, '[spoiler]', '[/spoiler]', '#bbcode img[title="Spoilers"]');
        // Hide
        insert(e, 'H', true, false, false, '[hide]', '[/hide]', '#bbcode img[title="Hide"]');
        // YouTube
        insert(e, 'Y', true, true, false, '[youtube]', '[/youtube]', '#bbcode img[alt="YouTube"]');
        // Image
        insert(e, 'G', true, false, false, '[img]', '[/img]', '#bbcode img[title="Image"]');
        // Bullet point and numbered list
        insert(e, '.', true, false, false, '[*] ', '', '#bbcode img[title="Unordered list"]');
        insert(e, '/', true, false, false, '[#] ', '', '#bbcode img[title="Ordered list"]');
        // URL
        insert(e, 'K', true, false, false, '[url=]', '[/url]', '#bbcode img[title="URL"]');
    }

    var textAreas = document.querySelectorAll('textarea');
    // inserts shortcuts into title text on load, rather than
    // doing it when first key is pressed.
    keydownHandler({});
    for (var i = 0; i < textAreas.length; i++) {
        textAreas[i].addEventListener('keydown', keydownHandler, false);
    }

    function mutationHandler(mutations, observer) {
        _debug && console.log(mutations);
        if (mutations[0].addedNodes.length) {
            var textAreas = document.querySelectorAll('textarea');
            for (var i = 0; i < textAreas.length; i++) {
                textAreas[i].addEventListener('keydown', keydownHandler, false);
            }
        }
    }

    // Watch for new textareas (e.g. forum edit post)
    var mutationObserver = new MutationObserver(mutationHandler);
    mutationObserver.observe(document.querySelector('body'), { childList: true, subtree: true });
})();