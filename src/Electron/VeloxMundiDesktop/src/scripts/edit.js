let mdFileName = '';
let docBaseTitle = '';

$(document).ready(function() {
  // load page contents in editor
  let pagePath = '';
  docBaseTitle = document.title;
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  for (var i=0; i<vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair[0].toLowerCase()=='page') {
      let getPage = window.contextBridge.toMainSync('world', 'GetPagePath', decodeURIComponent(pair[1]));
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
    let bdh = $('body').height();
    let newH = bdh-30;
    $('#editor').css({height:(newH)+'px'});
    $('#viewer').css({height:(newH)+'px'});
  }

  $('#editor').on('input propertychange', function() {
    $('#CancelButton').text('Cancel');
    $('#CancelButton').removeClass('btn-default');
    $('#CancelButton').addClass('btn-danger');
    pageDirty = true;
  });



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
      let saveResult = window.contextBridge.toMainSync('world', 'SavePage', {
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