let htmlFileName = '';
let docBaseTitle = '';
let pagePath = '';
let snRange = null;
let worldData = null;
let worldPages = null;
let pageRelPath = '';

$(document).ready(function() {
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
        /*,        
        onMouseup: function(e) {
          console.log('Click ' + e.pageX + '/' + e.pageY);
        }*/
      }
    }
  );
  
  $('a').on('click', function(e) {
    e.preventDefault();
  });

  function getCaretPosition(editableDiv) {
    var caretPos = 0,
      sel, range;

    /*else if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      if (range.parentElement() == editableDiv) {
        var tempEl = document.createElement("span");
        editableDiv.insertBefore(tempEl, editableDiv.firstChild);
        var tempRange = range.duplicate();
        tempRange.moveToElementText(tempEl);
        tempRange.setEndPoint("EndToEnd", range);
        caretPos = tempRange.text.length;
      }
    }
    */
    return caretPos;
  }
  $('.note-resizebar').hide();

  $('#pageLinkModal').on('hidden.bs.modal', function() {
    $('#editor').summernote('enable');
    $('#editor').summernote('editor.setLastRange', snRange);
    $('#editor').summernote('restoreRange');
    let link = $('#pageLinkHref').val();
    let pageData = window.contextBridge.toMainSync('page', 'GetPageDataFromNameDisambiguation',link);
    if (pageData && pageData.success) {
      let linkHtml = '<a href="file:///' + pageData.pageFullPath + '" class="internalLink">' + $('#pageLinkText').val() + '</a>';
      
      $('#editor').summernote('pasteHTML', linkHtml);
    }
    else {
      showToast((pageData && pageData.message ? pageData.message : 'Unable to find page data for ' + link + '.'),'text-danger');
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
      pageRelPath = decodeURIComponent(pair[1]);
      let getPage = window.contextBridge.toMainSync('page', 'GetPagePath', decodeURIComponent(pair[1]));
      if (getPage.success) {
        pagePath = getPage.path;
        console.log(pagePath);
        let contents = window.contextBridge.toMainSync('page', 'ReadPage', pagePath);
        $('#editor').summernote('code',contents);
        pageDirty = false;
      }
    }
    else if (pair[0].toLowerCase()=='name') {      
      document.title = docBaseTitle + ' ' + decodeURIComponent(pair[1]);
    }
  }

  $('#editor').trigger('focus');

  var converter = new showdown.Converter({ tables: true, strikethrough: true });


  // local variables
  let closeAfterSave=false;
  let navAfterSave='';

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
        showModal('Confirm delete', '<p>Are you sure you want to delete this page?</p><p><b>This cannot be undone!</b></p>','<button id="CancelDelete" class="btn btn-default">Cancel</button><button id="ConfirmDelete" class="btn btn-success">Delete</button>', '#ConfirmDelete');
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
          showModal('Rename ' + htmlFileName, '<div id="RenameError" class="text-danger"></div><p>New name:</p><p><input type="text" id="NewPageName" length="25"/></p>','<button id="CancelRename" class="btn btn-default">Cancel</button><button id="RenamePage" class="btn btn-success">Rename</button>','#NewPageName', '#RenamePage');
          $('#CancelRename').on('click', function() {
            hideModal();
          });
          $('#RenamePage').on('click', function() {
            let newPageName = $('#NewPageName').val();
            if (newPageName && newPageName!='') {
              let result = window.contextBridge.toMainSync('world', 'RenamePage', {
                'oldPageName': htmlFileName,
                'newPageName': newPageName
              });
              if (result.success) {
                htmlFileName = newPageName;
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
      let pageHTML = $('#editor').summernote('code');
      let pageContents = converter.makeMarkdown(pageHTML);
      let saveResult = window.contextBridge.toMainSync('page', 'SavePage', {
        'pageRelPath': pageRelPath,
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
      htmlFileName = pagePath.split('\\').pop().replace('.md','');
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
        let delResult = window.contextBridge.toMainSync('world', 'DeletePage', htmlFileName);
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




  worldData = window.contextBridge.toMainSync("world", "GetWorldData");
  worldPages = worldData.pages;























  /********************************
   * AUTOCOMPLETE                 *
  *********************************/
  function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
          /*check if the item starts with the same letters as the text field value:*/
          if (arr[i].NameDisambiguation.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].NameDisambiguation.substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].NameDisambiguation.substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i].NameDisambiguation + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
            b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                $('#pageLinkText').trigger('focus');
                if ($('#pageLinkText').val()=='') {
                  $('#pageLinkText').val(inp.value);
                  $('#pageLinkText').trigger('select');
                }
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            a.appendChild(b);
          }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (x && x.length>0) {
          if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
          } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
          } else if (e.key == 'Enter') {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
              /*and simulate a click on the "active" item:*/
              if (x) {
                x[currentFocus].click();
              }
              else {
                x[currentFocus].click();
              }
            }
            else {
              currentFocus=0;
              x[currentFocus].click();
            }
          }
        }
    });
    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
  }

  /*An array containing all the country names in the world:*/


  /*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
  autocomplete(document.getElementById("pageLinkHref"), worldPages);




});


