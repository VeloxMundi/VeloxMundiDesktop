
  


  $(document).ready(function() {
    let worldList = window.contextBridge.toMainSync('world', 'GetWorldLinks');
    $('#WorldList').prepend(worldList);

    $('.worldLink').on('click', function() {
      window.contextBridge.toMain('settings', 'Write', ['currentWorld', $(this).text()]);

      //let y = window.contextBridge.toMainSync('data', 'Test');
      let checkResult = window.contextBridge.toMainSync('world', 'CheckWorldDb');
      if (checkResult.success) {
        showToast('Set world to "' + $(this).text() + '." Navigating to world home...');
        window.contextBridge.navigate('worldHome.html');
      }
      else {
        showToast('There was a problem checking the database: ' + checkResult.message + '<div><a href="worldHome.html">Continue</a>', 'text-danger', true);
      }
    });

    $('#createWorld').on('click', function() {
      let resp = window.contextBridge.toMainSync('world', 'CreateWorld', $('#NewWorldName').val());
      showToast(resp[1], (resp[0] ? 'text-success': 'text-danger'));
      if (resp[0]) {
        window.contextBridge.navigate('worldHome.html');
      }
    });


    window.contextBridge.fromMain('menu', (event, action) =>  {
      switch(action) {
        case 'NewWorld':
          showModal('World Name', '<p>New world name:<br/><input id="NewWorldName" type="text" size="25"/></p>', '<button id="CancelNewWorld" class="btn btn-default">Cancel</button><button id="CreateNewWorld" class="btn btn-success">Create</button>', '#NewWorldName','#CreateNewWorld');
          $('#CancelNewWorld').on('click', function() {
            hideModal();
          });
          $('#CreateNewWorld').on('click', function() {
            let worldName = $('#NewWorldName').val();
            if (!worldName || worldName=='') {
              $('#appModalError').text('Please specify a name.');
            }
            else {
              let retVal = window.contextBridge.toMainSync('world', 'CreateWorld', worldName);
              if (retVal.success) {
                let x = window.contextBridge.toMainSync('settings', 'Write', ['currentWorld',worldName]);
                hideModal();
                navigate('worldHome.html');
              }
              else {
                $('#appModalError').text(retVal.message);
              }
            }
          });
          break;
        default:
          break;
      }
    });
});

/*
function SelectWorld(world) {
  if (world && world!="")
  {
    window.contextBridge.toMain('setWorld', world);
    window.contextBridge.navigate('worldhome.html');
  }
  else {
    $(document).prop('title', 'Velox Mundi');
  }
  $('#world').text(world);
}
*/
