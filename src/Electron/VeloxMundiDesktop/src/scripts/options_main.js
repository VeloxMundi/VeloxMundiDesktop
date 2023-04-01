setPageInConfig = false;

$(document).ready(function() {
  ('#SelectWorldPath').off;  
  ('#MoveAllWorlds').off;

  $('#WorldPath').text(window.contextBridge.toMainSync('settings', 'Read', 'worldDirectory'));

  $('#SelectWorldPath').on('click', function(e) {
    e.preventDefault();
    $('#WorldPath').text(window.contextBridge.toMainSync('config', 'SelectWorldDirectory'));
  });

  $('#MoveAllWorlds').on('click', function(e) {
    e.preventDefault();
    let resp = window.contextBridge.toMainSync('config', 'MoveWorldDirectory');
    if (resp && resp[0]==true) {
      $('#WorldPath').text(resp[1]);
      showToast('Worlds moved successfully!', 'text-success');
    }
    else {
      showToast(resp[1], 'text-danger');
    }
  });

  $('#CloseOptions').on('click', function(e) {
    window.contextBridge.toMain('closeWindow', 'Options')
  });

  /*
  ipcRenderer.on('fromMain', (method, module, data) => {
    let x = 1;
  });
*/

  
});