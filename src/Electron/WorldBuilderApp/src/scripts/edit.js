let mdFileName = '';

$(document).ready(function() {
  // load page contents in editor
  let pagePath = '';
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  for (var i=0; i<vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair[0].toLowerCase()=='path') {
      pagePath = decodeURIComponent(pair[1]);
      console.log(pagePath);
      let contents = window.contextBridge.toMainSync('file', 'ReadFileToString', pagePath);
      $('#editor').text(contents);
      mdFileName = pagePath.split('\\').pop().replace('.md','');
      document.title += ' ' + mdFileName;
    }
  }

  // set editor height
  OnWindowResize();

  $(window).on('resize', function() {
    OnWindowResize();
  });

  function OnWindowResize() {
    // Run this function any time the application window is resized
    let tbh = $('#toolbar').height();
    let bdh = $('body').height();
    let newH = bdh-tbh-30;
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
        navigate('worldHome.html');
        break;
      case 'SaveAndClose':
        closeAfterSave=true;
        CheckPathAndSave();
        break;
      case 'DeletePage':
        // Prompt for confirmation
        let delResult = window.contextBridge.toMainSync('world', 'DeletePage', mdFileName);
        if (delResult.success) {
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

  function CheckPathAndSave() {
    if (pagePath=='') {
      $("body").append('<div id="overlay" style="background-color:rgba(211,211,211,.4);position:absolute;top:0;left:0;height:100%;width:100%;z-index:999"></div>');
      window.contextBridge.toMain('world', 'GetSaveAsPath');
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
    else {
      $('#editor').trigger('focus');
    }
  }

  window.contextBridge.fromMain('SaveAsPath', (event, data) => {
    $('#overlay').remove();
    if (data.success) {
      pagePath = data.path;
      window.contextBridge.toMain('config', 'WriteKey', ['CurrentPage', 'edit.html?path=' + encodeURIComponent(data.path)]);
      mdFileName = pagePath.split('\\').pop().replace('.md','');
      SavePage();
    }
    else {
      if (data.message!='') {
        showToast(data.message, 'text-danger');
        pagePath = ''; // Reset the page name so the user can try again.
      }    
    }
  });




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