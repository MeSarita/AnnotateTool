'use strict'

window.$ = window.jQuery = require('jquery')
window.Bootstrap = require('bootstrap')

const electron = require('electron').remote;
const {
    dialog
} = electron;
const fs = require('fs');

function openDialog() {
    dialog.showOpenDialog(electron.getCurrentWindow(),
        {
            properties: ['openFile'],
            filters: [{
                name: 'Images',
                extensions: ['jpg', 'png']
            }]
        },
        (filePaths) => {
            if (filePaths) {
                let canvas = document.getElementById('canvas');
                let canvasFake = document.getElementById('canvas-fake');
                let context = canvas.getContext('2d');
                let imageObj = new Image();
                imageObj.onload = () => {
                    canvas.width = imageObj.width;
                    canvas.height = imageObj.height;
                    canvasFake.style.width = canvas.width + 'px';
                    canvasFake.style.height = canvas.height + 'px';
                    context.drawImage(imageObj, 0, 0);
                    initDraw(canvasFake);
                }
                imageObj.src = filePaths[0];
                // let img = document.getElementById('img');
                // img.setAttribute('src', filePaths[0]);

                // let c = document.getElementById('canvas');
                // c.style.left = img.offsetLeft + 'px';
                // c.style.top = img.offsetTop + 'px';
                // c.style.width = img.offsetWidth + 'px';
                // c.style.height = img.offsetHeight + 'px';
                // initDraw(c);
            }
        });
}

function saveImage() {
    let inputElements = document.getElementById('annotations').getElementsByTagName('input');
    if (inputElements.length > 0) {
        let c = document.getElementById('canvas-fake');
        c.onmousemove = null;
        c.onmousedown = null;
        c.onmouseup = null;

        c = document.getElementById('canvas');

        dialog.showSaveDialog(electron.getCurrentWindow(), {
            message: 'Give a name to your file (It will be in incremental order)',
            title: 'Save your file'
        }, fileName => {
            if (fileName) {
                let temp_ctx, temp_canvas, index = 0, parsedObj = null, finalJSONObj = {}, eachImageData;
                temp_canvas = document.createElement('canvas');
                temp_ctx = temp_canvas.getContext('2d');

                for (const item of inputElements) {
                    parsedObj = JSON.parse(item.getAttribute('data-imp'));
                    finalJSONObj[fileName + '_' + index + '.png'] = {
                        x: parsedObj.startX,
                        y: parsedObj.startY,
                        w: parsedObj.width,
                        h: parsedObj.height,
                        tags: item.value.split(',')
                    };
                    eachImageData = c.getContext('2d').getImageData(parsedObj.startX, parsedObj.startY, parsedObj.width, parsedObj.height);

                    temp_canvas.width = eachImageData.width;
                    temp_canvas.height = eachImageData.height;
                    temp_ctx.putImageData(eachImageData, 0, 0);

                    fs.writeFileSync(fileName + '_' + index + '.png', temp_canvas.toDataURL().split(';base64,').pop(), { encoding: 'base64' });
                    index++;
                }

                fs.writeFileSync(fileName + '.json', JSON.stringify(finalJSONObj));

                //All saved
                dialog.showMessageBox(electron.getCurrentWindow(), {
                    message: 'All anotations are saved',
                }, () => {
                    window.location.reload();
                });
            }
        });
    }
    else
        dialog.showMessageBox(electron.getCurrentWindow(), {
            message: 'Please select a image and add anotations.',
        });
}

function saveImageInstant(x, y, width, height) {
    let eachImageData = document.getElementById('canvas').getContext("2d").getImageData(x, y, width, height);
    dialog.showSaveDialog(electron.getCurrentWindow(), {
        message: 'Give a name to your annotation file',
        title: 'Save your annotation file'
    }, fileName => {
        if (fileName) {
            let temp_ctx, temp_canvas;
            temp_canvas = document.createElement('canvas');
            temp_ctx = temp_canvas.getContext('2d');
            temp_canvas.width = eachImageData.width;
            temp_canvas.height = eachImageData.height;
            temp_ctx.putImageData(eachImageData, 0, 0);

            fs.writeFileSync(fileName + '.png', temp_canvas.toDataURL().split(';base64,').pop(), { encoding: 'base64' });
            //All saved
            dialog.showMessageBox(electron.getCurrentWindow(), {
                message: 'Anotation saved',
            });

            let canvas2 = document.getElementById('canvas2');
            canvas2.getContext('2d').clearRect(0, 0, canvas2.width, canvas2.height);
        }
    });
}

function initDraw(canvas) {
    let mouse = {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        width: 0,
        height: 0,
    };
    function setMousePosition(e) {
        var ev = e || window.event; //Moz || IE
        if (ev.offsetX >= 0) { //Moz
            mouse.x = ev.offsetX;// + window.pageXOffset;// - parseInt(canvas.style.left);
            mouse.y = ev.offsetY;// + window.pageYOffset;// - parseInt(canvas.style.top);
        }
    };

    let element = null;
    let listAnnotations = document.getElementById('annotations');
    canvas.onmousemove = function (e) {
        setMousePosition(e);
        if (element !== null) {
            mouse.width = Math.abs(mouse.x - mouse.startX);
            mouse.height = Math.abs(mouse.y - mouse.startY);
            element.style.width = mouse.width + 'px';
            element.style.height = mouse.height + 'px';
            element.style.left = (mouse.x - mouse.startX < 0) ? mouse.x + 'px' : mouse.startX + 'px';
            element.style.top = (mouse.y - mouse.startY < 0) ? mouse.y + 'px' : mouse.startY + 'px';
        }
    }

    canvas.onmousedown = function (e) {
        mouse.startX = mouse.x;
        mouse.startY = mouse.y;
        element = document.createElement('div');
        element.className = 'rectangle'
        element.style.left = mouse.x + 'px';
        element.style.top = mouse.y + 'px';
        canvas.appendChild(element)
        canvas.style.cursor = "crosshair";
    }

    canvas.onmouseup = function (e) {
        if (element !== null) {
            element = null;
            canvas.style.cursor = "default";
            let newAnnotation = document.createElement('input');
            newAnnotation.className = "list-group-item pt-1 pb-1";
            mouse.startX = Math.min(mouse.x, mouse.startX);
            mouse.startY = Math.min(mouse.y, mouse.startY);
            newAnnotation.setAttribute('data-imp', JSON.stringify(mouse));
            newAnnotation.value = '';
            newAnnotation.placeholder = 'Enter tags';
            listAnnotations.appendChild(newAnnotation);
        }
    }
}