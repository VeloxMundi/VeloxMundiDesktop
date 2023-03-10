setPageInConfig = false;

$(document).ready(function() {
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  for (var i=0; i<vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair[0].toLowerCase()=='path') {
      let pageData = window.contextBridge.toMainSync('page','GetPageData',{
        fullPath: decodeURIComponent(pair[1])
      }
      );
      if (pageData.success) {
        window.location = 'file:///' + pageData.previewPath;
      }
      else {
      showToast('Unable to preview page.<br/>' + (pageData.message ?? ''), 'text-danger');
      } 
    }
  }
  
});