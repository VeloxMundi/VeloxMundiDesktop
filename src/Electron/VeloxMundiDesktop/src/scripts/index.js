$(document).ready(function() {
  let ver = window.contextBridge.toMainSync('getVersion');
  if (ver) {
    $('#version').text('Version: ' + ver);
  }
});