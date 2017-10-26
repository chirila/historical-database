addEventListener('message', function(e) {
  console.log(e);
  var parsedJSON = JSON.parse(e.data);
  postMessage(parsedJSON);
}, false);
