
$(document).ready(function() {
  $('#WorldPath').text('hello there!');
  $('#SelectWorldPath').on('click', function(e) {
    e.preventDefault();
    window.contextBridge.toMain('config', 'One-Way');
    let x = window.contextBridge.toMainAndBack('config', 'Two-Way');
  });


  /*
  ipcRenderer.on('fromMain', (method, module, data) => {
    let x = 1;
  });
*/

  

  let y = 1;
});