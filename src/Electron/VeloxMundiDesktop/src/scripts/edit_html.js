let docBaseTitle = '';
let pagePath = '';
let worldPath = '';
let snRange = null;

$(document).ready(function() {
  fileExt = '.html';
  //window.contextBridge.toMain('world','GetAllPages');
  $('#editor').summernote(
    {
      callbacks: {
        onImageUpload: function (files, editor, welEditable) {
          let saveImg = window.contextBridge.toMainSync('world', 'SaveAsset', files[0].path);
          if (saveImg.success) {
            $img = $('<img>').attr({src: saveImg.path});
            $('#editor').summernote('insertNode', $img[0]);
          }
          pageDirty = true;
        },
        onChange: function(contents, $editable) {
          pageDirty = true;
          $('a').on('click', function(e) {
            e.preventDefault();
          });
        },
        onChangeCodeview: function(contents, $editable) {
          pageDirty = true;
        },
        onKeydown: function(e) {
          if (e.key==="@") {
            e.preventDefault();
            $('#editor').summernote('saveRange');
            snRange = $('#editor').summernote('editor.getLastRange');
            $('#editor').summernote('disable');
            $('#pageLinkModal').modal('show');
            //NOTE: If the #pageLinkModal has the class "fade", this will not work. That class makes modal('show') or modal('hide') run asynchronously, which breaks the following code...
            let rngText = '';
            if (window.getSelection) {
              sel = window.getSelection();
              rngText = sel.toString();
              if (sel.rangeCount) {
                let editorWindow = $('.note-editable.card-block');
                let edp = editorWindow.position();
                let edw = edp.left+editorWindow.width();
                let plmw = $('#pageLinkModalContent').width();


                let rg = sel.getRangeAt(0);
                let rect = rg.getClientRects()[0];
                x = rect.left;
                y = rect.top;

                if (x+plmw>edw) {
                  x=edw-plmw;
                }


              }
            }
            $('#pageLinkModal').css('left',x);
            $('#pageLinkModal').css('top',y);
            if (rngText && rngText!='') {
              $('#pageLinkText').val(rngText);
            }
            $('#pageLinkHref').val('');
            $('#pageLinkHref').trigger('focus');
          }
        }
      }
    }
  );
  
  $('a').on('click', function(e) {
    e.preventDefault();
  });

  /*
  function getCaretPosition(editableDiv) {
    var caretPos = 0,
      sel, range;

    return caretPos;
  }
  */

  $('.note-resizebar').hide();

  $('#pageLinkModal').on('hidden.bs.modal', function() {
    $('#editor').summernote('enable');
    $('#editor').summernote('editor.setLastRange', snRange);
    $('#editor').summernote('restoreRange');
    let link = $('#pageLinkHref').val();
    if (link && link!='') {
      let pageData = window.contextBridge.toMainSync('page', 'GetPageDataFromNameDisambiguation',link);
      if (pageData && pageData.success) {
        let linkHtml = '<a href="page:' + pageData.data.worldPath + '" class="internalLink">' + $('#pageLinkText').val() + '</a>';
        $('#editor').summernote('pasteHTML', linkHtml);
      }
      else {
        showToast((pageData && pageData.message ? pageData.message : 'Unable to find page data for ' + link + '.'),'text-danger');
      }
    }
    
    $('#pageLinkHref').val('');
    $('#pageLinkText').val('');

  });
  $('#pageLinkText').on('keydown', function(e) {
    if (e.key==='Enter') {
      e.preventDefault();
      $('#pageLinkModal').modal('hide');
    }
  });

  docBaseTitle = document.title;
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
        $('#editor').summernote('code',contents);
        pageDirty = false;
      }
      else {
        showToast((pageData && pageData.message ? pageData.message : 'Unable to load page.'), 'text-danger');
      }
    }
    else if (pair[0].toLowerCase()=='name') {      
      pageNameDisambiguation = decodeURIComponent(pair[1]).replace(pathSep,typeSep);
      document.title = pageNameDisambiguation + ' ' + docBaseTitle;
    }
  }

  $('#editor').summernote('focus');

  //var converter = new showdown.Converter({ tables: true, strikethrough: true });



  // set editor height
  OnWindowResize();

  $(window).on('resize', function() {
    OnWindowResize();
  });

  function OnWindowResize() {
    // Run this function any time the application window is resized
    let bdh = $(window).height();
    let newH = bdh-90;
    $('.note-editable.card-block').each(function() {
          $(this).css({height:(newH)+'px'});
          $(this).css({'max-height':(newH)+'px'});
        }
    );

  }







  window.contextBridge.fromMain('menu', (event, action, data) =>  {
    switch(action) {
      case 'DeletePage':
        // Prompt for confirmation
        showModal(
          {
            title: 'Confirm delete', 
            body: '<p>Are you sure you want to delete this page?</p><p><b>This cannot be undone!</b></p>',
            footer: '<button id="CancelDelete" class="btn btn-default">Cancel</button><button id="ConfirmDelete" class="btn btn-success">Delete</button>',
            focus: '#ConfirmDelete',
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
      /*
      case 'RenamePage':
        showModal(
          {
            title: 'Rename ' + pageType + pathSep + pageName, 
            body: '<div id="RenameError" class="text-danger"></div><p>New name:</p><p><input type="text" id="NewPageName" length="25" value="' + pageType + pathSep + pageName + '"/></p>',
            footer: '<button id="CancelRename" class="btn btn-default">Cancel</button><button id="RenamePage" class="btn btn-success">Rename</button>',
            focus: '#NewPageName', 
            confirmButton: '#RenamePage',
            callback: function() {
              $('#CancelRename').on('click', function() {
                hideModal();
              });
              $('#RenamePage').on('click', function() {
                SavePage();
                let newPageName = $('#NewPageName').val();
                if (newPageName && newPageName!='') {
                  let result = window.contextBridge.toMainSync('page', 'RenamePage', {
                    'oldPagePath': pagePath,
                    'newPageName': newPageName
                  });
                  hideModal();
                  if (result.success) {
                    document.title = docBaseTitle + ' ' + newPageName;
                    pagePath = result.newPagePath;
                    window.contextBridge.toMain('config', 'WriteKey', ['CurrentPage', 'edit' + (fileExt=='.md' ? '_md' : '_html') + '.html?path=' + encodeURIComponent(pagePath)]);
                    pageName = result.newPageName;
                    pageType = result.newPageType;              
                    SavePage();
                    showToast('File renamed successfully!', 'text-success');
                  }
                  else if (result.message && result.message!='') {
                    showToast('There was a problem renaming the file.<br/>' + result.message, 'text-error');
                  }
                  else {
                    showToast('There was a problem renaming the file.', 'text-danger');
                  }
                }
                else {
                  $('#RenameError').text('Please enter a new name');
                }
              });
            }
          });
        break;
        */
      case 'Convert':
        if (pageDirty) {
          CheckPathAndSave();
        }

        if (!pageName || pageName=='') {
          navigate('new_MD');
          break;
        }
        else {        
          navigate('preview_htmlToMd.html','path=' + worldPath + '&name=' + pageNameDisambiguation);
        }
        break;
      default:
        processMenuItem(action, data);
        break;
    }
  });

  /*
  function CheckPathAndSave() {

    if (pagePath=='') {
      showModal(
        {
          title: 'Save as...',
          body: '<input type="text" length="25" id="SaveAsName"/>',
          footer: '<button class="btn btn-default" id="CancelSaveAs">Cancel</button><button class="btn btn-danger" id="SetSaveAs">Save</button>',
          focus: '#SaveAsName',
          callback: function() {
            modalLock(true);
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

                window.contextBridge.toMain('page', 'SetSaveAsName', {
                  'action': 'Save',
                  'fileName': saveAsName
                });
              }
            });
          }
        }
      );
    }
    else {
      SavePage();
    }
  }
  */
  window.SavePage = function() {
    $('#SaveButton').prop('disabled', 'true');
    $('#SaveButton').text('Saving...');
    try {
      let pageHTML = $('#editor').summernote('code');
      //let pageContents = converter.makeMarkdown(pageHTML);
      let saveResult = window.contextBridge.toMainSync('page', 'SavePage', {
        'fullPath': pagePath,
        'pageContents': pageHTML,
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
        window.contextBridge.toMain('settings', 'Write', ['currentPage', 'edit.html?path=' + encodeURIComponent(pageData.worldPath)]);
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
      case 'SaveAndNavigate':
        modalLock(false);
        hideModal();
        navAfterSave = data;
        CheckPathAndSave();
        break;
      case 'ConfirmDelete':
        let delResult = window.contextBridge.toMainSync('page', 'DeletePage', pagePath);
        if (delResult.success) {
          pageDirty = false;
          modalLock(false);
          hideModal();
          navigate('worldHome.html');
        }
        else {
          hideModal();
          showToast(delResult.message, 'text-danger');
        }
        break;
      default:
        break;
    }
  });






























});


