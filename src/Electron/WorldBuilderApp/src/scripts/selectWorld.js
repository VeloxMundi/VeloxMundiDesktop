
  $(document).ready(function() {
    let worldList = window.contextBridge.toMainSync('world', 'GetWorldLinks');
    $('#WorldList').prepend(worldList);

    $('.worldLink').on('click', function() {
      window.contextBridge.toMain('config', 'WriteKey', ['CurrentWorld', $(this).text()]);
      showToast('Set world to "' + $(this).text() + '." Navigating to world home...');
      window.contextBridge.navigate('worldHome.html');
    });

    $('#createWorld').on('click', function() {
      let resp = window.contextBridge.toMainSync('world', 'CreateWorld', $('#NewWorldName').val());
      showToast(resp[1], (resp[0] ? 'text-success': 'text-danger'));
      if (resp[0]) {
        window.contextBridge.navigate('worldHome.html');
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