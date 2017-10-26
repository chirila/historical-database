/*
  $.getJSON( "config.json", function( data ) {
    console.log( "JSON Data: " + data);
    $.each( data, function( key, val ) {
        console.log(key + "value:: " + val );
    });
  });
  */

  $("#navigation a").on('click', function(e) {
    e.preventDefault();
    // make this nav item active
    $("#navigation a").removeClass('active');
    $(this).addClass('active');
    // get the target
    var target = $(this).data('target');
    (target != 'words') ? clearWordTable() : populateWordTable();
    console.log(target);
    // switch the targetted page section to active
    $('.page-section.active').removeClass('active');
    $('.main-content #' + target).addClass('active');
    setTimeout(function() {
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }, 50);
    function clearWordTable() {
      $('#wordTable tbody').empty();
    } function populateWordTable() {
      var data = localStorage.getItem('wordTableUIElements');
      $('#wordTable tbody').append(data);
    }
  })
