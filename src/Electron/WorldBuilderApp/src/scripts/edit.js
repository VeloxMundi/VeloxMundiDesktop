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
    }
  }

  // set editor height
  OnWindowResize();

  $(window).on('resize', function() {
    OnWindowResize();
  })

  function OnWindowResize() {
    // Run this function any time the application window is resized
    let tbh = $('#toolbar').height();
    let brh = $('.breadcrumbs').height();
    let bdh = $('body').height();
    let newH = bdh-brh-tbh-50;
    $('#editor').css({height:(newH)+'px'});
    $('#viewer').css({height:(newH)+'px'});
  }

  $('#editor').on('input propertychange', function() {
    $('#CancelButton').text('Cancel');
    $('#CancelButton').removeClass('btn-default');
    $('#CancelButton').addClass('btn-danger');

  })

  $('#CancelButton').on('click', function() {
    window.contextBridge.navigate('worldHome.html');
  });

  $("#SaveButton").on('click', function() {
    if (pagePath=='') {
      $("body").append('<div id="overlay" style="background-color:rgba(211,211,211,.4);position:absolute;top:0;left:0;height:100%;width:100%;z-index:999"></div>');
      window.contextBridge.toMain('world', 'GetSaveAsPath');
    }
    else {
      SavePage();
    }
  });

  function SavePage() {    
    $('#SaveButton').prop('disabled', 'true');
    $('#SaveButton').text('Saving...');    
    try {
      const pageContents = $('#editor').val();
      let saveResult = window.contextBridge.toMainSync('world', 'SavePage', {
        'pagePath': pagePath,
        'pageContents': pageContents
        });
      if (saveResult[0])
      {
        showToast(saveResult[1], 'text-success');
        $('#CancelButton').text('Close');
        $('#CancelButton').removeClass('btn-danger');
        $('#CancelButton').addClass('btn-default');
      }
      else
      {
        showToast('There was an error saving changes:\r\n' + saveResult[1], 'text-danger');
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
    $('#editor').trigger('focus');
  }

  window.contextBridge.fromMain('SaveAsPath', (event, data) => {
    $('#overlay').remove();
    pagePath = data;
    if (pagePath!='') {
      SavePage();
    }
    else {
      showToast('Unable to determine file name. Save was unsuccessful. Please try again.', 'text-danger');
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