// Updated Oct. 10th, 2017
/*
ChirilaDB Builder
A simple, customizeable way to display Linguistic Google Sheet data on the web
Coded by Abhi Nayar for Claire Bowern @ Yale Linguistics Dept.
***
***
***
For instructions of customization and use, please reder to the Readme.Md file
For other questions please contact Claire Bowern at claire[dot]bowern[at]yale.edu or Abhi Nayar at abhishek.nayar[at]yale[dot]edu
*/
// Define global variables
var _PATH_TO_JSON = "../../config.json";
globalConfigData = getCheckConfigData();
//globalSheetData = getCheckSheetData();
/*
First let us check for the presence of LocalStorage
and other administrative items, as well as run universal functions
*/
$(document).ready(function() {
  // Check the existence of local storage
  var ls = checkLocalStorageExists();
  if (!ls) alert('Local Storage is not supported in your browser. Some features may not work as intended. Please switch or upgrade your browser for the optimal experience.');
})
/*
Now we will check to see if the config.json data
is stored in LocalStorage (and indeed if the browser supports local storage.
If it IS, then we will proceed to data population functions
If it IS NOT, then we will GET the data, then populate
*/
function getCheckConfigData() {
  //console.log(globalConfigData);
  if (typeof globalConfigData == 'undefined' || globalConfigData == 'undefined') {
    // No config data in LS, let's get it via an AJAX call
    // SET it back to the globalConfigData variable
    getConfigDataFromFile();
    // AJAX helper
    function getConfigDataFromFile() {
      $.getJSON(_PATH_TO_JSON, function(AJAXdata) {
        //console.log(data);
        // We just SET the global variable here so we don't have to worry about concurrency, etc.
        //console.log(AJAXdata);
        saveDataToLocalStorage('siteConfigData', AJAXdata);
        globalConfigData = AJAXdata;
        populateConfigData(AJAXdata);
      });
    }
  } else {
    populateConfigData(globalConfigData);
  }
}
/* General Helpers */
function populateConfigData(configData) {
  var pageId = $('body').attr('id');
  populateUniversalData(configData);
  if (pageId === 'home') populateHomeMetaData(configData);
  else if (pageId === 'languages') populateLanguagesMetaData(configData);
  else if (pageId === 'words') populateWordsMetaData(configData);
  else if (pageId === 'reconstructions') populateReconstructionsMetaData(configData);
  else if (pageId === 'download') populateDownloadMetaData(configData);
}
function checkLocalStorageExists() {
  if (window.localStorage) return true;
  else return false;
}
function saveDataToLocalStorage(name, data) {
  localStorage.setItem(name, JSON.stringify(data));
  var check = localStorage.getItem(name);
  if (check) return true;
  else {
    alert('An error occured while saving to Local Storage.');
    return false
  }
}
function getDataFromLocalStorage(name) {
  var data = localStorage.getItem(name);
  data = JSON.stringify(data);
  if (data) return JSON.parse(data);
  else return false;
}
/* Population Functions */
function populatePageTitle(page, data) {
  var title = data.title,
  subtitle = data.subtitle;
  $('#' + page + '>.banner .heading h1').text(title).removeClass('hide-text');
  $('#' + page + '>.banner .subheading h4').text(subtitle).removeClass('hide-text');
}
function populateUniversalData(configData) {
  var data = configData.METADATA;
  // Get indiv. data items
  var title = data.database_name;
  var contact = data.contact_email;
  $('title').html($('title').html() + title);
  // Add DB title
  $('.sidebar .logo h1').text(title).removeClass('hide-text');
  (title.length > 17) ? $('.sidebar .logo').removeClass('one-line').addClass('two-line') : $('.sidebar .logo').removeClass('two-line').addClass('one-line');
  // Populate contact mailto: link
  $('#contactButton').attr('href', 'mailto:' + contact);
}
function populateHomeMetaData(configData) {
  var data = configData.HOME;
  // populate the page title
  populatePageTitle('home', data);
  // populate homepage FAQ
  var FAQ = data.FAQ;
  if (FAQ) {
    for (i = 0; i < FAQ.length; i++) {
      var item = FAQ[i];
      var question = item.question,
      answer = item.answer;
      var faqItem = $('<li class="faq-item"> <h6 class="faq-question">' + question + '</h6> <p class="faq-answer">' + answer + '</p> </li>');
      $('#home .faq-list').append(faqItem);
    }
  }
}
function populateLanguagesMetaData(configData) {
  var data = configData.LANGUAGES;
  populatePageTitle('languages', data);
}
function populateWordsMetaData(configData) {
  var data = configData.WORDS;
  populatePageTitle('words', data);
}
function populateReconstructionsMetaData(configData) {
  var data = configData.RECONSTRUCTIONS;
  populatePageTitle('reconstructions', data);
}
function populateDownloadMetaData(configData) {
  var data = configData.DOWNLOAD;
  populatePageTitle('download', data);
  var critical = data.download_heading,
  nonCritical = data.download_text;
  $('#download .critical').html(critical).removeClass('hide-text');
  $('#download .non-critical').html(nonCritical).removeClass('hide-text');
  $('#download form').attr('action', 'https://formspree.io/' + configData.METADATA.contact_email)
}
