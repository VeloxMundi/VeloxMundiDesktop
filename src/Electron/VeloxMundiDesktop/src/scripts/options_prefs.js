setPageInConfig = false;
let userPrefs = '';

$(document).ready(function() {
  // Load default pref values
  let prefs = window.contextBridge.toMainSync('config', 'ReadAllUserPrefs');
  if (prefs.success) {
    userPrefs = prefs.prefs;
    $('#EditorStyle').val(userPrefs.editorStyle);
    $('#ToastTimeout').val(userPrefs.toastTimeout/1000);
  }
  else {
  $('#EditorStyle').val(window.contextBridge.toMainSync('config', 'ReadUserPref', 'editorStyle'));
  }

  $('#CloseOptions').on('click', function(e) {
    window.contextBridge.toMain('closeWindow', 'Options')
  });

  $('#SavePrefs').on('click', function() {
    userPrefs.editorStyle = $('#EditorStyle').val();
    userPrefs.toastTimeout = $('#ToastTimeout').val()*1000;
    let resp = window.contextBridge.toMainSync('config', 'WriteAllUserPrefs', userPrefs);
    if (resp.success) {
      showToast('Preferences have been updated.', 'text-success')
    }
    else {
      showToast(resp.message, 'text-danger');
    }
  });

});