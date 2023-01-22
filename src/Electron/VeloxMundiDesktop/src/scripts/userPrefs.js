
$(document).ready(function() {
  $('#EditorStyle').val(window.contextBridge.toMainSync('config', 'ReadUserPref', 'editorStyle'));

  $('#EditorStyle').on('change', function() {
    window.contextBridge.toMain('config', 'WriteUserPref', ['editorStyle', $('#EditorStyle').val()]);
  });
});