// ==UserScript==
// @name        AB Better Image Upload
// @author      TheFallingMan
// @description Drag and drop, and paste images to upload.
// @include     https://animebytes.tv/*
// @version     0.1.2
// @icon        http://animebytes.tv/favicon.ico
// ==/UserScript==

(function(){
    /**
     * `div#uploadform` directly surrounding the form.
     * @type {HTMLDivElement}
     * */
    var uploadFormDiv = document.querySelector('#uploadform');
    if (!uploadFormDiv) {
        // If there isn't an upload form and there is a BBCode image button,
        // we bind ctrl+click to open the image uploader.
        var imgButton = document.querySelector('[src="/static/common/symbols/image.png"]');
        if (imgButton) {
            imgButton.dataset['oldOnclick'] = imgButton.getAttribute('onclick');
            imgButton.removeAttribute('onclick');
            imgButton.onclick = function(ev) {
                if (ev.ctrlKey) {
                    window.open('/imageupload.php', '_blank');
                } else {
                    eval(ev.target.dataset['oldOnclick']);
                }
            };
        }
        return false;
    }
    /**
     * The form itself.
     * @type {HTMLFormElement}
     */
    var uploadForm = uploadFormDiv.querySelector('form');
    /**
     * `div.linkbox` containing all the input elements.
     * @type {HTMLDivElement}
     */
    var inputContainer = uploadForm.querySelector('.linkbox');
    /**
     * `div.box.pad` surrounding everything. Used for border highlighting.
     * @type {HTMLDivElement}
     */
    var formContainer = uploadFormDiv.parentElement;

    /**
     * `input#uurl` for the URL input.
     */
    var urlInput = uploadForm.querySelector('#uurl');

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
    function onDrop(ev) {
        unhighlightBox();
        if (validateAndAddFiles(ev.dataTransfer.files)) {
            ev.preventDefault();
            return false;
        }
        // If it is a string, we append it to the URL field.
        var droppedText = ev.dataTransfer.getData('text');
        if (droppedText !== '') {
            urlInput.value += droppedText;
            ev.preventDefault();
            return false;
        }
    }
    /**
     * Initialises the script by replacing default elements with our own.
     */
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
        // Checks if this is a screenshot uploader page.
        var torrentIdMatch = /[?&]torrentid=(\d+)$/.exec(window.location.href);
        if (torrentIdMatch) {
            // If so, we replace the links with links to the specific torrent ID.
            var headerLink = document.querySelector('h3 a[href^="/torrents"]');
            var inlineLink = uploadFormDiv.querySelector(
                'a[href="' + headerLink.getAttribute('href') + '"]');
            headerLink.href = headerLink.href + '&torrentid=' + torrentIdMatch[1];
            inlineLink.href = inlineLink.href + '&torrentid=' + torrentIdMatch[1];
        }
    }
    /**
     * Bound to an input[type=file]'s onchange. Validates the files and calls
     * appropriate functions.
     * @param {Event} ev
     */
    function inputOnChange(ev) {
        ev.preventDefault();
        if (validateAndAddFiles(ev.target.files, ev.target))
            ev.target.style.display = 'none';
        else
            ev.target.parentNode.removeChild(ev.target);
        prependNewInput();
    }
    /**
     * Checks if the given FileList contains valid images.
     * If so, calls functions to insert the thumbnails and links.
     * @param {FileList} files
     * @param {HTMLInputElement} input
     */
    function validateAndAddFiles(files, input) {
        var validFiles = validateFiles(files);
        if (validFiles) {
            addManyFiles(validFiles, input);
            return true;
        }
        return false;
    }
    /**
     * Performs basic checks pn the file list. Namely, that it has 10 or less
     * files and each file is an image. Displays messages if file list is invalid.
     * @param {FileList} fileList
     * @returns {boolean | File[]} False if fileList is invalid. fileList otherwise.
     */
    function validateFiles(fileList) {
        // We consider empty lists invalid.
        if (fileList.length === 0) return false;
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
    /**
     * The `div#uploadQueue_noFlash` where we append thumbnails.
     * @type {HTMLDivElement}
     */
    var imagePreviewList = document.getElementById('uploadQueue_noFlash');
    /** The number of input elements we've used so far. Incremented. */
    var globalImageCounter = 0;
    /**
     * Inserts thumbnails for each file in fileList, associating them with the
     * given input element. When the remove link is clicked, all files
     * associated with the same input element are removed as well as the
     * input element itself.
     * @param {FileList} fileList
     * @param {HTMLInputElement?} inputElement
     *  Input element to use. Will be created if not specified.
     */
    function addManyFiles(fileList, inputElement) {
        // Trivial do nothing case.
        if (!(fileList && fileList.length)) return false;
        // In the case of drag/drop or paste, there might not be an existing
        // input element. In that case, create one.
        if (!inputElement) {
            inputElement = newImageInput();
            inputElement.style.display = 'none';
            inputElement.files = fileList;
            inputContainer.insertAdjacentElement('afterbegin', inputElement);
        }

        globalImageCounter++;
        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i];

            /** Div containing all this image's content. */
            var thisDiv = document.createElement('div');
            thisDiv.className = 'item';
            // Attribute linking all thumbnails on the same <input>
            thisDiv.dataset['betterImageUpload'] = globalImageCounter;

            /** Link to open the full image.  */
            var imageLink = document.createElement('a');
            // We cannot attach this to an <img>'s src because it is a
            // blob: URL which is not allowed by CSP -_-
            imageLink.href = window.URL.createObjectURL(file);
            imageLink.target = '_blank';
            imageLink.style.color = 'inherit';
            var innerDiv = (function() {
                // We need a function otherwise, the variables are overwritten
                // by the next iteration's
                var innerDiv = document.createElement('div');
                innerDiv.className = 'thumbnail-container';
                innerDiv.appendChild(document.createTextNode(file.name));
                scaleImage(file, function(obj) {
                    var fileDetails = document.createElement('div');
                    fileDetails.className = 'file-details';
                    fileDetails.textContent =
                        formatBytes(obj.size, 2) + ' (' + obj.width + '\xD7' + obj.height + ')';
                    // Inserting elements in reverse order because innerDiv
                    // already contains the last child (file name text).
                    innerDiv.insertAdjacentElement('afterbegin', fileDetails);
                    innerDiv.insertAdjacentElement('afterbegin', obj.thumbnail);
                });
                return innerDiv;
            })();
            imageLink.appendChild(innerDiv);
            thisDiv.appendChild(imageLink);

            thisDiv.appendChild(document.createTextNode(' ('));
            var removeLink = document.createElement('a');
            removeLink.textContent = 'remove';
            removeLink.className = 'remove';
            removeLink.onclick = function(ev) {
                inputElement.parentNode.removeChild(inputElement);

                // Finds all divs with the same id number.
                var thisDiv = ev.target.parentElement;
                var idNum = thisDiv.dataset['betterImageUpload'];
                var relatedDivs = uploadForm.querySelectorAll(
                    '.item[data-better-image-upload="' + idNum + '"]');

                for (var i = 0; i < relatedDivs.length; i++) {
                    // Fade out
                    var div = relatedDivs[i];
                    div.style.transitionProperty = 'opacity';
                    div.style.transitionDuration = '200ms';
                    div.style.opacity = '0';
                    // Revoke object URL in case of memory leaks.
                    var link = div.querySelector('a[href^="blob:"]');
                    window.URL.revokeObjectURL(link.href);
                }
                // Remove elements after they are faded out.
                setTimeout(function() {
                    for (var i = 0; i < relatedDivs.length; i++) {
                        var div = relatedDivs[i];
                        div.parentNode.removeChild(div);
                    }
                }, 255);
            };
            removeLink.style.cursor = 'pointer';
            thisDiv.appendChild(removeLink);
            thisDiv.appendChild(document.createTextNode(')'));
            imagePreviewList.appendChild(thisDiv);
        }
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
    /**
     * Returns a new file <input> element with the relevant properties set.
     * Does not attach an onchange handler or insert anything into the DOM.
     * @returns {HTMLInputElement}
     */
    function newImageInput() {
        var newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.className = 'upload';
        newInput.name = 'screenshot[]';
        newInput.multiple = true;
        newInput.accept = 'image/*';
        newInput.dataset['betterImageUpload'] = '';
        return newInput;
    }
    /**
     * Inserts a new input into the form and attaches an onchange listener
     * to it.
     */
    function prependNewInput() {
        var newInput = newImageInput();
        newInput.addEventListener('change',
            inputOnChange, false);
        inputContainer.insertAdjacentElement('afterbegin', newInput);
    }
    function pasteHandler(ev) {
        var files = (ev.clipboardData || ev.originalEvent.clipboardData).files;
        if (validateAndAddFiles(files)) {
            ev.preventDefault();
            return false;
        }
        return true;
    }

    // Target resolution for the internal canvas used for scaling.
    // Canvas will not scale image lower than this.
    var CANVAS_HEIGHT = 250;
    var CANVAS_WIDTH = 500;

    // Final desired resolution for thumbnails. Implemented using CSS for
    // better scaling than canvas.
    var FINAL_HEIGHT = 100;
    var FINAL_WIDTH = 200;

    /**
     * Whether to skip the final canvas downscaling step after halving downscaling is done.
     * */
    var SKIP_LAST_STEP = true;
    /**
     * If this is true, no downscaling will be done using <canvas>.
     * The full resolution will be inserted into <img> and sized using CSS.
     */
    var SKIP_ALL_RESIZING = false;
    /**
     * @typedef {{thumbnail: HTMLImageElement, width: number, height: number, size: number}} ImageDataObject
     */
    null;
    /**
     *
     * @param {File} imageFile
     * @param {function(ImageDataObject)} callback
     */
    function scaleImage(imageFile, callback) {
        // Adapted from https://stackoverflow.com/a/39637827
        var img = new Image();
        img.onload = function() {
            /** Scaling factor required for image to become specified canvas dimensions.  */
            var targetScalingFactor = Math.min(CANVAS_HEIGHT/img.height, CANVAS_WIDTH/img.width);
            var finalScalingFactor = Math.min(FINAL_HEIGHT/img.height, FINAL_WIDTH/img.width);

            // If the image is smaller than the limits, do nothing.
            if (finalScalingFactor >= 1 || SKIP_ALL_RESIZING) {
                if (finalScalingFactor < 1)
                    img.style.height = Math.ceil(img.height*finalScalingFactor) + 'px';
                callback({
                    thumbnail: img,
                    width: img.width,
                    height: img.height,
                    size: imageFile.size
                });
                return;
            }

            /** Current dimensions of the image. */
            var cur = {
                width: img.width,
                height: img.height,
            };

            // We need two canvases as a canvas cannot overwrite itself.
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext("2d");
            var ocanvas = document.createElement('canvas');
            var octx = ocanvas.getContext("2d");

            var newImg = document.createElement('img');
            // Scaling to final dimensions.
            newImg.style.height = Math.ceil(cur.height*finalScalingFactor) + 'px';

            // Downscaling using multiples of 2.
            var halfScalingFactor = Math.pow(2, Math.floor(-Math.log2(targetScalingFactor)));
            if (SKIP_LAST_STEP && halfScalingFactor <= 1)
                halfScalingFactor = 1;
            if (halfScalingFactor > 1 || SKIP_LAST_STEP) {
                cur = {
                    width: Math.ceil(img.width/halfScalingFactor),
                    height: Math.ceil(img.height/halfScalingFactor),
                };
                ocanvas.width = cur.width;
                ocanvas.height = cur.height;
                octx.drawImage(img, 0, 0, img.width, img.height,
                    0, 0, cur.width, cur.height);
            }
            if (!SKIP_LAST_STEP) {
                // This is the last step, downscaling using a factor not equal to 2
                // to the size specified by CANVAS_WIDTH and CANVAS_HEIGHT.
                var targetWidth = Math.ceil(img.width * targetScalingFactor);
                var targetHeight = Math.ceil(img.height * targetScalingFactor);
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                ctx.drawImage(halfScalingFactor > 1 ? ocanvas : img,
                    0, 0, cur.width, cur.height,
                    0, 0, targetWidth, targetHeight);
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
        // Notably inefficient because we read to a base64 data URI, then
        // back to one.
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
                max-width: '+(FINAL_WIDTH)+'px;\
            }\
            .file-details {\
                font-size: 85%;\
                line-height: 1em;\
                margin-bottom: 5px;\
            }\
            .thumbnail-container {\
                overflow: hidden;\
                text-overflow: ellipsis;\
                white-space: nowrap;\
            }\
            '
        ));
        document.head.appendChild(style);
    }

    insertCSS();
    replaceUploadForm();

    document.addEventListener('paste', pasteHandler, false);

    /** Element to attach drag/drop handlers to. */
    var wrapper = document.getElementById('wrapper') || document.body;

    wrapper.addEventListener('dragover', function(ev) {
        ev.preventDefault(); return false;
    });
    wrapper.addEventListener('dragenter', highlightBox);
    wrapper.addEventListener('dragleave', unhighlightBox);
    wrapper.addEventListener('drop', onDrop, false);
})();
