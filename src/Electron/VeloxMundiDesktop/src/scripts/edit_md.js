let mdFileName = '';
let docBaseTitle = '';
let editorIndex = 0;
let pagePath = '';
let worldPath = '';
let worldDir = window.contextBridge.toMainSync('world', 'GetWorldDir');


$(document).ready(function() {
  fileExt = '.md';
  docBaseTitle = document.title;
  try {
    let query = window.location.search.substring(1);
    let vars = query.split('&');
    for (var i=0; i<vars.length; i++) {
      let pair = vars[i].split('=');
      if (pair[0].toLowerCase()=='path') {
        let pageData = window.contextBridge.toMainSync('page', 'GetPageData', {
          worldPath : decodeURIComponent(pair[1])
          });
        if (pageData && pageData.success) {
          pagePath = pageData.fullPath;
          pageName = pageData.rawFileName;
          pageType = pageData.pageType;
          worldPath = pageData.worldPath;
          console.log(pagePath);
          let contents = window.contextBridge.toMainSync('page', 'ReadPage', pagePath);
          $('#editor').text(contents.replace('/r/n','<br/>').replace('/r','<br/>'));
          pageDirty = false;
        }
        else {
          showToast((pageData && pageData.message ? pageData.message : 'Unable to load page'), 'text-danger');
        }
      }
      else if (pair[0].toLowerCase()=='name') {
        document.title = docBaseTitle + ' ' + decodeURIComponent(pair[1]);
      }
    }
  }
  catch(e) {
    navigate('worldHome.html');
  }

  $('#editor').trigger('focus');

  // set editor height
  OnWindowResize();

  $(window).on('resize', function() {
    OnWindowResize();
  });

  function OnWindowResize() {
    // Run this function any time the application window is resized
    $('body').height($('body').height()-30);
    let bdh = $('body').height();
    let tbh = $('#md-edit-toolbar').height();
    if (!tbh) {
      tbh=0;
    }
    let newH = bdh-tbh-15;
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

  $('#editor').on('input propertychange', function() {
    $('#CancelButton').text('Cancel');
    $('#CancelButton').removeClass('btn-default');
    $('#CancelButton').addClass('btn-danger');
    pageDirty = true;
  });


  $('#InsertImage').on('click', function() {
    editorIndex = document.getElementById('editor').selectionStart;
    showModal(
      {
        title: 'Insert Image', 
        body: 'Select from files<br/><button class="btn btn-default" id="BrowseForImage">Select Image</button><input type="hidden" id="ImagePath" value=""/><img src="" style="max-width:75px;max-height:75px; display:none;" id="ImagePreview"/><p>Image URL<br/><input type="text" id="InsertImageURL" value="" class="form-control"/></p>', 
        footer: '<button class="btn btn-default" id="CancelImageInsert">Cancel</button><button class="btn btn-success" id="InsertSelectedImage">Insert</button>', 
        callback: function() {
          $('#CancelImageInsert').on('click', function() {
            hideModal();
          });
          $('#BrowseForImage').on('click', function() {
            let files = window.contextBridge.toMainSync('ui', 'OpenFileDialog');
            if (files && files.length>0) {
              $('#ImagePath').val(files[0]);
              $('#ImagePreview').attr('src',files[0]);
              $('#ImagePreview').css('display','inline');
              $('#InsertSelectedImage').trigger('click');
            }
          });
          $('#InsertSelectedImage').on('click', function() {
            let imgPath = $('#ImagePath').val();
            let imgSrc = $('#InsertImageURL').val();
            if (imgPath && imgPath!='') {
              let saveResp = window.contextBridge.toMainSync('world', 'SaveAsset', imgPath);
              if (saveResp.success) {
                hideModal();
                let img = '![](<file:///' + saveResp.path.replace(/_/g,'\\_').replace(/ /g,'%20') + '>)\r\n';
                InsertInEditor(img);
              }
              else {
                $('#appModalError').text(resp.message);
              }
            }
            else if (imgSrc && imgSrc!='') {
              hideModal();
              let img = '![](' + imgSrc.replace(/_/g,'\\_').replace(/ /g,'%20') + ')\r\n';
              InsertInEditor(img);
            }
            else {
              window.contextBridge.toMainSync('ui', 'ShowMessage', {
                message: 'No Image Selected',
                type: 'error',
                buttons: ["OK"],
                defaultId: 0,
                title: "No Image",
                detail: "Please select an image or press [Cancel]"
              });
              $('#appModalError').text(x);
            }
          });
        }
      });

  });

  function InsertInEditor(toInsert) {
    let eContent = $('#editor').val();
    let newContent = eContent.slice(0,editorIndex) + toInsert + eContent.slice(editorIndex);
    $('#editor').val(newContent);
    pageDirty = true;
    updateResult();
  }

  

  $('#CancelButton').on('click', function() {
    window.contextBridge.navigate('worldHome.html');
  });

  window.contextBridge.fromMain('menu', (event, action, data) =>  {
    switch(action) {
      case 'Convert':
        if (pageDirty) {
          CheckPathAndSave();
        }
        else {
          if (!pageName || pageName=='') {
            navigate('new_HTML');
            break;
          }
          else {   
            let res = window.contextBridge.toMainSync('page', 'Convert', {
              fullPath : pagePath,
              oldFileType : 'md',
              newFileType : 'html',
              htmlContent : $('#viewer').html()
            });
            if (res.success) {
              navigate('edit_html.html', 'path=' + worldPath + '&name=' + pageName);
            }
            else {
              showToast(res.message, 'text-danger');
            }
          }
        }
        break;
      case 'DeletePage':
        // Prompt for confirmation
        showModal(
          {
            title: 'Confirm delete', 
            body: '<p>Are you sure you want to delete this page?</p><p><b>This cannot be undone!</b></p>',
            footer: '<button id="CancelDelete" class="btn btn-default">Cancel</button><button id="ConfirmDelete" class="btn btn-success">Delete</button>',
            callback: function() {
              $('#CancelDelete').on('click', function() {
                hideModal();
              });
              $('#ConfirmDelete').on('click', function() {
                modalLock(true);
                window.contextBridge.toMain('return', 'ConfirmDelete');
              });
            }
          });
        break;
      default:
        processMenuItem(action, data);
        break;
    }
  });

  
  window.SavePage = function() {
    $('#SaveButton').prop('disabled', 'true');
    $('#SaveButton').text('Saving...');
    try {
      const pageContents = $('#editor').val();
      const pageHTML = $('#viewer').html();
      let saveResult = window.contextBridge.toMainSync('page', 'SavePage', {
        'fullPath': pagePath,
        'pageContents': pageContents,
        'pageHTML' : pageHTML
        });
      if (saveResult.success)
      {
        showToast(saveResult.message, 'text-success');
        $('#CancelButton').text('Close');
        $('#CancelButton').removeClass('btn-danger');
        $('#CancelButton').addClass('btn-default');
        pageDirty = false;
      }
      else
      {
        showToast('There was an error saving changes:\r\n' + saveResult.message, 'text-danger');
      }
    }
    catch (e) {
      showToast(e, 'text-danger');
    }
    finally {
      $('#CancelButton').text('Close');
      $('#CancelButton').removeClass('btn-danger');
      $('#CancelButton').addClass('btn-default');
      $('#SaveButton').prop('disabled' , false);
      $('#SaveButton').text('Save');
    }
    if (closeAfterSave) {
      navigate('worldHome.html');
    }
    else if (navAfterSave!='') {
      navigate(navAfterSave);
    }
    else {
      $('#editor').trigger('focus');
    }
  }

  window.contextBridge.fromMain('SaveAsPath', (event, data) => {
    //$('#overlay').remove();
    if (data.success) {
      pageDirty=false;
      pagePath = data.path;
      let pageData = window.contextBridge.toMainSync('page', 'GetPageData', {
        fullPath : data.path
      });
      if (pageData && pageData.success) {
        pagePath = pageData.fullPath;
        pageType = pageData.pageType;
        pageName = pageData.rawFileName;
        worldPath = pageData.worldPath;
        document.title += ' ' + pageName;
        window.contextBridge.toMain('config', 'WriteKey', ['CurrentPage', 'edit.html?path=' + encodeURIComponent(pageData.worldPath)]);
        modalLock(false);
        hideModal();
        SavePage();
      }
      else {
        showToast((pageData && pageData.message ? pageData.message : 'Unable to get new page data'), 'text-danger');
      }
    }
    else {
      if (data.message!='') {
        showToast(data.message, 'text-danger');
        pagePath = ''; // Reset the page name so the user can try again.
      }
    }
  });

  window.contextBridge.fromMain('return', (event, method, data) => {
    switch(method) {
      case 'ConfirmDelete':
        let delResult = window.contextBridge.toMainSync('page', 'DeletePage', pagePath);
        if (delResult.success) {
          pageDirty = false;
          modalLock(false);
          hideModal();
          navigate('worldHome.html');
        }
        else {
          showToast(delResult.message, 'text-danger');
        }
        break;
      default:
        processReturn(method, data);
        break;
    }
  });



  updateResult(); // from mdEditorControl.js



  // Function to call to get the X and Y of the cursor in the textarea...From https://jh3y.medium.com/how-to-where-s-the-caret-getting-the-xy-position-of-the-caret-a24ba372990a
  const getCursorXY = (input, selectionPoint) => {
    const {
      offsetLeft: inputX,
      offsetTop: inputY,
    } = input;
    // create a dummy element that will be a clone of our input
    const div = document.createElement('div');
    // get the computed style of the input and clone it onto the dummy element
    const copyStyle = getComputedStyle(input);
    for (const prop of copyStyle) {
      div.style[prop] = copyStyle[prop];
    }
    const inputValue = input.value;
    // set the div content to that of the textarea up until selection
    const textContent = inputValue.substr(0, selectionPoint);
    // set the text content of the dummy element div
    div.textContent = textContent;
    div.style.height = 'auto';
    // create a marker element to obtain caret position
    const span = document.createElement('span');
    // give the span the textContent of remaining content so that the recreated dummy element is as close as possible
    span.textContent = inputValue.substr(selectionPoint) || '.';
    // append the span marker to the div
    div.appendChild(span);
    // append the dummy element to the body
    document.body.appendChild(div);
    // get the marker position, this is the caret position top and left relative to the input
    const { offsetLeft: spanX, offsetTop: spanY } = span;
    // lastly, remove that dummy element
    // NOTE:: can comment this out for debugging purposes if you want to see where that span is rendered
    document.body.removeChild(div);
    // return an object with the x and y of the caret. account for input positioning so that you don't need to wrap the input
    return {
      x: inputX + spanX,
      y: inputY + spanY,
    }
  }
  /*onkeyup refresh the contents but if you want it to be
  available for other events like paste etc. add these here*/
  $('#editor').on('keydown',function(e) {
    if (e.key==="@") {
      e.preventDefault();    
      $('#editor').attr('disabled','true');  
      
      const { x, y } = getCursorXY(document.querySelector('#editor'), $('#editor').prop('selectionStart'));

      let rngText = '';
      if (window.getSelection) {
        rngText = window.getSelection().toString();
      }
      // Set pageLinkModal left to x - editor offset
      $('#pageLinkModal').css('left',x-$('#editor').offset().left);

      // Set pageLinkModal top to y - editor height (new div appears below editor) - distance scrolled inside the textarea
      $('#pageLinkModal').css('top', y - $('#editor').height() - $('#editor').scrollTop());

      $('#pageLinkText').val(rngText);
      $('#pageLinkHref').val('');

      // Show the pageLinkModal
      $('#pageLinkModal').modal('show').on('shown.bs.modal', function() {
        $('#pageLinkHref').trigger('focus');
        $('#pageLinkModal').off('shown.bs.modal');
      });
    }
  });




  




  /*******************************
   * pageLinkModal listeners
  ********************************/

  $('#pageLinkText').on('keydown', function(e) {
    if (e.key==='Enter') {
      e.preventDefault();
      $('#pageLinkModal').modal('hide');
    }
  });

  $('#pageLinkModal').on('hidden.bs.modal', function() {
    let link = $('#pageLinkHref').val();
    let newCurPos = 0;
    if (link && link!='') {
      let pageData = window.contextBridge.toMainSync('page', 'GetPageDataFromNameDisambiguation',link);
      if (pageData && pageData.success) {
        let linkText = '[' + $('#pageLinkText').val() + '](<page:' + pageData.data.worldPath.replace(/ /g, '%20').replace(/_/g, '\\_') + '>)';
        var txtarea = document.getElementById("editor");
        var start = txtarea.selectionStart;
        var finish = txtarea.selectionEnd;
        var allText = txtarea.value;
        var newText=allText.substring(0, start)+linkText+allText.substring(finish, allText.length);
        txtarea.value=newText;
        newCurPos = start + linkText.length;
      }
      else {
        showToast((pageData && pageData.message ? pageData.message : 'Unable to find page data for ' + link + '.'),'text-danger');
      }
    }   

    $('#pageLinkHref').val('');
    $('#pageLinkText').val('');
    $('#editor').removeAttr('disabled');  
    $('#editor').trigger('focus');
    $('#editor').prop('selectionEnd', newCurPos);
  });










});


