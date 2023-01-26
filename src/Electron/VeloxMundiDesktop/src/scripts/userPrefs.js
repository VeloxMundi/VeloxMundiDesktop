setPageInConfig = false;

$(document).ready(function() {
  $('#EditorStyle').val(window.contextBridge.toMainSync('config', 'ReadUserPref', 'editorStyle'));

  $('#EditorStyle').on('change', function() {
    window.contextBridge.toMain('config', 'WriteUserPref', ['editorStyle', $('#EditorStyle').val()]);
  });
  $('#CloseOptions').on('click', function(e) {
    window.contextBridge.toMain('closeWindow', 'Options')
  });
});