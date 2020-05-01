import React, { useEffect, useRef, useCallback } from 'react';

export default React.forwardRef(({ settings, viewportRef }, canvasRef) => {
  const config = {
    textLines: (settings.textLines || '')
      .split(/[\r\n]/)
      .filter(
        text =>
          settings.ignoreEmpty === false || text.replace(/^\s*$/g, '').length
      ),
    fontSize: isNaN(parseFloat(settings.fontSize)) ? 16 : settings.fontSize,
    fontWeight: settings.fontWeight || 'normal',
    fontStyle: settings.fontStyle || 'normal',
    lineHeight: isNaN(parseFloat(settings.lineHeight))
      ? 1
      : settings.lineHeight,
    rotation: parseFloat(settings.rotation) || 0,
    color: settings.color || undefined,
    bgColor: settings.bgColor || undefined,
    isZoomedIn: settings.isZoomedIn || false
  };

  config.centralAngle =
    config.textLines.length > 1 ? 360 / config.textLines.length : 0;
  config.centricCircleRadius = isNaN(parseFloat(settings.centricCircleRadius))
    ? config.centralAngle
      ? (config.fontSize * config.lineHeight) /
        2 /
        Math.tan((config.centralAngle * Math.PI) / 180 / 2)
      : 0
    : settings.centricCircleRadius;

  const textLinesGroupRef = useRef(null);

  const resetCanvas = useCallback(() => {
    const viewport = viewportRef.current,
      canvas = canvasRef.current,
      viewportClientRect = viewport.getBoundingClientRect();

    if (config.isZoomedIn) {
      textLinesGroupRef.current.removeAttribute('transform');

      const canvasBBox = canvas.getBBox();

      canvas.setAttribute(
        'viewBox',
        `${canvasBBox.x} ${canvasBBox.y} ${canvasBBox.width} ${canvasBBox.height}`
      );
      Object.assign(canvas.style, {
        width: `${canvasBBox.width}px`,
        height: `${canvasBBox.height}px`,
        margin: `${
          -Math.min(canvasBBox.height, viewportClientRect.height) / 2
        }px 0 0 ${-Math.min(canvasBBox.width, viewportClientRect.width) / 2}px`
      });
    } else {
      const viewportHalfSize = {
          width: viewportClientRect.width / 2,
          height: viewportClientRect.height / 2
        },
        textLinesGroupBBox = textLinesGroupRef.current.getBBox();

      Object.assign(canvas.style, {
        width: '',
        height: '',
        margin: ''
      });
      canvas.setAttribute(
        'viewBox',
        `0 0 ${viewportClientRect.width} ${viewportClientRect.height}`
      );

      textLinesGroupRef.current.setAttribute(
        'transform',
        `translate(${viewportHalfSize.width},${
          viewportHalfSize.height
        }) scale(${Math.min(
          1,
          viewportHalfSize.width / Math.abs(textLinesGroupBBox.x),
          viewportHalfSize.height / Math.abs(textLinesGroupBBox.y),
          viewportHalfSize.width /
            (textLinesGroupBBox.width + textLinesGroupBBox.x),
          viewportHalfSize.height /
            (textLinesGroupBBox.height + textLinesGroupBBox.y)
        )})`
      );
    }
  }, [viewportRef, canvasRef, settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    let resizeObserver;

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resetCanvas);
      resizeObserver.observe(canvas.parentElement);
    }

    return () =>
      resizeObserver && resizeObserver.unobserve(canvas.parentElement);
  }, [canvasRef, resetCanvas]);

  useEffect(resetCanvas, [settings, resetCanvas]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="canvas"
      ref={canvasRef}
      style={{
        background: config.bgColor || ''
      }}
    >
      <g className="text-lines" ref={textLinesGroupRef}>
        {config.textLines.map((text, i) => (
          <text
            key={i}
            className="text"
            dominantBaseline="middle"
            style={{
              fill:
                config.color ||
                `hsl(${i * config.centralAngle || 0}deg,100%,50%)`,
              fontSize: `${config.fontSize}px`,
              fontWeight: config.fontWeight,
              fontStyle: config.fontStyle,
              lineHeight: config.lineHeight,
              transform: `rotate(${
                i * config.centralAngle + config.rotation
              }deg) translate(${config.centricCircleRadius}px,0)`
            }}
          >
            {text.trim()}
          </text>
        ))}
      </g>
    </svg>
  );
});
