
let pageName = '';
let pageNameDisambiguation = '';
let pageType = '';
let closeAfterSave=false;
let navAfterSave='';
let fileExt = '';
let worldData = null;
let worldPages = null;

window.processMenuItem = function(menuItem, data) {
  switch (menuItem) {
    case 'SavePage':
      setStatus('Saving...');
      closeAfterSave = false;
      CheckPathAndSave();
      break;
    case 'ClosePage':
      closeAfterSave = true;
      navigate('worldHome.html');
      break;
    case 'SaveAndClose':      
      setStatus('Saving...');
      closeAfterSave=true;
      CheckPathAndSave();
    break;
    case 'RenamePage':
      if (pageDirty || pagePath=='') {
        showToast('Please save your changes before renaming the page.', 'text-danger');
        hideModal();
      }
      else {
        setStatus('Waiting for page name...');
        showModal(
          {
            title: 'Rename ' + pageName, 
            body: '<div id="RenameError" class="text-danger"></div><p>New name:</p><p><input type="text" id="NewPageName" length="25" value="' + (pageType!='' ? pageType + pathSep : '') + pageName + '"/></p>',
            footer: '<button id="CancelRename" class="btn btn-default">Cancel</button><button id="RenamePage" class="btn btn-success">Rename</button>',
            focus: '#NewPageName', 
            defaultButton: '#RenamePage',
            callback: function() {
              $('#CancelRename').on('click', function() {
                hideModal();
                setStatus('Ready');
              });
              $('#RenamePage').on('click', function() {
                SavePage();
                let newPageName = $('#NewPageName').val();
                if (newPageName && newPageName!='') {
                  let result = window.contextBridge.toMainSync('page', 'RenamePage', {
                    'oldPagePath': pagePath,
                    'newPageName': newPageName
                  });
                  if (result.success) {
                    document.title = docBaseTitle + ' ' + newPageName;
                    pagePath = result.newPagePath;  
                    pageName = result.newPageName;
                    pageType = result.newPageType;                  
                    window.contextBridge.toMain('settings', 'Write', ['currentPage', 'edit' + (fileExt=='.md' ? '_md' : '_html') + '.html?path=' + encodeURIComponent(pagePath)]);
                    SavePage();
                    hideModal();
                    showToast('File renamed successfully!', 'text-success');
                    setStatus('Ready');
                  }
                  else if (result.message && result.message!='') {
                    $('#RenameError').text('There was a problem renaming the file.<br/>' + result.message);
                  }
                  else {
                    $('#RenameError').text('There was a problem renaming the file.');
                  }
                }
                else {
                  $('#RenameError').text('Please enter a new name');
                }
              });
            }
          }
        );
      }
      break;
    case 'Preview':
      setStatus('Saving...');
      CheckPathAndSave();
      setStatus('Generating preview');
      navigate('preview_page.html','path=' + pagePath);
      setStatus('Ready');
      break;
    default:
      break;
  }
}

window.processReturn = function(method, data) {
  switch (method) {    
    case 'SaveAndNavigate':
      modalLock(false);
      navAfterSave = data;
      CheckPathAndSave();
      break;
    default:
      break;
  }
}



window.CheckPathAndSave = function() {
  if (pagePath=='') {
    showModal(
      {
        title: 'Save as...',
        body: '<input type="text" length="25" id="SaveAsName"/>',
        footer: '<button class="btn btn-default" id="CancelSaveAs">Cancel</button><button class="btn btn-danger" id="SetSaveAs">Save</button>',
        focus: '#SaveAsName',
        defaultButton: '#SetSaveAs',
        callback: function() {
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
                'fileName': saveAsName + fileExt
              });
            }
          });
        }
      });
  }
  else {
    SavePage();
  }
}





























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
        if (arr[i].nameDisambiguation.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].nameDisambiguation.substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].nameDisambiguation.substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i].nameDisambiguation + "'>";
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
