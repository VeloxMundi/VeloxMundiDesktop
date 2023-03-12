setPageInConfig=false;
let pageName = '';
let pageType = '';
let pagePath = '';
let worldPath = '';


$(function(e) {
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  for (var i=0; i<vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair[0].toLowerCase()=='path') {
      let pageData = window.contextBridge.toMainSync('page', 'GetPageData', {
        worldPath : decodeURIComponent(pair[1])
      });
      if (pageData.success) {
        pageName = pageData.rawPageName;
        pageType = pageData.pageType;
        pagePath = pageData.fullPath;
        worldPath = pageData.worldPath;
        console.log(pagePath);
        let contents = window.contextBridge.toMainSync('page', 'ReadPage', pagePath);
        $('#editor').val(converter.makeMarkdown(contents.replace(/_/g,'\\_')));
        updateResult();
        pageDirty = false;
      }
    }
    else if (pair[0].toLowerCase()=='name') {
      pageNameDisambiguation = decodeURIComponent(pair[1]).replace(pathSep,typeSep);
      document.title = pageNameDisambiguation + ' ' + document.title;
    }
  }

  
  OnWindowResize();

  $(window).on('resize', function() {
    OnWindowResize();

  });

  function OnWindowResize() {
    // Run this function any time the application window is resized
    if ($('body').height() > document.height-30) {
      $('body').height(document.height-30);
    }
    let bdh = $('body').height();
    let tbh = $('#preview_htmlToMd-toolbar').height();
    if (!tbh) {
      tbh=0;
    }
    let newH = bdh-tbh-45;
    $('#editor').css({height:(newH)+'px'});
    $('#viewer').css({height:(newH)+'px'});
    $('#phantom').css({height:(newH)+'px'});

    //match phantom styles to editor
    let sourceNode = document.getElementById('editor');
    let targetNode = document.getElementById('phantom');

    var computedStyle = window.getComputedStyle(sourceNode);
    Array.from(computedStyle).forEach(function (key) {
      return targetNode.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key));
    });
    targetNode.style.setProperty('visibility','hidden');
    targetNode.style.setProperty('position','absolute');
    targetNode.style.setProperty('display','inline-block');
    targetNode.style.setProperty('word-wrap','break-word');
  }





  $('#AcceptConversion').on('click', function(e) {
    e.preventDefault();
    let res = window.contextBridge.toMainSync('page', 'Convert', {
      fullPath : pagePath,
      oldFileType : 'html',
      newFileType : 'md',
      mdContent : $('#editor').val()
    });
    if (res.success) {
      navigate('edit_md.html', 'path=' + worldPath + '&name=' + pageName);
      window.contextBridge.toMain('closeWindow', 'Preview');
    }
    else {
      showToast(res.message, 'text-danger');
    }
  });

  $('#CancelConversion').on('click', function(e) {
    e.preventDefault();
    window.contextBridge.toMain('closeWindow', 'Preview');
  });
});