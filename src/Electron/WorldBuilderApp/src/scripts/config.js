$(document).ready(function() {
  ('#SelectWorldPath').off;  
  ('#MoveAllWorlds').off;

  $('#WorldPath').text(window.contextBridge.toMainSync('config', 'ReadKey', 'WorldDirectory'));

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

  

  /*
  ipcRenderer.on('fromMain', (method, module, data) => {
    let x = 1;
  });
*/

  
});