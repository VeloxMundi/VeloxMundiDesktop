let mdFileName = '';
let docBaseTitle = '';
let editorIndex = 0;
let pagePath = '';
let pageRelPath = '';
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
        pageRelPath = decodeURIComponent(pair[1]);
        let relPathParts = pageRelPath.split(pathSep);
        pageName = '';
        pageType = '';
        for (let i=0; i<relPathParts.length; i++) {
          if (i<relPathParts.length-1) {
            pageType += (pageType=='' || i==relPathParts.length-1 ? '' : pathSep) + relPathParts[i];
          }
          else {
            pageName = relPathParts[i];
          }
        }
        let getPage = window.contextBridge.toMainSync('page', 'GetPagePath', {
          relPath: (pageType && pageType!='' ? pageType + pathSep : '') + pageName,
          extension: 'md'
        });
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
              type : pageType,
              name : pageName,
              oldFileType : 'md',
              newFileType : 'html',
              htmlContent : $('#viewer').html()
            });
            if (res.success) {
              navigate('edit_html.html', 'path=' + pageRelPath + '&name=' + pageName);
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
        'pagePath': pagePath,
        'pageContents': pageContents,
        'pageHTML': pageHTML,
        'pageType': pageType,
        'pageName': pageName,
        'fileType': pagePath.split('.').pop()
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
      pageName = pagePath.split('\\').pop().replace('.md','');
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






  $('#pageLinkModal').on('mousemove', function(e) {
    //console.log(`MODAL X: ${e.pageX}, Y: ${e.pageY}`);
  });
  /**********TEST********/
  /*
  $("#editor").on("mousemove", function(e) {
    const $this = $(this);
    const x = e.pageX - $this.offset().left;
    const y = e.pageY - $this.offset().top;
    const position = getCaretPosition(this);
    const row = position.row;
    const col = position.col;
    console.log(`X: ${x}, Y: ${y}, Row: ${row}, Col: ${col}`);
  });
  function getCaretPosition(element) {
    const position = element.selectionStart;
    const text = element.value;
    let row = 1;
    let col = 0;
    for (let i = 0; i < position; i++) {
      if (text[i] === "\n") {
        row++;
        col = 0;
      } else {
        col++;
      }
    }
    return { row: row, col: col };
  }  
  */
  


  /********************************
   * Phantom div for positioning
  *********************************/
  function getCaretCoordinates() {
    // Create a div element with the same styles as the textarea
    var div = $('<div></div>');
    div.css({
      position: 'absolute',
      top: -9999,
      left: -9999,
      width: $('#editor').width(),
      fontSize: $('#editor').css('fontSize'),
      fontFamily: $('#editor').css('fontFamily'),
      fontWeight: $('#editor').css('fontWeight'),
      letterSpacing: $('#editor').css('letterSpacing'),
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    });
    var text = $('#editor').val();
    var lines = text.split('\n');
    var row = 0;
    var col = 0;
    let position = $('#editor').prop('selectionStart');
    for (var i = 0; i < lines.length && position >= lines[i].length; i++) {
      position -= lines[i].length + 1;
      if (position<0) {
        position = 0;
      }
      row++;
    }
    col = position;
    // Get the height of a row of text in the textarea
    var lineHeight = parseInt($('#editor').css('lineHeight'));
    if (isNaN(lineHeight)) {
      lineHeight = parseFloat($('#editor').css('fontSize')) * 1.2;
    }
    // Calculate the x and y coordinates of the cursor position
    div.text(text.substring(0, position));
    let newx = div.width();
    let newy = row * lineHeight;
    console.log(`NewX: ${newx}, NewY: ${newy}, position: ${position}`);
    // Add the column width times the column number to the x coordinate
    let selStart = $('#editor').prop('selectionStart');
    if (isNaN(selStart)) {
      selStart = 0;
    }
    newx = col * (newx / selStart);
    // Add the row height and the row number to the y coordinate
    /*
    newy += lineHeight;
    newy += (row - 1) * lineHeight;
    newy -= $('#editor').scrollTop();
    */
    console.log(`NewX2: ${newx}, NewY2: ${newy}, col: ${col}, row: ${row}, lineHeight: ${lineHeight}, scrollTop: ${$('#editor').scrollTop()}`);
    // Return the x and y coordinates
    return {x: newx, y: newy};
  }
  !function(){
    // create a test element to approximate the font size used in the editor:
    /*
    let tempEl = $('<span>').css({
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'pre'
    }).appendTo('body');
    tempEl.css({
      fontSize: $('#editor').css('fontSize'),
      fontFamily: $('#editor').css('fontFamily')
    });
    tempEl.text($('body').html());
    let fontWidth = tempEl.width() / $('body').html().length;
    tempEl.remove();
    */


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
        //let x = 0;
        //let y = 0;
        refreshContent(e.currentTarget.value);

        //$('#editor').summernote('disable');
        
        /********************
        TEST 1: https://jh3y.medium.com/how-to-where-s-the-caret-getting-the-xy-position-of-the-caret-a24ba372990a
        *********************/


        // Function to call to get the X and Y of the cursor in the textarea...
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
          // we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
          const swap = '.'
          const inputValue = input.value;
          // set the div content to that of the textarea up until selection
          const textContent = inputValue.substr(0, selectionPoint);
          // set the text content of the dummy element div
          div.textContent = textContent;
          if (input.tagName === 'TEXTAREA') 
          {
            div.style.height = 'auto';
          }
          /* Not needed, as we don't have an <input/>
          // if a single line input then the div needs to be single line and not break out like a text area
          if (input.tagName === 'INPUT') div.style.width = 'auto'
          */
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
        
        /******************************************************************************************************************************************************************************************************************************************************************************************/
        const { x, y } = getCursorXY(document.querySelector('#editor'), $('#editor').prop('selectionStart'));


        // End




        /*********************
        END TEST 1:
        **********************/
        let rngText = '';
        if (window.getSelection) {
          sel = window.getSelection();
          rngText = sel.toString();
        }
        
        $('#pageLinkModal').css('left',x-$('#editor').offset().left);
        let editorHeight = $('#editor').height();
        let scrollTop = $('#editor').scrollTop();
        $('#pageLinkModal').css('top',y-editorHeight-scrollTop);
        if (rngText && rngText!='') {
          $('#pageLinkText').val(rngText);
        }
        else {
          $('#pageLinkText').val('');
        }
        $('#pageLinkHref').val('');
        $('#pageLinkModal').modal('show').on('shown.bs.modal', function() {
          $('#pageLinkHref').trigger('focus');
          $('#pageLinkModal').off('shown.bs.modal');
        });

        /*
        */
          /*
          x = $('#editor').offset().left;
          y = $('#editor').offset().top;
          const position = document.getElementById('editor').selectionStart;
          const text = $('#editor').val();
          let row = 1;
          let col = 0;
          for (let i=0; i<position; i++) {
            if (text[i]==='\n') {
              row++;
              col = 0;
            }
            else {
              col++;
            }
          }
          let computedStyle = getComputedStyle(document.getElementById('editor'));
          let lineHeight = parseInt(computedStyle.getPropertyValue('line-height'));
          //console.log(`X: ${x}, Y: ${y}, PageX: ${e.pageX}, PageY: ${e.pageY}`);
          x += col * fontWidth; // This will not be exact...it assumes a mono-spaced font
          y += row * lineHeight;
          console.log(`X: ${x}, Y: ${y}, Row: ${row}, Col: ${col}, fontSize: ${fontWidth}, lineHeight: ${lineHeight}`);
          */


          /*
          let coords = getCaretCoordinates();
          x = coords.x - (coords.x>($('#editor').width()-($('#pageLinkModal').width()/2))
              ? $('#editor').position().x + $('#editor').width()-$('#pageLinkModal').width()
              : coords.x
          );
          y = coords.y;
          console.log(`X: ${x}, Y: ${y}`);
          */

          /*
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
          */
         /*
        }
        $('#pageLinkModal').css('left',x);
        $('#pageLinkModal').css('top',y);
        if (rngText && rngText!='') {
          $('#pageLinkText').val(rngText);
        }
        $('#pageLinkHref').val('');
        $('#pageLinkHref').trigger('focus');
        */
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
    if (link && link!='') {
      let pageData = window.contextBridge.toMainSync('page', 'GetPageDataFromNameDisambiguation',link);
      if (pageData && pageData.success) {
        let linkText = '[' + $('#pageLinkText').val() + '](<' + pageData.pageFullPath + '>)';
        var txtarea = document.getElementById("editor");
        var start = txtarea.selectionStart;
        var finish = txtarea.selectionEnd;
        var allText = txtarea.value;
        //var sel = allText.substring(start, finish);
        var newText=allText.substring(0, start)+linkText+allText.substring(finish, allText.length);
        txtarea.value=newText;
      }

      //$('#editor').summernote('pasteHTML', linkHtml);
    }
    else {
      showToast((pageData && pageData.message ? pageData.message : 'Unable to find page data for ' + link + '.'),'text-danger');
    }

    $('#pageLinkHref').val('');
    $('#pageLinkText').val('');

  });










});


