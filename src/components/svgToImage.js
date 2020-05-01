// @DESCRIPTION:  Convert SVG to image, using HTML canvas for rendering.
// @PARAMETERS:   canvas {SVG Element}: The source SVG element.
// @PARAMETERS:   options {Object}: Parameters for image conversion.
//                  type {String}: Output type; values: 'OBJECT_URL' (default), 'DATA_URL' (Base-64 encoded), 'BLOB'.
//                  imgFormat {String}: Image format; values: 'png' (default), 'jpg', 'jpeg', 'webp'.
//                  imgQuality {Number}: Quality for the image encoding; value range: (0, 100], default: undefined (using browser default values. https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).
// @RETURN VALUE: {Promise}: A promise for sequent processes.
//                  .then(imgInfo => {}): imgInfo {Object}: An object containing information for the generated image.
//                                          blob {Blob}: (Only when options.type === 'BLOB') A Blob object representing the image, may be used for image uploading.
//                                          url {String}: (When options.type !== 'BLOB') A url for the image, either as an 'OBJECT_URL' or 'DATA_URL'.
//                                          width: {Number}: Image width.
//                                          height: {Number}: Image height.
//                                          mimeType: {String}: Image MIME type.
//                  .catch(error => {}): error {String}: Exception description.

let outputPaintObjectUrl = null;

export default (canvas, options) =>
  new Promise((resolve, reject) => {
    options = options || {};

    const targetCanvas = canvas.cloneNode(true),
      canvasStyles = getComputedStyle(canvas),
      outputType = /^(?:(?:DATA|OBJECT)_URL|BLOB)$/i.test(options.type)
        ? RegExp.$_.toUpperCase()
        : 'OBJECT_URL',
      imgFormat =
        'image/' +
        (/^(png|jpe?g|webp)$/i.test(options.imgFormat)
          ? RegExp.$_.toLowerCase().replace('jpg', 'jpeg')
          : 'png'),
      imgQuality =
        imgFormat === 'image/png'
          ? undefined
          : (isNaN(options.imgQuality)
              ? undefined
              : Math.min(Math.max(parseInt(options.imgQuality), 1), 100)) / 100;

    targetCanvas.style.visibility = 'hidden';
    !canvasStyles.background &&
      imgFormat === 'image/jpeg' &&
      (targetCanvas.style.background = '#FFFFFF');
    document.body.appendChild(targetCanvas);

    const canvasBBox = targetCanvas.getBBox();
    targetCanvas.setAttribute(
      'viewBox',
      `${canvasBBox.x} ${canvasBBox.y} ${canvasBBox.width} ${canvasBBox.height}`
    );
    targetCanvas.remove();
    targetCanvas.style.visibility = '';

    if (
      typeof window.URL === 'function' &&
      typeof window.Promise === 'function'
    ) {
      var canvasImgSrc = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(targetCanvas)], {
          type: 'image/svg+xml;charset=utf-8'
        })
      );

      new Promise(resolve => {
        const canvasImg = new Image();

        canvasImg.width = canvasBBox.width;
        canvasImg.height = canvasBBox.height;
        canvasImg.onload = () => resolve(canvasImg);
        canvasImg.onerror = () =>
          reject('An error occurred when creating the image.');

        canvasImg.src = canvasImgSrc;
      }).then(canvasImg => {
        const outputCanvas = document.createElement('canvas'),
          outputCtx = outputCanvas.getContext('2d');

        outputCanvas.width = canvasBBox.width;
        outputCanvas.height = canvasBBox.height;

        outputCtx.drawImage(canvasImg, 0, 0, canvasImg.width, canvasImg.height);
        URL.revokeObjectURL(canvasImgSrc);

        outputPaintObjectUrl && URL.revokeObjectURL(outputPaintObjectUrl);

        const imgOverSizedErrorMsg =
            'The image may be too large, please try reducing its dimentions.',
          imgInfo = {
            width: outputCanvas.width,
            height: outputCanvas.height,
            mimeType: imgFormat
          };

        if (outputType === 'DATA_URL') {
          const dataURL = outputCanvas.toDataURL(imgFormat, imgQuality);
          dataURL.length < 10
            ? reject(imgOverSizedErrorMsg)
            : resolve({
                url: dataURL,
                ...imgInfo
              });
        } else {
          resolve(
            new Promise((resolve, reject) => {
              outputCanvas.toBlob(
                blob => {
                  if (blob) {
                    resolve({
                      ...(outputType === 'BLOB'
                        ? {
                            blob: blob
                          }
                        : {
                            url: (outputPaintObjectUrl = URL.createObjectURL(
                              blob
                            ))
                          }),
                      ...imgInfo
                    });
                  } else {
                    reject(imgOverSizedErrorMsg);
                  }
                },
                imgFormat,
                imgQuality
              );
            })
          );
        }
      });
    } else {
      reject("Your browser doesn't support this feature.");
    }
  });
