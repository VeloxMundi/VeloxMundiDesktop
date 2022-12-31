
$(document).ready(function() {
  ('#SelectWorldPath').off;
  $('#WorldPath').text(window.contextBridge.toMainSync('config', 'ReadKey', 'WorldDirectory'));
  $('#SelectWorldPath').on('click', function(e) {
    e.preventDefault();
    $('#WorldPath').text(window.contextBridge.toMainSync('config', 'SelectWorldDirectory'));
  });


  /*
  ipcRenderer.on('fromMain', (method, module, data) => {
    let x = 1;
  });
*/

  

  let y = 1;
});