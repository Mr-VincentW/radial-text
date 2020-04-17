// @DESCRIPTION:  Copy text to system clipboard.
// @PARAMETERS:   text {String}: The source text.
// @RETURN VALUE: {undefined}: Nothing.

export default text => {
  const preservedActiveElement = document.activeElement,
    copyHost = document.createElement('input');

  Object.assign(copyHost.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    pointerEvents: 'none',
    top: '-100px',
    left: '-100px'
  });
  copyHost.type = 'text';
  copyHost.value = text;

  document.body.appendChild(copyHost);
  copyHost.select();
  document.execCommand('copy');
  copyHost.remove();

  preservedActiveElement.focus();
};