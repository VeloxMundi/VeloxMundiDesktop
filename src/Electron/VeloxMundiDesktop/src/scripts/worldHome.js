
$(document).ready(function() {
  if (!world || world=='') {
    window.location='../pages/selectWorld.html';
  }
  else {
    console.log('if there is a world, it is ' + world);
    try {
      let worldData = window.contextBridge.toMainSync('world','GetWorldData');
      let pages = worldData.pages;

      for (let i=0; i<pages.length; i++) {
        let pPath = pages[i].RelPath + pages[i].Name;
        let pName = pPath.replace('.md', '').replace(/([A-Z])/g, ' $1').replace(/([0-9][a-zA-Z])/g, ' $1').replace(/([a-z])([0-9])/g, '$1 $2').replace(/([_.])/g, ' ').trim();
        $('#PageList').append('<li><a class="navLink" href="#" data-page="edit.html" data-query="page='+encodeURIComponent(pPath)+'">' + pName + '</a></li>');
      }

      document.title += ' ' + world;
    }
    catch(e) {
      showToast("Unable to load world data: " + e, "text-danger");
    }
  }

  HandleNavLinks();

});