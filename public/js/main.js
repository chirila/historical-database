// Chirila DB Builder Main JS script
// By Abhi Nayar for Claire Bowern
//
// Data population function
// Runs through some complex code, but it's heavily commented for readability
// as well as understanding.
// Contact abhishek[dot]nayar[at]yale.edu with any questions.
//
// NOTE: Helper functions are abstracted out of main code.
// See below populate function for each of them with their own comments.
//
// FIRST A BRIEF OVERVIEW
/*
*
*
This application allows you to create websites in the style of https://chirila.yale.edu
It is purpose built for Linguistic applications and requires the data to be structured in
the manner specified in the docs. Please see the README.md OR README.pdf for more information and
installation instructions.
*
If you have any questions about the underlying code please contact the developer
at abhishek[dot]nayar[at]yale[dot]edu
*
*
*
LET'S TALK PAGE DETAILS
-------------------------
PAGES:
  Home
  Languages
  Language Subpage
  Words
  Reconstructions
  Downloads
-------------------------
Home
--
  The hompage should be an FAQ style page which lists what the database is,
  how to use it, and how to download the data.
Languages
--
  The language page lists all languages in the dataset and maps them on a map if there
  is a latitude and longitude associated with the language. You can toggle the map on and off.
Languages Subpage
--
  The language subpage will show the detailed data on one language, map it alone on the
  map AND show the word list associated with the language.
Words
--
  The words page shows a full list of the words in the dataset, sortable by different fields
  and where you can scroll through the pages of data.
Reconstructions
--
  Similar to the words page, can sort by the different values and view all the reconstructions
  in the dataset.
Downloads
--
  Optional page detailing the downloadable terms of the dataset, as well as an optional form the
  visitor must complete before they are allowed to download the form.

*
*
*
DATA STRUCTURES
-------------------------
So we get pretty loosely structured JSONP from the sheets "API" (hack)
We need to take it and convert it into an object of the form below.
This is, in my view, one of the most efficient structures for our purposes,
we will also be using sub-data structures to hold arrays of lat/longs, wordlists, etc.

Structure (for one language, we want an array of these)
--
  LANGNAME : {
    Language_name,
    Subgroup,
    Family,
    ICO_code,
    Glottocode,
    AIATSIS_code,
    Variety,
    Latitude,
    Longitude,
    Words : [
      WORDNAME : {
        word,
        phonetic form,
        Og_gloss,
        language_name,
        part_of_speech,
        source,
        form,
        level,
        gloss,
        notes
      }
    ]
  }
*
*
*
The challenge is to convert the semi-structured data feed that is returned
by the Google Sheets API into a usable and parseable data structure such as above.
If you notice, each languages word list is associated with it directly which makes
populating items such as the language subpage an absolute breeze.
*
Because we are potentially dealing with large amounts of data, we will abstract the
heavy lifting away to Web Workers so we get a fluid UI experience. This might not
be 100% achieved in this first version of the DB builder but it is the idea anyways.
*
*
*/
//
//
// NOW THE ACTUAL CODE
//
//
//
function populate() {
  // The config.json file holds most of our core customizeable content
  // As well as the path to the actual sheet data
  // First let's get data from the config.json file using a jQuery call
  $.getJSON("../config.json", function(data) {
    populateConfigData(data);
  });
  // Now let's populate the config.json dependant info.
  // This includes application CRITICAL data such as sheet data as well as page titles, etc.
  function populateConfigData(JSONdata) {
    // First populate the sheet data + meta data
    populateMetaDataConfig(JSONdata);
    // Then populate page specific items
    //populateHomeConfig(JSONdata.HOME);
    //populateLanguageConfig(JSONdata.LANGUAGES);
    //populateWordsConfig(JSONdata.WORDS);
    //populateReconstructionsConfig(JSONdata.RECONSTRUCTIONS);
    //populateDownloadConfig(JSONdata.DOWNLOAD);
  }
  // CRITICAL: This is the function that gets the sheet data and other meta data items
  function populateMetaDataConfig(data) {
    // Add page title
    $('title').html(data.METADATA.database_name)
    // Add database title
    populateDatabaseTitle(data.METADATA.database_name);
    // CRITICAL: FIRST WE DEAL WITH SHEET DATA
    // We check localstorage to see if we have the sheetData stored already
    // This is to reduce AJAX calls, especially when the data is small enough to store locally in LS
    // Size limits vary so BE CAREFUL => I would keep dataset UNDER 3-5MB for these purposes.
    var gSheetUrl = data.METADATA.google_sheet_url;
    var sheetData = checkLocalStorageForSheetDataOrFetchIt(gSheetUrl);
    // This function literally just waits for the sheet data to come in
    // Then allows the rest of the sheet data population to happen
    function waitForSheetData() {
      console.log('here');
      if (!sheetData || sheetData == null || typeof sheetData == undefined) {
        sheetData = getSheetDataFromLocalStorage();
        if (!sheetData || sheetData == null || typeof sheetData == undefined) {
          console.log('Waiting', sheetData);
          setTimeout(waitForSheetData, 250);
        } else {
          console.log('resuming', sheetData);
          resumeMetaDataPopulation();
        }
      } else {
        console.log('resuming', sheetData);
        resumeMetaDataPopulation();
      }
    } waitForSheetData();
    function resumeMetaDataPopulation() {
      console.log('resuming');
      // Now we have the sheetData (either from AJAX OR localStorage)
      // Let's go ahead and populate the data tables and graph
      // If showMap == true populate map, else hide it
      (data.LANGUAGES.showMap == true) ? populateGoogleChart(sheetData) : $('#languages #chart_div').hide();
      // Now populate the data tables
      populateTables(sheetData);
    }
    //
    // OTHER METADATA ITEMS
    // Add email to contact button
    $('.contactButton').each(function(i, item) {
      $(item).attr('href', 'mailto:' + data.METADATA.contact_email);
    })
    // Add action to download form
    $('#download form').attr('action', 'https://formspree.io/' + data.METADATA.contact_email);
  }
  // populate homepage content
  function populateHomeConfig(data) {
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
  function populateLanguageConfig(data) {
    // populate page title
    populatePageTitle('languages', data);
  }
  function populateWordsConfig(data) {
    populatePageTitle('words', data);
  }
  function populateReconstructionsConfig(data) {
    populatePageTitle('reconstructions', data);
  }
  function populateDownloadConfig(data) {
    populatePageTitle('download', data);
    var critical = data.download_heading,
    nonCritical = data.download_text;
    $('#download .critical').html(critical).removeClass('hide-text');
    $('#download .non-critical').html(nonCritical).removeClass('hide-text');
  }
  // HELPERS
  function populatePageTitle(page, data) {
    var title = data.title,
    subtitle = data.subtitle;
    $('#' + page + '>.banner .heading h1').text(title).removeClass('hide-text');
    $('#' + page + '>.banner .subheading h4').text(subtitle).removeClass('hide-text');
  } function populateDatabaseTitle(title) {
    $('.sidebar .logo h1').text(title).removeClass('hide-text');
    (title.length > 17) ? $('.sidebar .logo').removeClass('one-line').addClass('two-line') : $('.sidebar .logo').removeClass('two-line').addClass('one-line');
  }
} populate();
//
//
//
// Helpers
// Functions are defined in the order that they are called.
// This is not the MOST easy to parse way of organizing content
// as it would be simpler to group them by function BUT it does make the
// code simple to follow (in my humble opinion).
//
// checkLocalStorageForSheetDataOrFetchIt(gSheetUrl)
// Checks localStorage for presence of sheeData
// If it exists it will return the sheetData otherwise it will run an AJAX call for it
function checkLocalStorageForSheetDataOrFetchIt(gSheetUrl) {
  // checks local storage for sheet data
  var sheetData = getSheetDataFromLocalStorage();
  // Looks like it doesn't exist
  if (!sheetData) {
    // looks like we don't have the sheet data stored
    // let's get it via AJAX
    // get the gsheet url from config.json
    // get the sheet key from the url
    sheetKey = getSheetKeyFromUrl(gSheetUrl);
    console.log(sheetKey);
    // run an AJAX call on the spreadsheet to get data
    // Requests a list of values from the spreadsheet given a sheetkey
    // We stripped the sheet key so we could build the AjaxURL below (a JSONP returning google sheet url)
    var ajaxUrl = 'https://spreadsheets.google.com/feeds/list/' + sheetKey + '/1/public/values?alt=json-in-script';
    $.ajax(ajaxUrl,
      {
        dataType: "jsonp"
      }).then(function(response) {
          console.log('Response from spreadsheet', response);
          // AJAX will return UNSTRUCTURED sheet data (as in dev. docs)
          // We want to structure it into a usable object
          // We DONT need to do this if we're just grabbing it from localStorage bc then assumably it's already structured...
          // NOTE::: This function uses Web Workers.
          sheetData = structureData(response);
          return sheetData;
      }, function(err) {
          console.log("$.ajax() error:");
          // ERROR CODE 203
          alert('A fatal error occured, please contact us with error code #203')
          console.log(err);
      });
  }
  return sheetData;
}
// getSheetKeyFromUrl(url)
// Gets sheet key from a gsheet url
// https://docs.google.com/spreadsheets/d/1dRxvhFwfnOKGVK28LgKhYnmdfNOghmCBu0fLR6Uqxog/edit#gid=0 => 1dRxvhFwfnOKGVK28LgKhYnmdfNOghmCBu0fLR6Uqxog
function getSheetKeyFromUrl(url) {
  var sheetKey = url.substring(0, url.indexOf('/edit'));
  sheetKey = sheetKey.substring(sheetKey.lastIndexOf('/') + 1, sheetKey.length);
  //console.log(sheetKey);
  if (sheetKey.indexOf('/') != -1 || sheetKey.indexOf('edit') != -1 || sheetKey.indexOf('docs') != -1) {
    // ERROR CODE 202
    alert('A fatal error occured. Please contact us for help and use error code #202');
    return null;
  } else {
    return sheetKey;
  }
}
// getSheetDataFromLocalStorage()
// GETS the sheet data from local storage
// We store the sheetdata in local storage because that way we only need to make
// ONE AJAX call the first time the user visits the site and then not again till localStorage is cleared.
// This will throw an alert if there is NO local storage OR return Parsed JSON from localStorage
function getSheetDataFromLocalStorage() {
  if (typeof window.localStorage == "undefined") {
    alert("Your browser does not support local storage and thus will reload the full data set per page refresh. Please update your browser.");
    return null;
  } else {
    return JSON.parse(localStorage.getItem("sheetData"));
  }
}
// structureData(data)
// The structure data function
// This function takes unstructured/semi-structured data from the Google Sheet JSON api,
// and builds it into an object that we can use (of the form specified in the dev. docs.)
// NOTE::: THIS FUNCTION USES WEB WORKERS
function structureData(data) {
  var dataWorker = new Worker('data-worker.js');
  dataWorker.addEventListener('message', function(e) {
    //console.log('Worker said: ', e.data);
    var data = e.data;
    var error = storeDataInLocalStorage(JSON.stringify(data));
    if (error) {
      alert("Your browser does not support local storage and thus will reload the full data set per page refresh. Please update your browser.")
    }
    return data;
  }, false);
  dataWorker.postMessage(JSON.stringify(data.feed.entry));
}
// storeDataInLocalStorage(data)
// Self explanatory function
// User by the structureData function to STORE the structured data INTO localStorage
// IF the local storage exists.
function storeDataInLocalStorage(data) {
  // we return TRUE if localStorage DNE bc it acts as an error flag in the structureData function
  if (typeof window.localStorage == "undefined") return true;
  // set the item into localStorage
  localStorage.setItem("sheetData", data);
}
// populateTables(sheetData)
// The data population function
// This function takes sheet Data and populates the respective data tables
// It uses web workers to do this in the background and stores the resulting html
// entities in localStorage so we don't have to run the heavy lifting multiple times
// TODO: Check whether localStorage will overflow at some point....
// NOTE::: THIS FUNCTION USES WEB WORKERS
function populateTables(sheetData) {
  console.log('CALLING UI WORKER');
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
    console.log('CALLING UI WORKER');
    uiWorker.postMessage(sheetData);
  }
}
// populateGoogleChart(sheetData)
// This functions takes sheet data and populates the google chart
// NOTE::: This function requires the Google Chart API to be included PRIOR to this script
function populateGoogleChart(sheetData) {
  console.log(sheetData);
  // Unhide chart div if it is hidden
  $('#chart_div').show().removeClass('hidden');
  // load the google charts api + api key
  google.charts.load('current', {
   'packages': ['geochart'],
   'mapsApiKey': 'AIzaSyAMziAatynMClPJG7NxW6e5wvX5Mi2c1a0'
  });
  // run the callback function
  google.charts.setOnLoadCallback(drawMarkersMap);
  // define the callback function
  function drawMarkersMap() {
    // define the data
    var data = new google.visualization.DataTable();
    // add the columns to the data (what we want to appear on hover)
    data.addColumn('number', 'LATITUDE');
    data.addColumn('number', 'LONGITUDE');
    data.addColumn('string', 'LANGUAGENAME');
    data.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}})
    var dataRows = [];
    // loop through the sheet data object and do this for each language
    sheetData.forEach(function(language, i) {
      // define a data row
      // html row
      var htmlData = '<div><p><b>Language ID: </b>' + language.Language_id + '</p><p><b>Variety: </b>' + language.Variety + '</p><p><b>Subgroup: </b>' + language.Subgroup + '</p><p><b>Family: </b>' + language.Family + '</p></div>';
      var dataRow = [language.Latitude, language.Longitude, language.Language_name, htmlData];
      dataRows.push(dataRow);
      // add the row to the data object
      if (i == sheetData.length - 1)
        populateMap(); // call the function once we've looped through the whole thing
    })
    // abstract this to a seperate function so we can choose when to call it
    //instead of using Promises and polyfills
    function populateMap() {
      // add the data rows to the data object (now that it's fulled)
      data.addRows(dataRows);
      // define the chart options (UI)
      var options = {
        region: 'AU',
        displayMode: 'markers',
        enableRegionInteractivity: 'false',
        resolution: 'provinces',
        colorAxis: {colors: ['red']},
        sizeAxis : {
          minSize: 1,
          maxSize: 1
        },
        tooltip: { isHtml: true },
        keepAspectRatio: true
      };
      // define the chart from the JS lib
      var chart = new google.visualization.GeoChart(document.getElementById('chart_div'));
      // draw the data onto the chart
      setTimeout(function() {
        chart.draw(data, options);
      }, 1200)
    }
  };
}
//
//
//
// Navigation function
// Switches the sidebar nav and adds active classes to needed sections
$("#navigation a").on('click', function(e) {
  e.preventDefault();
  // make this nav item active
  $("#navigation a").removeClass('active');
  $(this).addClass('active');
  // get the target
  var target = $(this).data('target');
  // switch the targetted page section to active
  $('.page-section.active').removeClass('active');
  $('.main-content #' + target).addClass('active');
})
function getParameterFromUrl(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
