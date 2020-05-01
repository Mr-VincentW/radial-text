import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.scss';

import RadialText from 'components/RadialText';
import svgToImage from 'components/svgToImage';
import copyText from 'components/copyText';

function getPaint(canvas, options) {
  const canvasClone = canvas.cloneNode(true);

  canvasClone.querySelector('.text-lines').removeAttribute('transform');
  Object.assign(canvasClone.style, {
    width: '',
    height: '',
    margin: '',
    fontFamily: getComputedStyle(canvas).fontFamily
  });

  return svgToImage(canvasClone, options);
}

export default function App() {
  const canvasRef = useRef(null),
    viewportRef = useRef(null),
    [settings, setSettings] = useState({
      rotation: -90
    }),
    [textLinesCount, setTextLinesCount] = useState(0),
    [estimatedImgDimentions, setEstimatedImgDimentions] = useState('0 × 0');

  // Setting form actions.
  const settingsOnChange = useCallback(e => {
    const target = e.target;
    setSettings(oldSettings => ({
      ...oldSettings,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value
    }));
  }, []);

  const rotationOnChange = useCallback(e => {
    const target = e.target;
    target.value = target.value % 360;
  }, []);

  const colorPickerOnClick = useCallback(
    e => e.target.previousSibling.click(),
    []
  );
  const colorRadioOnChange = useCallback(e => {
    const target = e.target;

    e.stopPropagation();

    setSettings(oldSettings => ({
      ...oldSettings,
      [target.name]: target.value ? '' : target.nextSibling.value
    }));
  }, []);

  const imgTypeSelectorOnChange = useCallback(e => {
    const imgQualitySettingItem = document.querySelector(
        '.img-quality-setting'
      ),
      imgQualitySlider = imgQualitySettingItem.nextSibling.querySelector(
        'input'
      );

    if (e.target.value === 'png') {
      imgQualitySettingItem.classList.add('disabled');
      imgQualitySettingItem.nextSibling.setAttribute(
        'title',
        'Not applicable to PNG type'
      );
      imgQualitySlider.disabled = true;
    } else {
      imgQualitySettingItem.classList.remove('disabled');
      imgQualitySettingItem.nextSibling.removeAttribute('title');
      imgQualitySlider.disabled = false;
    }
  }, []);

  // Toggle view mode between 'original-size' and 'auto-fit'.
  const viewportOnClick = useCallback(() => {
    setSettings(oldSettings => ({
      ...oldSettings,
      isZoomedIn: !oldSettings.isZoomedIn
    }));
  }, []);

  // Image outputing actions.
  const saveBtnOnClick = useCallback(
    e => {
      const isActionCopy = e.target.getAttribute('action') === 'copy';

      e.preventDefault();

      document.body.classList.add('processing');
      document.body.setAttribute('title', 'Processing image...');

      getPaint(canvasRef.current, {
        type: isActionCopy ? 'DATA_URL' : undefined,
        imgType: settings.imgType || 'png',
        imgQuality: settings.imgQuality || 100
      })
        .then(imgInfo => {
          document.body.classList.remove('processing');
          document.body.removeAttribute('title');

          if (isActionCopy) {
            copyText(imgInfo.url);
            alert('Base64-encoded data has been copied to the clipboard.');
          } else {
            const downloadLink = document.createElement('a');
            downloadLink.setAttribute('href', imgInfo.url);
            downloadLink.setAttribute(
              'download',
              `RadialText_${new Date().getTime()}.${settings.imgType || 'png'}`
            );
            downloadLink.dispatchEvent(new MouseEvent('click'));
          }
        })
        .catch(error => {
          alert(`Action failed!\nReasons: ${error}`);
        });
    },
    [settings]
  );

  // Update information.
  useEffect(() => {
    // Update line count.
    setTextLinesCount(canvasRef.current.querySelectorAll('.text').length);

    // Update estimated image dimentions.
    let canvasBBox = canvasRef.current.getBBox(),
      canvasScale = /scale\((.*?)\)/.test(
        canvasRef.current.querySelector('.text-lines').getAttribute('transform')
      )
        ? parseFloat(RegExp.$1)
        : 1;

    canvasScale = 1 / (isNaN(canvasScale) ? 1 : canvasScale);
    setEstimatedImgDimentions(
      `${Math.round(canvasBBox.width * canvasScale)} × ${Math.round(
        canvasBBox.height * canvasScale
      )}`
    );
  }, [settings]);

  return (
    <div className="app">
      <form className="settings" onChange={settingsOnChange}>
        <dl>
          <dt className="through">Text lines:</dt>
          <dd className="through">
            <textarea
              name="textLines"
              placeholder="Leading and trailing spaces will be auto-trimmed."
            ></textarea>
            <div className="line-setting">
              <label>
                <input
                  name="ignoreEmpty"
                  type="checkbox"
                  defaultChecked={true}
                />
                <span>Ignore empty lines</span>
              </label>
              <label>
                <span>Count: </span>
                <i>{textLinesCount}</i>
              </label>
            </div>
          </dd>
        </dl>
        <dl>
          <dt className="through header">OPTIONS</dt>
          <dt>Font Size:</dt>
          <dd>
            <label>
              <input
                name="fontSize"
                placeholder={16}
                type="number"
                defaultValue={16}
                min={0}
              />
              <span>px</span>
            </label>
          </dd>
          <dt>Font Weight:</dt>
          <dd>
            <label>
              <select
                name="fontWeight"
                placeholder="normal"
                defaultValue="normal"
              >
                <option value="lighter">LIGHTER</option>
                <option value="normal">NORMAL</option>
                <option value="bold">BOLD</option>
                <option value="bolder">BOLDER</option>
              </select>
            </label>
          </dd>
          <dt>Font Style:</dt>
          <dd>
            <label>
              <select
                name="fontStyle"
                placeholder="normal"
                defaultValue="normal"
              >
                <option value="normal">NORMAL</option>
                <option value="italic">ITALIC</option>
              </select>
            </label>
          </dd>
          <dt>Line Height:</dt>
          <dd>
            <label>
              <input
                name="lineHeight"
                placeholder={1}
                type="number"
                defaultValue={1}
                min={0}
              />
              <span>times (of font size)</span>
            </label>
          </dd>
          <dt>Centric Circle Radius:</dt>
          <dd>
            <label>
              <input
                name="centricCircleRadius"
                placeholder="auto"
                type="number"
                min={0}
              />
              <span>px</span>
            </label>
          </dd>
          <dt>Rotation Offset:</dt>
          <dd>
            <label>
              <input
                name="rotation"
                placeholder={-90}
                type="number"
                defaultValue={-90}
                onChange={rotationOnChange}
              />
              <span>deg</span>
            </label>
          </dd>
          <dt>Color:</dt>
          <dd>
            <label>
              <input
                type="radio"
                name="color"
                value="SPECTRUM"
                checked={!settings.color}
                onChange={colorRadioOnChange}
              />
              <span>SPECTRUM</span>
            </label>
            <label>
              <input
                type="radio"
                name="color"
                value=""
                checked={!!settings.color}
                onChange={colorRadioOnChange}
              />
              <input name="color" type="color" onClick={colorPickerOnClick} />
            </label>
          </dd>
          <dt>Background Color:</dt>
          <dd>
            <label>
              <input
                type="radio"
                name="bgColor"
                value="TRANSPARENT"
                checked={!settings.bgColor}
                onChange={colorRadioOnChange}
              />
              <span>TRANSPARENT</span>
            </label>
            <label>
              <input
                type="radio"
                name="bgColor"
                value=""
                checked={!!settings.bgColor}
                onChange={colorRadioOnChange}
              />
              <input
                name="bgColor"
                type="color"
                defaultValue="#FFFFFF"
                onClick={colorPickerOnClick}
              />
            </label>
          </dd>
          <dd></dd>
        </dl>
        <dl>
          <dt className="through header">OUTPUT</dt>
          <dt>Format:</dt>
          <dd>
            <label>
              <select
                name="imgType"
                defaultValue="png"
                onChange={imgTypeSelectorOnChange}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </label>
          </dd>
          <dt className="img-quality-setting disabled">Quality</dt>
          <dd title="Not applicable to PNG type">
            <label>
              <input
                type="range"
                name="imgQuality"
                min={1}
                defaultValue={100}
                disabled
              />
              <i className="img-quality">{settings.imgQuality || 100}</i>
            </label>
          </dd>
          <dt>Estimated Image Dimentions:</dt>
          <dd>{estimatedImgDimentions}</dd>
          <dd className="through buttons">
            <button
              action="copy"
              onClick={saveBtnOnClick}
              disabled={!settings.textLines}
            >
              COPY BASE-64 CODE
            </button>
            <button
              action="save"
              onClick={saveBtnOnClick}
              disabled={!settings.textLines}
            >
              SAVE IMAGE
            </button>
          </dd>
          <dd className="through note">
            <p>
              NOTE: If the image is too large to be processed by the browser,
              the output actions would fail.
            </p>
          </dd>
        </dl>
        <dl className="preview">
          <dt className="through header">PREVIEW</dt>
        </dl>
      </form>
      <div
        className={`viewport${settings.isZoomedIn ? ' original-size' : ''}`}
        ref={viewportRef}
        onClick={viewportOnClick}
        style={{
          background: settings.bgColor || ''
        }}
      >
        <RadialText
          settings={settings}
          viewportRef={viewportRef}
          ref={canvasRef}
        />
      </div>
    </div>
  );
}
