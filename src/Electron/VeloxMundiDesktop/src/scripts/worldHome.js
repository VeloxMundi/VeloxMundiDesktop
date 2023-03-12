
$(document).ready(function() {
  if (!world || world=='') {
    window.location='../pages/selectWorld.html';
  }
  else {
    console.log('if there is a world, it is ' + world);
    try {
      let worldData = window.contextBridge.toMainSync('world','GetWorldData');

      let types = Array.from(new Set(worldData.pages.map((item) => item.type))).sort();
      for (let i=0; i<types.length; i++) {
        if (types[i]!='') {
          $('#PageList').append('<p>&nbsp;</p><h4>' + types[i] + '</h4>\r\n');
        }
        $('#PageList').append('<ul>');
        let typePages = worldData.pages.filter(function(p) {
          return p.type==types[i];
        }).sort((a,b) => (
          (a.name>b.name) 
            ? 1
            :
              (a.name<b.name
                ? -1
                : 0
              )
        ));
        for (let j=0; j<typePages.length; j++) {
          $('#PageList').append('<li><a class="navLink" href="#" data-page="' + (typePages[j].fileType=='md' ? 'edit_md.html' : 'edit_html.html') + '" data-query="path='+encodeURIComponent(typePages[j].worldPath)+'&name=' + typePages[j].nameDisambiguation + '"><span class="bi bi-' + (typePages[j].fileType=='md' ? 'card-text' : 'globe') + '">&nbsp;</span>' + typePages[j].name + '</a></li>');
        }
        
        $('#PageList').append('</ul>');
      }
      

      document.title = world + ': ' + document.title;
    }
    catch(e) {
      showToast("Unable to load world data: " + e, "text-danger");
    }
  }

  HandleNavLinks();

  /***********
   * TESTING
  ************/
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