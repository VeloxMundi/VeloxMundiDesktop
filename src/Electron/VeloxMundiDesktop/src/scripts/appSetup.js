setPageInConfig = false;
let hideErrors = ['Application Requires Configuration'];

$(document).ready(function() {
  hideToast(); //Hides page error saying the config is missing
  $('#SelectWorldPath').on('click', function(e) {
    e.preventDefault();
    $('#WorldPath').val(window.contextBridge.toMainSync('config', 'SelectWorldDirectory'));
  });

  $('#SaveAndClose').on('click', function() {
    let path = $('#WorldPath').val();
    if (path && path!='' && path!='Not Set') {
      window.contextBridge.toMainSync('config', 'WriteKey', ['WorldDirectory', path]);
      navigate('worldHome.html');
    }
    else {
      showToast('Please provide a path to the world directory.', 'text-danger');
    }
  });
});