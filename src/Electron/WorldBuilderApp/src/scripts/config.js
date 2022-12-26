
$(document).ready(function() {
  ('#SelectWorldPath').off;
  $('#WorldPath').text('hello there!');
  $('#SelectWorldPath').on('click', function() {
    let y = 7;
    //e.preventDefault();
    window.contextBridge.toMain('config', 'One-Way');
    let x = window.contextBridge.toMainSync('config', 'Two-Way');
  });


  /*
  ipcRenderer.on('fromMain', (method, module, data) => {
    let x = 1;
  });
*/

  

  let y = 1;
});