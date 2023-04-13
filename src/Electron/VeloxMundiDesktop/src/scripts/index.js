$(document).ready(function() {
  let name = window.contextBridge.toMainSync('settings', 'Read', 'appName');
  let ver = window.contextBridge.toMainSync('settings', 'Read', 'appVersion');
  if (ver) {
    $('.appName').text(name);
    $('.version').html('<b>Version:</b> ' + ver);
    document.title = name + ' v' + ver;
  }
});