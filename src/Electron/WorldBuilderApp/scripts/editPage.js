
$('#CancelButton').on('click', function() {
  window.location.href="home.html";
});

$("#SaveButton").on('click', function() {
  alert(`Pretending to save...node v${window.actions.node()}`);
  let retVal = getResults();
  alert(retVal);
  let retMessage = `Success: ${retVal[0]}`;
  if (retVal[1])
  {
    retMessage += `\r\n${retVal[1]}`;
  }
  alert(retMessage);
  
});

const getResults = async () => {
  let id = $('#pageId').val();
  let cont = $('#editor').text();
  const response = await window.actions.saveChanges({id, cont});
  return(response);
}
