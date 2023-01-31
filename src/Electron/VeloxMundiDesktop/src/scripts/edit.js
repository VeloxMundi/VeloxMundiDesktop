let mdFileName = '';
let docBaseTitle = '';
let editorIndex = 0;

$(document).ready(function() {
  // load page contents in editor
  let pagePath = '';
  docBaseTitle = document.title;
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  for (var i=0; i<vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair[0].toLowerCase()=='page') {
      let getPage = window.contextBridge.toMainSync('page', 'GetPagePath', decodeURIComponent(pair[1]));
      if (getPage.success) {
        pagePath = getPage.path;
        console.log(pagePath);
        let contents = window.contextBridge.toMainSync('file', 'ReadFileToString', pagePath);
        $('#editor').text(contents);
        mdFileName = pagePath.split('\\').pop().replace('.md','');
        document.title = docBaseTitle + ' ' + mdFileName;
      }
      else {
        showToast(getPage.message, 'text-danger');
      }
    }
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
  }

  $('#editor').on('input propertychange', function() {
    $('#CancelButton').text('Cancel');
    $('#CancelButton').removeClass('btn-default');
    $('#CancelButton').addClass('btn-danger');
    pageDirty = true;
  });

  $('#InsertImage').on('click', function() {
    editorIndex = document.getElementById('editor').selectionStart;
    showModal('Insert Image','Select from files<br/><button class="btn btn-default" id="BrowseForImage">Select Image</button><input type="hidden" id="ImagePath" value=""/><img src="" style="max-width:75px;max-height:75px; display:none;" id="ImagePreview"/><p>Image URL<br/><input type="text" id="InsertImageURL" value="" class="form-control"/></p>','<button class="btn btn-default" id="CancelImageInsert">Cancel</button><button class="btn btn-success" id="InsertSelectedImage">Insert</button>');
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
        let resp = window.contextBridge.toMainSync('world', 'SaveAsset', imgPath);
        if (resp.success) {
          hideModal();
          let img = '![](' + imgPath.replace(/_/g,'\\_').replace(/ /g,'%20') + ')\r\n';
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
        let x = window.contextBridge.toMainSync('ui', 'ShowMessage', {
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

  });

  function InsertInEditor(toInsert) {
    let eContent = $('#editor').val();
    let newContent = eContent.slice(0,editorIndex) + toInsert + eContent.slice(editorIndex);
    $('#editor').val(newContent);
    pageDirty = true;
    updateResult();
  }

  // local variables
  let closeAfterSave=false;
  let navAfterSave='';

  $('#CancelButton').on('click', function() {
    window.contextBridge.navigate('worldHome.html');
  });

  window.contextBridge.fromMain('menu', (event, action) =>  {
    switch(action) {
      case 'SavePage':
        closeAfterSave = false;
        CheckPathAndSave();
        break;
      case 'ClosePage':
        closeAfterSave = true;
        navigate('worldHome.html');
        break;
      case 'SaveAndClose':
        closeAfterSave=true;
        CheckPathAndSave();
        break;
      case 'DeletePage':
        // Prompt for confirmation
        showModal('Confirm delete', '<p>Are you sure you want to delete this page?</p><p><b>This cannot be undone!</b></p>','<button id="CancelDelete" class="btn btn-default">Cancel</button><button id="ConfirmDelete" class="btn btn-success">Delete</button>');
        $('#CancelDelete').on('click', function() {
          hideModal();
        });
        $('#ConfirmDelete').on('click', function() {
          modalLock(true);
          window.contextBridge.toMain('return', 'ConfirmDelete');
        });
        break;
      case 'RenamePage':        
        if (pageDirty || pagePath=='') {
          showToast('Please save your changes before renaming the page.', 'text-danger');
          hideModal();
        }
        else {
          showModal('Rename ' + mdFileName, '<div id="RenameError" class="text-danger"></div><p>New name:</p><p><input type="text" id="NewPageName" length="25"/></p>','<button id="CancelRename" class="btn btn-default">Cancel</button><button id="RenamePage" class="btn btn-success">Rename</button>','#NewPageName', '#RenamePage');
          $('#CancelRename').on('click', function() {
            hideModal();
          });
          $('#RenamePage').on('click', function() {
            let newPageName = $('#NewPageName').val();
            if (newPageName && newPageName!='') {
              let result = window.contextBridge.toMainSync('world', 'RenamePage', {
                'oldPageName': mdFileName,
                'newPageName': newPageName
              });
              if (result.success) {
                mdFileName = newPageName;
                document.title = docBaseTitle + ' ' + newPageName;
                pagePath = result.newPagePath;
                hideModal();
                if (result.saveOnReturn) {
                  SavePage();
                }                
                else if (result.message && result.message!='') {
                  showToast(result.message, 'text-warning');
                }
                else {
                  showToast('File renamed successfully!', 'text-success');
                }
                window.contextBridge.toMain('config', 'WriteKey', ['CurrentPage', 'edit.html?path=' + encodeURIComponent(pagePath)]);
              }
              else {
                hideModal();
                showToast('There was a problem renaming the file.<br/>' + result.message, 'text-error');
              }
            }
            else {
              $('#RenameError').text('Please enter a new name');
            }
          });
        }
        break;
      default:
        break;
    }
  });

  function CheckPathAndSave() {
    
    if (pagePath=='') {
      showModal('Save as...','<input type="text" length="25" id="SaveAsName"/>', '<button class="btn btn-default" id="CancelSaveAs">Cancel</button><button class="btn btn-danger" id="SetSaveAs">Save</button>','#SaveAsName');
      $('#CancelSaveAs').on('click', function(e) {
        modalLock(false);
        hideModal();
      });
      $('#SetSaveAs').on('click', function(e) {
        modalLock(true);
        let saveAsName = $('#SaveAsName').val();
        if (saveAsName && saveAsName!='') {
          $('#CancelSaveAs').prop('disabled',true);
          $('#SetSaveAs').prop('disabled', true);
        
          window.contextBridge.toMain('world', 'SetSaveAsName', {
            'action': 'Save',
            'fileName': saveAsName
          });
        }
      });

      //$("body").append('<div id="overlay" style="background-color:rgba(211,211,211,.4);position:absolute;top:0;left:0;height:100%;width:100%;z-index:999"></div>');
      //window.contextBridge.toMain('world', 'GetSaveAsPath');
    }
    else {
      SavePage();
    }
  }

  function SavePage() {
    $('#SaveButton').prop('disabled', 'true');
    $('#SaveButton').text('Saving...');
    try {
      const pageContents = $('#editor').val();
      const pageHTML = $('#viewer').html();
      let saveResult = window.contextBridge.toMainSync('page', 'SavePage', {
        'pagePath': pagePath,
        'pageContents': pageContents,
        'pageHTML': pageHTML
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
      window.contextBridge.toMain('config', 'WriteKey', ['CurrentPage', 'edit.html?path=' + encodeURIComponent(data.path)]);
      mdFileName = pagePath.split('\\').pop().replace('.md','');
      modalLock(false);
      hideModal();
      SavePage();
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
      case 'SaveAndNavigate':
        modalLock(false);
        hideModal();
        navAfterSave = data;
        CheckPathAndSave();
        break;
      case 'ConfirmDelete':
        let delResult = window.contextBridge.toMainSync('world', 'DeletePage', mdFileName);
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
        break;
    }
  });

  /*
  function tempFx() {
    modalLock(false);
    hideModal();
    $('#CancelSaveAs').prop('disabled',false);
    $('#SetSaveAs').prop('disabled', false);
  }
  */


  /*
  window.contextBridge.fromMain('saveResults', (event, data) => {


    if (data[0]==1)
    {
      setMessage('Saved successfully!');
      $('#CancelButton').text('Close');
      $('#CancelButton').removeClass('btn-danger');
      $('#CancelButton').addClass('btn-default');
    }
    else
    {
      setMessage('There was an error saving changes:\r\n' + data[1], 'text-danger');
    }
    $('#editor').trigger('focus');
  });
  */


  updateResult(); // from mdEditorControl.js
});