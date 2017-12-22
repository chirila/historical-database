// DATA WORKER CODE
// --------------------
// This site uses web workers to efficiently batch process data
// in the background while still lazy loading site content.
// No lag time will exist between page load and a UI appearing
// though it may take some time for the data to be populated.
//
// The website also caches the data in localStorage as serialized JS objects
// and will preferentially load it from the cache.
//
// There is a UI service worker which batch processes the data and turns
// it into appendable UI components and can be found in ui-worker.js
addEventListener('message', function(e) {
  // first let's parse the JSON so we can actually access the data
  // entries = our parsed JSON and FULL data set
  var entries = JSON.parse(e.data);
  console.log(entries);
  // construct some container arrays here
  // we will use these below
  var structuredData = [],
  seenLanguages = [];
  // set up vars.
  // we want to keep track of the current language and the previous language because
  // when we encounter a new language we want to push the WHOLE language structure
  // because each ENTRY is actually a WORD
  // Thus languages get repeated but thats only in the google sheet.
  var languageData = null,
  langNum = 0;
  // loop through the entries in the sheet
  entries.forEach(function(entry, i) {
    if (seenLanguages.indexOf(entry.gsx$standardlanguagename.$t) == -1) {
      // So in this case we have NOT seen this particular language before
      // It means we want to push the old language and reset it to null
      pushLanguageData(languageData, structuredData);
      //
      //
      // Now we want to create a new language
      // and deal with it as the curLang
      languageData = createNewLanguage();
      populateLanguageData(languageData, entry);
      // now we want to create the WORD associated with this entry
      var wordData = createAndPushWordData(languageData, entry, i);
      //
      //
      // add the langage to the list of seen languages
      seenLanguages.push(entry.gsx$standardlanguagename.$t);
    } else {
      if (languageData) {
        createAndPushWordData(languageData, entry, i);
        // We also want to push on the LAST entry (hance the i == entries.length - 1)
        if (i == entries.length - 1) langNum = pushLanguageData(languageData, structuredData);
      }
    }
    //console.log(seenLanguages);
  });
  console.log(structuredData);
  postMessage(structuredData);
}, false);

// helpers// helpers

// LANGUAGE DATA HELPERS
function createNewLanguage() {
  // construct the language data object
  var languageData = {
    id : null,
    Language_name : null,
    Subgroup : null,
    Family : null,
    ISO_code : null,
    Glottocode : null,
    AIATSIS_code : null,
    Variety : null,
    Latitude : null,
    Longitude : null,
    Language_id : null,
    Words : []
  }
  return languageData;
}
function populateLanguageData(languageData, objectList) {
  // add the language fields
  languageData.id = addGuid();
  languageData.Language_name = addField(objectList.gsx$standardlanguagename.$t);
  languageData.Subgroup = addField(objectList.gsx$subgroup.$t);
  languageData.Family = addField(objectList.gsx$family.$t);
  languageData.ISO_code = addField(objectList.gsx$isocode.$t);
  languageData.Glottocode = addField(objectList.gsx$glottologid.$t);
  languageData.AIATSIS_code = addField(objectList.gsx$aiatsiscode.$t);
  languageData.Variety = addField(objectList.gsx$variety.$t);
  languageData.Latitude = addNumField(objectList.gsx$latitude.$t);
  languageData.Longitude = addNumField(objectList.gsx$longitude.$t);
  languageData.Language_id = addNumField(objectList.gsx$standardlanguageid.$t);
  return true;
}
function createNewWord() {
  // construct the word data object
  var wordData = {
    id : null,
    Word : null,
    POS: null,
    Phonetic_form : null,
    Reconstruction_form : null,
    Reconstruction_gloss : null,
    Reconstruction_level : null,
    Reconstruction_notes : null,
    Og_gloss : null,
    Language_name : null,
    Variety : null,
    Subgroup : null,
    Source : null
  }
  return wordData;
}
function populateWordData(wordData, objectList, id) {
  // we populate the word data fields
  wordData.id = id;
  wordData.Word = addField(objectList.gsx$originalform.$t);
  wordData.POS = addField(objectList.gsx$originalpartofspeech.$t);
  wordData.Phonetic_form = addField(objectList.gsx$phonemicisedipa.$t);
  wordData.Reconstruction_form = addField(objectList.gsx$reconstructionform.$t);
  wordData.Reconstruction_gloss = addField(objectList.gsx$reconstructiongloss.$t);
  wordData.Reconstruction_level = addField(objectList.gsx$reconstructionlevel.$t);
  wordData.Reconstruction_notes = addField(objectList.gsx$reconstructionnotes.$t);
  wordData.Og_gloss = addField(objectList.gsx$originalgloss.$t);
  wordData.Language_name = addField(objectList.gsx$standardlanguagename.$t);
  wordData.Variety = addField(objectList.gsx$variety.$t);
  wordData.Subgroup = addField(objectList.gsx$subgroup.$t);
  wordData.Source = addField(objectList.gsx$author.$t);
  return true;
}
function createAndPushWordData(languageData, objectList, index) {
  // Now we want to deal with the word in the current entry
  // init it and populate
  var wordData = createNewWord();
  populateWordData(wordData, objectList, index);
  // we want to push the current word into the word array of the current language
  languageData.Words.push(wordData);
}
function pushLanguageData(languageData, structuredData, langNum) {
  if (languageData) {
    var id = languageData.Language_id;
    var name = languageData.Language_name;
    // increment langNum count
    console.log('PUSHING', languageData);
    structuredData.push(languageData);
    languageData = null;
  }
}
function addField(fieldData) {
  if (!fieldData) fieldData = 'none';
  return fieldData
} function addNumField(fieldData) {
  if (!fieldData) fieldData = 0;
  else return parseFloat(fieldData, 10);
}

function addGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
