// ==UserScript==
// @name        AB Better Image Upload
// @author      TheFallingMan
// @description Drag and drop, and paste images to upload.
// @include     https://animebytes.tv/imageupload.php
// @version     0.1
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

(function(){
    var uploadFormDiv = document.querySelector('#uploadform');
    if (!uploadFormDiv) return false;
    var uploadForm = uploadFormDiv.querySelector('form');
    var inputContainer = uploadForm.firstElementChild;

    var formContainer = uploadForm.parentElement.parentElement;

    var dragEnters = 0;
    function highlightBox(ev) {
        dragEnters++;
        // #323442 solid 1px
        if (dragEnters === 1) {
            formContainer.style.border = 'grey solid 1px';
            uploadFormDiv.style.pointerEvents = 'none';
        }

        ev.preventDefault();
    }
    function unhighlightBox() {
        dragEnters--;
        if (dragEnters === 0) {
            formContainer.style.border = null;
            uploadFormDiv.style.pointerEvents = null;
        }
    }
    function onDrop(event) {
        unhighlightBox();
        event.preventDefault();
        validateAndAddFiles(event.dataTransfer.files);
        return false;
    }
    function replaceUploadForm() {
        var oldInput = uploadForm.querySelector('input[type="file"]');
        var uploader = newImageInput();
        uploader.name = oldInput.name;
        uploader.id = oldInput.id;
        uploader.addEventListener('change',
            inputOnChange, false);
        oldInput.parentNode.replaceChild(
            uploader,
            oldInput
        );
        var torrentIdMatch = /[?&]torrentid=(\d+)$/.exec(window.location.href);
        if (torrentIdMatch) {
            var headerLink = document.querySelector('h3 a[href^="/torrents"]');
            var inlineLink = uploadFormDiv.querySelector('a[href="' + headerLink.getAttribute('href') + '"]');
            headerLink.href = headerLink.href + '&torrentid=' + torrentIdMatch[1];
            inlineLink.href = inlineLink.href + '&torrentid=' + torrentIdMatch[1];
        }
    }
    function inputOnChange(ev) {
        ev.preventDefault();
        if (validateAndAddFiles(ev.target.files, ev.target))
            ev.target.style.display = 'none';
        else
            ev.target.parentNode.removeChild(ev.target);
        prependNewInput();
    }
    function validateAndAddFiles(files, input) {
        var validFiles = validateFiles(files);
        if (validFiles) {
            addManyFiles(validFiles, input);
            return true;
        }
        return false;
    }
    function validateFiles(fileList) {
        if (fileList.length > 10) {
            alert('You can select a maximum of 10 files.');
            return false;
        }
        var invalid = [];
        for (var i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!(file.type && file.type.startsWith('image/'))) {
                invalid.push(file.name);
            }
        }
        if (invalid.length) {
            alert('Invalid image(s):\n' + invalid.join('\n'));
            return false;
        }
        return fileList;
    }
    var selectedFileList = document.getElementById('uploadQueue_noFlash');
    function addManyFiles(fileList, inputElement) {
        if (!(fileList && fileList.length)) return false;
        if (!inputElement) {
            inputElement = newImageInput();
            inputElement.style.display = 'none';
            inputElement.files = fileList;
            inputContainer.insertAdjacentElement('afterbegin', inputElement);
        }

        var rootSpan = document.createElement('div');
        rootSpan.className = 'item';
        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i];

            var thisDiv = document.createElement('div');
            thisDiv.className = 'item-container';

            var imageLink = document.createElement('a');
            var innerDiv = (function() {
                var innerDiv = document.createElement('div');
                innerDiv.className = 'thumbnail-container';

                scaleImage(file, function(obj) {
                    innerDiv.appendChild(obj.thumbnail);
                    innerDiv.appendChild(document.createElement('br'));
                    innerDiv.appendChild(document.createTextNode(
                        formatBytes(obj.size, 2) + ' (' + obj.width + '\xD7' + obj.height + ')'
                    ));
                });

                return innerDiv;
            })();
            imageLink.appendChild(innerDiv);

            imageLink.appendChild(document.createTextNode(file.name + ' ('));
            imageLink.href = window.URL.createObjectURL(file);
            imageLink.target = '_blank';
            imageLink.style.color = 'inherit';
            thisDiv.appendChild(imageLink);

            var removeLink = document.createElement('a');
            removeLink.textContent = 'remove';
            removeLink.className = 'remove';
            removeLink.onclick = function(ev) {
                inputElement.parentNode.removeChild(inputElement);
                rootSpan.style.transitionProperty = 'opacity';
                rootSpan.style.transitionDuration = '200ms';
                rootSpan.style.opacity = '0';

                var links = ev.target.parentElement.parentElement.querySelectorAll('a[href^="blob:"]');
                for (var i = 0; i < links.length; i++) {
                    window.URL.revokeObjectURL(links[i].href);
                }
                setTimeout(function() {
                    rootSpan.parentNode.removeChild(rootSpan);
                }, 200);
            };
            removeLink.style.cursor = 'pointer';
            thisDiv.appendChild(removeLink);
            thisDiv.appendChild(document.createTextNode(')'));
            thisDiv.appendChild(document.createElement('br'));
            rootSpan.appendChild(thisDiv);
        }
        selectedFileList.appendChild(rootSpan);
    }
    // Adapted from https://stackoverflow.com/a/18650828
    var BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var BYTE_BASE = 1024;
    function formatBytes(numBytes, decimals) {
        if (numBytes === 0) return '0 ' + BYTE_UNITS[0];
        var magnitude = Math.floor(Math.log(numBytes) / Math.log(BYTE_BASE));
        // Extra parseFloat is so trailing 0's are removed.
        return parseFloat(
            (numBytes / Math.pow(BYTE_BASE, magnitude)).toFixed(decimals)
        ) + ' ' + BYTE_UNITS[magnitude];
    }
    function newImageInput() {
        var newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.className = 'upload';
        newInput.name = 'screenshot[]';
        newInput.multiple = true;
        newInput.accept = 'image/*';
        newInput.dataset['userscriptUpload'] = '';
        return newInput;
    }
    function prependNewInput() {
        var newInput = newImageInput();
        newInput.addEventListener('change',
            inputOnChange, false);
        inputContainer.insertAdjacentElement('afterbegin', newInput);
    }
    function pasteHandler(ev) {
        var files = (ev.clipboardData || ev.originalEvent.clipboardData).files;
        validateAndAddFiles(files);
        ev.preventDefault();
        return false;
    }

    var CANVAS_HEIGHT = 200;
    var CANVAS_WIDTH = 300;


    var CSS_FINAL_RESIZE = true;
    var CSS_ALL_RESIZING = false;
    function scaleImage(imageFile, callback) {
        // Adapted from https://stackoverflow.com/a/39637827
        var img = new Image();
        img.onload = function() {
            var targetScalingFactor = Math.min(CANVAS_HEIGHT/img.height, CANVAS_WIDTH/img.width);
            var cssScalingFactor = Math.min(IMG_HEIGHT/img.height, IMG_WIDTH/img.width);

            if (targetScalingFactor >= 1) {
                callback({
                    thumbnail: img,
                    width: img.width,
                    height: img.height,
                    size: imageFile.size
                });
                return;
            }

            if (CSS_ALL_RESIZING) {
                img.style.height = Math.ceil(img.height*cssScalingFactor) + 'px';
                callback({
                    thumbnail: img,
                    width: img.width,
                    height: img.height,
                    size: imageFile.size
                });
                return;
            }

            var cur = {
                width: img.width,
                height: img.height,
            };

            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext("2d");
            var ocanvas = document.createElement('canvas');
            var octx = ocanvas.getContext("2d");

            var newImg = document.createElement('img');
            if (CSS_FINAL_RESIZE) {
                newImg.style.height = Math.ceil(cur.height*cssScalingFactor) + 'px';
            }

            var halfScalingFactor = Math.pow(2, Math.floor(-Math.log2(targetScalingFactor)));
            console.log('original: ', cur.width, cur.height);
            if (halfScalingFactor > 1) {
                cur = {
                    width: Math.ceil(img.width/halfScalingFactor),
                    height: Math.ceil(img.height/halfScalingFactor),
                };
                ocanvas.width = cur.width;
                ocanvas.height = cur.height;
                console.log('half scaled: ', cur.width, cur.height);
                octx.drawImage(img, 0, 0, img.width, img.height,
                    0, 0, cur.width, cur.height);
            }
            if (!CSS_FINAL_RESIZE) {
                var targetWidth = Math.ceil(img.width * targetScalingFactor);
                var targetHeight = Math.ceil(img.height * targetScalingFactor);
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                ctx.drawImage(halfScalingFactor > 1 ? ocanvas : img,
                    0, 0, cur.width, cur.height,
                    0, 0, targetWidth, targetHeight);
                console.log('final: ', targetWidth, targetHeight);
                newImg.src = canvas.toDataURL(hasAlpha(ctx, canvas) ? 'image/png' : 'image/jpeg');
            } else {
                newImg.src = ocanvas.toDataURL(hasAlpha(octx, ocanvas) ? 'image/png' : 'image/jpeg');
            }
            callback({
                thumbnail: newImg,
                width: img.width,
                height: img.height,
                size: imageFile.size
            });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            octx.clearRect(0, 0, ocanvas.width, ocanvas.height);
            img = null;
        };
        var fileReader = new FileReader();
        fileReader.onload = function(ev) {
            img.src = ev.target.result;
            fileReader = null;
        };
        fileReader.readAsDataURL(imageFile);
    }
    // Adapted from https://stackoverflow.com/a/45122479
    function hasAlpha (context, canvas) {
        var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (var i = 3, n = data.length; i < n; i+=4) {
            if (data[i] < 255) {
                return true;
            }
        }
        return false;
    }
    function insertCSS() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(
            'div.item {\
                margin: 5px;\
                display: inline-block;\
            }\
            .item-container {\
                display: inline-block;\
                margin-left: 5px;\
                margin-right: 5px;\
                max-width: '+((CSS_ALL_RESIZING||CSS_FINAL_RESIZE) ? IMG_WIDTH:CANVAS_WIDTH)+'px;\
                overflow: hidden;\
                text-overflow: ellipsis;\
            }\
            .thumbnail-container {\
                font-size: 85%;\
                line-height: 1.4em;\
            }\
            '
        ));
        document.head.appendChild(style);
    }

    insertCSS();
    replaceUploadForm();

    document.addEventListener('paste', pasteHandler, false);

    var wrapper = document.getElementById('wrapper');

    wrapper.addEventListener('dragover', function(ev) {
        ev.preventDefault(); return false;
    });
    wrapper.addEventListener('dragenter', highlightBox);
    wrapper.addEventListener('dragleave', unhighlightBox);
    wrapper.addEventListener('drop', onDrop, false);
})();
