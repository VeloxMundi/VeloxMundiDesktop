$(document).ready(function() {
  /***********
   * TESTING
  ************/
  let x = window.contextBridge.toMainSync('data', 'checkWorldDb');
  $('#testRelPath').on('click', function() {
    modalLock(false);
    showModal({
      title: 'Test RelPath',
      body: 'From: <input id="FromPath" type="text" size="20"/><br/>To: <input id="ToPath" type="text" size="20"/><br/>IsRel?:<input type="text" id="IsFullPath" size="20"/>',
      footer: '<button class="btn btn-success" id="DoTest">Test<lbutton>',
      focus: '#FromPath',
      defaultButton: '#DoTest',
      callback: function() {
        $('#DoTest').on('click', function(e) {
          e.preventDefault();
          let relPath = window.contextBridge.toMainSync('world','GetRelPath', {
                isRelPath: ($('#IsFullPath').val()=='true' ? true : false),
                fromPath: $('#FromPath').val(),
                toPath: $('#ToPath').val()
          });
          if (relPath.success) {

          }
        });
      }
    });
  });

  $('#testFullPath').on('click', function() {
    modalLock(false);
    showModal({
      title: 'Test FullPath',
      body: 'FromFull: <input type="text" id="FromFullPath" size="20"/><br/>ToRel: <input type="text" id="ToRelPath" size="20"/>',
      footer: '<button class="btn btn-success" id="DoTest2">Test</button>',
      focus: '#FromFullPath',
      defaultButton: '#DoTest2',
      callback: function() {
        $('#DoTest2').on('click', function(e) {
          e.preventDefault();
          let fullPath = window.contextBridge.toMainSync('world', 'GetFullPathFromRelPath', {
            fromFullPath: $('#FromFullPath').val(),
            relPath: $('#ToRelPath').val()
          });
          if (fullPath.success) {

          }
        });
      }
    })
  });
});