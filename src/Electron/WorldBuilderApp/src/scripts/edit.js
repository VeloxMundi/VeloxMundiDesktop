$(document).ready(function() {
  // load page contents in editor
  let pagePath = '';
  let query = window.location.search.substring(1);
  let vars = query.split('&');
  for (var i=0; i<vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair[0].toLowerCase()=='path') {
      pagePath = decodeURIComponent(pair[1]);
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
    window.location.href="home.html";
  });

  $("#SaveButton").on('click', function() {
    $('#SaveButton').prop('disabled', 'true');
    $('#SaveButton').text('Saving...');
    let id = $('#pageId').val();
    const pageContent = $('#editor').html();
    let saveResult = window.contextBridge.toMainSync('world', 'SavePage', [{
      'pagePath': pagePath, 
      'pageContent': pageContent
      }]);
    if (saveResult[0]==1)
    {
      setMessage(saveResult[1]);
      $('#CancelButton').text('Close');  
      $('#CancelButton').removeClass('btn-danger');
      $('#CancelButton').addClass('btn-default');
    }
    else
    {
      setMessage('There was an error saving changes:\r\n' + saveResult[1], 'text-danger');
    }
    $('#editor').trigger('focus');
    
  });

  window.contextBridge.fromMain('saveResults', (event, data) => {
    
    $('#SaveButton').prop('disabled' , false);
    $('#SaveButton').text('Save');
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



  function setMessage(content, messageClass)
  {
    // This is temporary. Need to implement my own dialog boxes
    // using alert('message') in jquery breaks all input fields on the page until you click on another application and then come back to this one. This bizarre behavior means I have to implement my own messages.
    $('#Message').removeClass();
    $('#Message').text(content);
    if (messageClass!='')
    {
      $('#Message').addClass(messageClass);
    }
  }

  updateResult(); // from mdEditorControl.js
});