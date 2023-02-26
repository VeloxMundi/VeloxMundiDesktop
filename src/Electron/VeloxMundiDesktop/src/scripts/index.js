$(document).ready(function() {
  let ver = window.contextBridge.toMainSync('getVersion');
  if (ver) {
    $('.version').html('<b>Version:</b> ' + ver);
    document.title += ' v' + ver;
  }
});