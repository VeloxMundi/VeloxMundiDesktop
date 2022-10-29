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
  const pageContent = $('#editor').text();
  window.contextBridge.saveChanges(pageContent);
  
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

