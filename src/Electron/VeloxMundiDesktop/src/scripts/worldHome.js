
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
          $('#PageList').append('<li><a class="navLink" href="#" data-page="' + (typePages[j].fileType=='md' ? 'edit_md.html' : 'edit_html.html') + '" data-query="path='+encodeURIComponent(typePages[j].worldPath)+'&name=' + typePages[j].nameDisambiguation + '"><span class="bi bi-' + (typePages[j].fileType=='md' ? 'filetype-md' : 'filetype-html') + '">&nbsp;</span>' + typePages[j].name + '</a></li>');
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

  

});