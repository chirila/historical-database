
// Updated Oct. 10th, 2017
/*
Sheet data population function for the pages that require
the Google sheet data
*/
globalSheetData = getCheckSheetData();
/*
Now we will check to see if the sheet data
is stored in LocalStorage (and indeed if the browser supports local storage.
If it IS, then we will proceed to data population functions
If it IS NOT, then we will GET the data, then populate
*/
function getCheckSheetData() {
  if (typeof globalSheetData == 'undefined' || globalSheetData == 'undefined') {
    var sheetData = getDataFromLocalStorage('siteSheetData');
    //console.log(configData);
    if (sheetData) {
      //console.log('here');
      populateSheetData(sheetData);
      return sheetData; // the config data was IN localStorage already, return it
    }
    // Looks like the sheet data is NOT in LS
    else {
      console.log('here');
      checkConfigDataAndContinue();
      function checkConfigDataAndContinue() {
        if (globalConfigData || typeof globalConfigData !== 'undefined') {
          console.log(globalConfigData);
          resumeSheetDataPopulation();
        } else {
          setTimeout(checkConfigDataAndContinue, 250);
        }
      }
      function resumeSheetDataPopulation() {
        console.log('hereee');
        // let's get sheet data via AJAX
        // get the gsheet url from config.json
        // get the sheet key from the url
        var gSheetUrl = globalConfigData.METADATA.google_sheet_url;
        sheetKey = getSheetKeyFromUrl(gSheetUrl);
        console.log(sheetKey);
        // run an AJAX call on the spreadsheet to get data
        // Requests a list of values from the spreadsheet given a sheetkey
        // We stripped the sheet key so we could build the AjaxURL below (a JSONP returning google sheet url)
        var ajaxUrl = 'https://spreadsheets.google.com/feeds/list/' + sheetKey + '/1/public/values?alt=json-in-script';
        $.ajax(ajaxUrl, { dataType: "jsonp" })
        .then(function(response) {
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
    }
  } else {
    populateSheetData(globalSheetData);
  }
}
/* General Helpers */
function populateSheetData(sheetData) {
  //console.log(sheetData);
  var pageId = $('body').attr('id');
  if (pageId === 'languages') populateLanguagesSheetData(sheetData);
  else if (pageId === 'words') populateWordsSheetData(sheetData);
  else if (pageId === 'reconstructions') populateReconstructionsSheetData(sheetData);
}
function populateLanguagesSheetData(sheetData) {
  populateTables(sheetData, 1);
  populateGoogleChart(sheetData);
  var subpage = getParameterFromUrl('langID');
  if (subpage) {
    populateLanguageSubpage(sheetData, subpage);
  }
  $('#language_subpage .back-button').on('click', function() {
    var loc = window.location.href;
    loc = loc.substring(0, loc.indexOf('?'));
    window.location.replace(loc);
    $('#language_subpage').removeClass('shown');
  })
  $('#languages tbody tr').on('click', function() {
    var loc = window.location.href;
    loc = loc.substring(0, loc.indexOf('?'));
    var target = $(this).data('target');
    target = './languages.html?langID' + target.substring(target.indexOf('='), target.length);
    window.location.href = loc + target;
  })
}
function populateLanguageSubpage(sheetData, subpage) {
  console.log(subpage);
  for (var i = 0; i < sheetData.length; i++) {
    var curId = sheetData[i].id;
    console.log(curId);
    if (subpage == curId) {
      var curData = sheetData[i];
      $('#language_subpage .heading h1').text(curData.Language_name);
      // Populate Simple Data
      $('#language_subpage .subpage_subgroup').text(curData.Subgroup)
      $('#language_subpage .subpage_family').text(curData.Family)
      $('#language_subpage .subpage_iso_code').text(curData.ISO_code)
      $('#language_subpage .subpage_glottocode').text(curData.Glottocode)
      $('#language_subpage .subpage_aiatsis_code').text(curData.AIATSIS_code)
      $('#language_subpage .subpage_variety').text(curData.Variety)
      // Generate and populate URLs
      var glottolog_url = 'http://glottolog.org/resource/languoid/id/' + curData.Glottocode;
      var wiki_url = 'https://en.wikipedia.org/wiki/' + curData.Language_name;
      var enthologue_url = 'https://www.ethnologue.com/language/' + curData.ISO_code;
      var endangered_url = 'http://endangeredlanguages.com/lang/search/#/?endangerment=U,S,AR,V,T,E,CE,SE,AW,D&sample_types=N,A,V,D,I,G,L&locations=known,unknown&q=' + curData.Language_name + '&type=code';
      var olac_url = 'http://www.language-archives.org/language/' + curData.ISO_code;
      var aiatsis_url = 'http://austlang.aiatsis.gov.au/main.php?code=' + curData.AIATSIS_code;
      var aiatsis_url = 'https://scholar.google.com/scholar?q=' + curData.Language_name + '+language';
      // Generate and populate word table
      var subpageWordTable = [];
      curData.Words.forEach(function(word, i) {
        var subpageWordTableRow = '<tr data-target="/?wordID=' + word.id + '">' +
            '<td class="text-left id">' + word.id + '</td>' +
            '<td class="text-left word">' + word.Word + '</td>' +
            '<td class="text-left phonetic_form">' + word.Phonetic_form + '</td>' +
            '<td class="text-left og_gloss">' + word.Og_gloss + '</td>' +
            '<td class="text-left language_name">' + word.Language_name + '</td>' +
            '<td class="text-left part_of_speech">' + word.POS + '</td>' +
            '<td class="text-left source">' + word.Source + '</td>' + '</tr>';
        subpageWordTable.push(subpageWordTableRow);
      });
      $('#language_subpage tbody').append(subpageWordTable);
      $('#language_subpage').addClass('shown');
    }
  }
}
function populateWordsSheetData(sheetData) {
  populateTables(sheetData, 2);
}
function populateReconstructionsSheetData(sheetData) {
  console.log('pop');
  populateTables(sheetData, 3);
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
  var dataWorker = new Worker('../../data-worker.js');
  dataWorker.addEventListener('message', function(e) {
    //console.log('Worker said: ', e.data);
    var data = e.data;
    var error = saveDataToLocalStorage('siteSheetData', data);
    if (!error) {
      console.log(error);
      alert("Your browser does not support local storage and thus will reload the full data set per page refresh. Please update your browser.")
    }
    // populate the data as needed
    populateSheetData(data);
    return data;
  }, false);
  dataWorker.postMessage(JSON.stringify(data.feed.entry));
}
// populateTables(sheetData)
// The data population function
// This function takes sheet Data and populates the respective data tables
// It uses web workers to do this in the background and stores the resulting html
// entities in localStorage so we don't have to run the heavy lifting multiple times
// TODO: Check whether localStorage will overflow at some point....
// NOTE::: THIS FUNCTION USES WEB WORKERS
function populateTables(sheetData, tableToPopulate) {
  console.log('CALLING UI WORKER');
  // First we check whether we have the UI elements stored in local storage
  // If we do we append from there - No need for web workers
  var storedLangData = getDataFromLocalStorage('langTableUIElements');
  var storedWordData = getDataFromLocalStorage('wordTableUIElements');
  var storedReconstructionData = getDataFromLocalStorage('reconstructionTableUIElements');
  // check whether they all exist
  if (storedLangData && storedWordData && storedReconstructionData) {
    // append it to the UI
    /***** FLAG ****/
    /***** FLAG ****/
    /***** FLAG ****/
    $('.table-wrapper .loading').addClass('hidden');
    $('.table-wrapper tr').removeClass('hidden');
    if (tableToPopulate == 1)
      $('#langTable tbody').append(storedLangData);
    else if (tableToPopulate == 2)
      $('#wordTable tbody').append(storedWordData);
    else if (tableToPopulate == 3)
      $('#reconstructionTable tbody').append(storedReconstructionData);
    return true;
  } else {
    // if we DONT have the info in local storage then we call our worker into action
    var uiWorker = new Worker('../../ui-worker.js');
    // send the data and parse it on return
    uiWorker.addEventListener('message', function(e) {
      // Data returned is [langData, wordData, reconstructionData]
      var data = e.data;
      // get the indiv. elements
      var langData = data[0];
      var wordData = data[1];
      var reconstructionData = data[2];
      // first store it away in localStorage
      saveDataToLocalStorage('langTableUIElements', langData);
      saveDataToLocalStorage('wordTableUIElements', wordData);
      saveDataToLocalStorage('reconstructionTableUIElements', reconstructionData);
      /***** FLAG ****/
      /***** FLAG ****/
      /***** FLAG ****/
      /***** FLAG ****/
      /***** FLAG ****/
      // Populate the UI here
      $('.table-wrapper .loading').addClass('hidden');
      $('.table-wrapper tr').removeClass('hidden');
      if (tableToPopulate == 1)
        $('#langTable tbody').append(langData);
      else if (tableToPopulate == 2)
        $('#wordTable tbody').append(wordData);
      else if (tableToPopulate == 3)
        $('#reconstructionTable tbody').append(reconstructionData);
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
  //console.log(sheetData);
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
    sheetData = JSON.parse(sheetData);
    // loop through the sheet data object and do this for each language
    for (var i = 0; i < sheetData.length; i++) {
      var language = sheetData[i];
      var htmlData = '<div><p><b>Language ID: </b>' + language.Language_id + '</p><p><b>Variety: </b>' + language.Variety + '</p><p><b>Subgroup: </b>' + language.Subgroup + '</p><p><b>Family: </b>' + language.Family + '</p></div>';
      var dataRow = [language.Latitude, language.Longitude, language.Language_name, htmlData];
      dataRows.push(dataRow);
      // add the row to the data object
      if (i == sheetData.length - 1)
        populateMap(dataRows); // call the function once we've looped through the whole thing
    }
    // abstract this to a seperate function so we can choose when to call it
    //instead of using Promises and polyfills
    function populateMap(dataRows) {
      //console.log(dataRows);
      // add the data rows to the data object (now that it's fulled)
      data.addRows(dataRows);
      // define the chart options (UI)
      var countryCode = globalConfigData.LANGUAGES.mapCountryCode;
      var options = {
        region: countryCode,
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
        $('#chart_div .loading').addClass('hidden');
        chart.draw(data, options);
      }, 500)
    }
  };
}
function getParameterFromUrl(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
