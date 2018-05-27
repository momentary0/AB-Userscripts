// ==UserScript==
// @name        AB Better Image Upload
// @author      TheFallingMan
// @description Click and drag files, and upload from clipboard.
// @include       https://animebytes.tv/*
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
        formContainer.style.border = 'grey solid 1px';
        uploadFormDiv.style.pointerEvents = 'none';

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
        for (var i = 0; i < fileList.length; i++) {
            var imageSpan = document.createElement('span');

            var imageLink = document.createElement('a');
            imageLink.textContent = fileList[i].name;
            imageLink.href = window.URL.createObjectURL(fileList[i]);
            imageLink.target = '_blank';
            imageSpan.appendChild(imageLink);
            imageSpan.appendChild(document.createTextNode(' ('));
            var removeLink = document.createElement('a');
            removeLink.textContent = 'remove';
            removeLink.onclick = function() {
                inputElement.parentNode.removeChild(inputElement);
                rootSpan.parentNode.removeChild(rootSpan);
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

    document.addEventListener('paste', pasteHandler, false);

    formContainer.addEventListener('dragover', function(ev) {
        ev.preventDefault(); return false;
    });
    formContainer.addEventListener('dragenter', highlightBox);
    formContainer.addEventListener('dragleave', unhighlightBox);
    formContainer.addEventListener('drop', onDrop, false);
})();
