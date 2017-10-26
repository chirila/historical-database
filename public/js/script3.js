// Now let's write the JS for the UI
// This function populates our data tables
function populateTables() {
  // First we check whether we have the UI elements stored in local storage
  // If we do we append from there - No need for web workers
  var storedLangData = localStorage.getItem('langTableUIElements');
  var storedWordData = localStorage.getItem('wordTableUIElements');
  var storedReconstructionData = localStorage.getItem('reconstructionTableUIElements');
  // check whether they all exist
  if (storedLangData && storedWordData && storedReconstructionData) {
    // append it to the UI
    $('#langTable tbody').append(storedLangData);
    $('#wordTable tbody').append(storedWordData);
    $('#reconstructionTable tbody').append(storedReconstructionData);
  } else {
    // if we DONT have the info in local storage then we call our worker into action
    var uiWorker = new Worker('ui-worker.js');
    // send the data and parse it on return
    uiWorker.addEventListener('message', function(e) {
      // Data returned is [langData, wordData, reconstructionData]
      var data = e.data;
      // get the indiv. elements
      var langData = data[0];
      var wordData = data[1];
      var reconstructionData = data[2];
      // first store it away in localStorage
      localStorage.setItem('langTableUIElements', langData);
      localStorage.setItem('wordTableUIElements', wordData);
      localStorage.setItem('reconstructionTableUIElements', reconstructionData);
      // Populate the UI here
      $('#langTable tbody').append(langData);
      $('#wordTable tbody').append(wordData);
      $('#reconstructionTable tbody').append(reconstructionData);
      // check if we have stored it else throw alert
      if (!localStorage.getItem('langTableUIElements') || !localStorage.getItem('wordTableUIElements') || !localStorage.getItem('reconstructionTableUIElements')) {
        alert("Your browser does not support local storage and thus will reload the full data set per page refresh. Please update your browser.")
      }
    }, false);
    // post the sheet data to the worker (we structured and stored it earlier)
    var sheetData = localStorage.getItem('sheetData');
    uiWorker.postMessage(sheetData);
  }
} populateTables();
