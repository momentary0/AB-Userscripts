// ==UserScript==
// @name        AB Better Image Upload
// @author      TheFallingMan
// @description Drag and drop, and paste images to upload.
// @include     https://animebytes.tv/*
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
    }
    replaceUploadForm();

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
            inputContainer.insertBefore(inputElement, inputContainer.firstChild);
        }

        var rootSpan = document.createElement('span');
        rootSpan.style.margin = '5px';
        for (var i = 0; i < fileList.length; i++) {
            var imageSpan = document.createElement('div');
            imageSpan.style.display = 'inline-block';
            imageSpan.style.marginLeft = '5px';
            imageSpan.style.marginRight = '5px';

            var imageLink = document.createElement('a');

            var image = (function() {
                var image2 = document.createElement('img');
                scaleImage(fileList[i], function(url) {
                    image2.src = url;
                });
                return image2;
            })();
            imageLink.appendChild(image);
            imageLink.appendChild(document.createElement('br'));

            imageLink.appendChild(document.createTextNode(fileList[i].name + ' ('));
            imageLink.href = window.URL.createObjectURL(fileList[i]);
            imageLink.target = '_blank';
            imageLink.style.color = 'inherit';
            imageSpan.appendChild(imageLink);

            var removeLink = document.createElement('a');
            removeLink.textContent = 'remove';
            removeLink.onclick = function(ev) {
                inputElement.parentNode.removeChild(inputElement);
                rootSpan.style.transitionProperty = 'opacity';
                rootSpan.style.transitionDuration = '200ms';
                rootSpan.style.opacity = '0';

                var links = ev.target.parentElement.parentElement.querySelectorAll('a[href^="blob:"]');
                for (let i = 0; i < links.length; i++) {
                    console.log(links[i].href);
                    window.URL.revokeObjectURL(links[i].href);
                }
                setTimeout(function() {
                    rootSpan.parentNode.removeChild(rootSpan);
                }, 200);
            };
            removeLink.style.cursor = 'pointer';
            imageSpan.appendChild(removeLink);
            imageSpan.appendChild(document.createTextNode(')'));
            imageSpan.appendChild(document.createElement('br'));
            rootSpan.appendChild(imageSpan);
        }
        selectedFileList.appendChild(rootSpan);
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
        inputContainer.insertBefore(newInput, inputContainer.firstChild);
    }
    function pasteHandler(ev) {
        var files = (ev.clipboardData || ev.originalEvent.clipboardData).files;
        validateAndAddFiles(files);
        ev.preventDefault();
        return false;
    }

    function scaleImage(imageFile, callback) {
        // Adapted from https://stackoverflow.com/a/39637827
        var img = new Image();
        var MAX_HEIGHT = 175;
        var MAX_WIDTH = 300;
        img.onload = function() {
            var targetScalingFactor = Math.min(MAX_HEIGHT/img.height, MAX_WIDTH/img.width);

            if (targetScalingFactor >= 1) {
                callback(img.src);
                return;
            }

            var canvas = document.createElement('canvas'),
                ctx = canvas.getContext("2d"),
                ocanvas = document.createElement('canvas'),
                octx = ocanvas.getContext('2d');

            var cur = {
                width: img.width,
                height: img.height,
            };

            var halfScalingFactor = 2^Math.floor(-Math.log2(targetScalingFactor)/2);
            //debugger;
            console.log('original: ', cur.width, cur.height);
            if (halfScalingFactor > 1) {
                ocanvas.width = cur.width;
                ocanvas.height = cur.height;
                cur = {
                    width: Math.ceil(img.width/halfScalingFactor),
                    height: Math.ceil(img.height/halfScalingFactor),
                };
                console.log('half scaled: ', cur.width, cur.height);
                octx.drawImage(img, 0, 0, img.width, img.height,
                    0, 0, cur.width, cur.height);
            }

            var targetWidth = Math.ceil(img.width * targetScalingFactor);
            var targetHeight = Math.ceil(img.height * targetScalingFactor);
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(halfScalingFactor > 1 ? ocanvas : img,
                0, 0, cur.width, cur.height,
                0, 0, targetWidth, targetHeight);
            console.log('final: ', targetWidth, targetHeight);
            callback(canvas.toDataURL(hasAlpha(ctx, canvas) ? 'image/png' : 'image/jpeg'));

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            octx.clearRect(0, 0, ocanvas.width, ocanvas.height);
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

    document.addEventListener('paste', pasteHandler, false);

    document.addEventListener('dragover', function(ev) {
        ev.preventDefault(); return false;
    });
    document.addEventListener('dragenter', highlightBox);
    document.addEventListener('dragleave', unhighlightBox);
    document.addEventListener('drop', onDrop, false);
})();
