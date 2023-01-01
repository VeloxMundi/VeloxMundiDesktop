
$(document).ready(function() {
  ('#SelectWorldPath').off;
  $('#WorldPath').text(window.contextBridge.toMainSync('config', 'ReadKey', 'WorldDirectory'));
  $('#SelectWorldPath').on('click', function(e) {
    e.preventDefault();
    $('#WorldPath').text(window.contextBridge.toMainSync('config', 'SelectWorldDirectory'));
  });
  $('#MoveWorld').on('click', function(e) {
    e.preventDefault();
    let resp = window.contextBridge.toMainSync('config', 'MoveWorldDirectory');
    if (resp && resp[0]==true) {
      $('#WorldPath').text(resp[1]);
      $('#MoveWorldText').html('<span class="text-success">Worlds moved successfully!<span>');
    }
    else {
      $('#MoveWorldText').html('<span class="text-danger">' + resp[1] + '</span>');
    }
  });


  /*
  ipcRenderer.on('fromMain', (method, module, data) => {
    let x = 1;
  });
*/

  

  let y = 1;
});