
$(document).ready(function() {
  if (!world || world=='') {
    window.location='../pages/selectWorld.html';
  }
  else {
    console.log('if there is a world, it is ' + world);
    let pages = window.contextBridge.toMainSync('world','GetWorldPages');
    for (let i=0; i<pages.length; i++) {
      let pageName = pages[i].name.replace('.md', '').replace(/([A-Z])/g, ' $1').replace(/([0-9][a-zA-Z])/g, ' $1').replace(/([a-z])([0-9])/g, '$1 $2').replace(/([_.])/g, ' ').trim();
      $('#PageList').append('<li><a href="edit.html?path='+encodeURIComponent(pages[i].path)+'">' + pageName + '</a></li>');
    }

    document.title += ' ' + world;
  }
});