let mdFileName = '';
let docBaseTitle = '';
let editorIndex = 0;
let worldPages = null;
let pageRelPath = '';

$(document).ready(function() {
  // load page contents in editor
  /*
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
  */
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
        $('#editor').text(contents.replace('/r/n','<br/>').replace('/r','<br/>'));
        pageDirty = false;
      }
    }
    else if (pair[0].toLowerCase()=='name') {
      document.title = docBaseTitle + ' ' + decodeURIComponent(pair[1]);
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












  /********************************
   * Set up autocomplete list
  *********************************/
  worldData = window.contextBridge.toMainSync("world", "GetWorldData");
  worldPages = worldData.pages;


  /********************************
   * Phantom div for positioning
  *********************************/
  !function(){
    /*text area element*/
    var someInput = document.getElementById("editor"),
    /*a hidden div that has the same with height including border/padding values
    of the text area, but is hidden behind, its contents should always be the same*/
        phantom = document.getElementById("phantom"),
        /*a span to reuse for cloning*/
        span = document.createElement("span");
    /*get coordinates of the current caret*/
    someInput.getCurrentCoordinates = function(){
        var index = this.selectionStart,
            inputRect = this.getBoundingClientRect();
            charRect = phantom.children[index].getBoundingClientRect();
        return {
            top:charRect.top,
            left:charRect.left,
            relTop:charRect.top - inputRect.top,
            relLeft:charRect.left - inputRect.left,
            width:charRect.width
        };
    };
    /*onkeyup refresh the contents but if you want it to be
    available for other events like paste etc. add these here*/
    someInput.addEventListener("keydown",function(e){
      if (e.key==="@") {
        e.preventDefault();
        let x = 0;
        let y = 0;
        refreshContent(e.currentTarget.value);
        //$('#editor').summernote('disable');
        $('#pageLinkModal').modal('show');
        //NOTE: If the #pageLinkModal has the class "fade", this will not work. That class makes modal('show') or modal('hide') run asynchronously, which breaks the following code...
        let rngText = '';
        if (window.getSelection) {
          sel = window.getSelection();
          rngText = sel.toString();
          if (sel.rangeCount) {
            let editorWindow = $('#editorViewer');
            let edp = editorWindow.position();
            let edw = edp.left+editorWindow.width();
            let plmw = $('#pageLinkModalContent').width();

            //TODO: Try this to get XY: https://hashnode.com/post/how-do-you-get-the-position-of-the-cursor-in-pixelsinside-a-textarea-cje14wjck0d1om3wtvfem6ofg
            let rg = sel.getRangeAt(0);
            let rect = someInput.getCurrentCoordinates();
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
    },false);
    /*clear children*/
    function removeChildren(node){
        while(node.hasChildNodes()){
            node.removeChild(node.lastChild);
        }
    }
    /*clone a single span, put a letter in it and append*/
    function refreshContent(text){
        removeChildren(phantom);
        text.split("").forEach(function(d,i){
            span.textContent = d;
            phantom.appendChild(span.cloneNode(true))
        });
    }
  }();

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
    let pageData = window.contextBridge.toMainSync('page', 'GetPageDataFromNameDisambiguation',link);
    if (pageData && pageData.success) {
      let linkText = '[' + $('#pageLinkText').val() + '](<' + pageData.pageFullPath + '>)';
      var txtarea = document.getElementById("editor");
      var start = txtarea.selectionStart;
      var finish = txtarea.selectionEnd;
      var allText = txtarea.value;
      var sel = allText.substring(start, finish);
      var newText=allText.substring(0, start)+linkText+allText.substring(finish, allText.length);
      txtarea.value=newText;

      //$('#editor').summernote('pasteHTML', linkHtml);
    }
    else {
      showToast((pageData && pageData.message ? pageData.message : 'Unable to find page data for ' + link + '.'),'text-danger');
    }

    $('#pageLinkHref').val('');
    $('#pageLinkText').val('');

  });


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