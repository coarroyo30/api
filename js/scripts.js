// Global variable for keeping the list of active albums
var albumSearchLimit = 8;
var albumList = [];
var currentAlbum;

//////////
// Search functionality and AJAX calls
//////////

// Disables the search form while the Ajax call is made
function disableForm() {
  $("#search-box").val("Searching ...");
  $("#search-btn").prop("disabled", true);
}

// Enables the form for a new search
function enableForm() {
  $("#search-box").val("");
  $("#search-btn").prop("disabled", false);
}

// Fetches album details for the active list of albums
function fetchDetails() {
  $.each(albumList, function(index, item){
    var url = item.url;
    $.getJSON(url)
      .done(function(response){
        albumList[index].details = response;
      });
  });
}


// Searches for an artist and replaces the albumList with the top limit albums
function searchAlbums(artist, limit) {
  var url = "https://api.spotify.com/v1/search";
  var data = {
    "type" : "album",
    "q" : artist,
    "limit" : limit
  };

  $.getJSON(url, data)
    .done(function(response){
      // Add all results to the main albumList
      albumList = [];

      $.each(response.albums.items, function(index, item){
        if (item.images.length > 0) {
          var album = {
            "id" : item.id,
            "name" : item.name,
            "thumbnail" : item.images[0].url,
            "url" : item.href
          };
          albumList.push(album);
        }
      });
      updateGallery();
      resetSort();
      enableForm();
      fetchDetails();
    })
    .fail(function(){
      albumList = [];
      updateGallery();
      resetSort();
      enableForm();
    })
    .always(function(){
      transmissionCredits();
    });
} // ---end--- searchAlbums()




//////////
// Gallery functionality
//////////

// Build a gallery album item
function buildAlbum(item, index) {
  var html = "";
  html += '<div class="album" data-album-id="' + index + '">';
  html += '<img src="' + item.thumbnail + '" alt="' + item.name + '">';
  html += '</div>';

  return html;
} // ---end--- builtAlbum()


// Updates the page with the content of the albumList
function updateGallery() {
  // Clear the gallery
  $("main.gallery").fadeOut(300, function(){
    $("main.gallery").empty();
    if (albumList.length > 0) {
      // Iterate through each result and append to gallery
      $.each(albumList, function(index, item) {
        var albumHTML = buildAlbum(item, index);
        $("main.gallery").append(albumHTML);
      });
      $("main.gallery").fadeIn(300);
    }
    // Bind click events to all album elements
    $(".album").click(function(event){
      event.preventDefault();
      updateLightbox(parseInt($(this).attr("data-album-id")));
    });
  });
} // ---end--- updateGallery()


// Gallery sorting function
function sortBy(cat, handler) {

  function sortByPopularity(a, b) {
    return (a.details.popularity < b.details.popularity) ? -1 :
          ((a.details.popularity > b.details.popularity) ? 1 : 0);
  }

  function sortByDate(a, b) {
    return (a.details.release_date < b.details.release_date) ? -1 :
          ((a.details.release_date > b.details.release_date) ? 1 : 0);
  }

  function sortByName(a, b) {
    return (a.details.name < b.details.name) ? -1 :
          ((a.details.name > b.details.name) ? 1 : 0);
  }

  switch (cat) {
    case "popularity":
      albumList.sort(sortByPopularity);
      break;
    case "date":
      albumList.sort(sortByDate);
      break;
    case "name":
      albumList.sort(sortByName);
      break;
  }

  updateGallery();

  $(".sort a").removeClass("active");
  handler.addClass("active");
}

// Resets the Sort function
function resetSort() {
  $(".sort a").removeClass("active");
  if (albumList.length > 0) {
    $(".sort").fadeIn();
  }
}





//////////
// Lighbox behaviour
//////////

// Update detail box
function updateLightbox(id) {
  currentAlbum = id;
  var info = albumList[id].details;
  var date = new Date(info.release_date);

  function trackHTML(track) {
    var output;
    output  = '<tr><td>';
    output += track.track_number + '. ' + track.name;
    output += '</td></tr>';
    return output;
  }

  var tracksHTML = "<table>";
  for (var i = 0; i < info.tracks.items.length && i < 12; i++) {
    tracksHTML += trackHTML(info.tracks.items[i]);
  }
  tracksHTML += "</table>";

  $(".info").fadeOut(1);

    $(".album-info-image").attr("src", info.images[0].url);
    $(".album-info-artist").text(info.artists[0].name);
    $(".album-info-name").text(info.name);
    $(".album-info-released").text("Released: " + date.getFullYear());
    $(".album-info-tracks").text("Tracks: " + info.tracks.total);
    $(".track-info").html(tracksHTML);

  $(".lightbox").show();
  $(".info").fadeIn();
} // ---end--- updateLightbox()


// Update previous album
function updatePrev() {
  if (currentAlbum > 0) {
    updateLightbox(currentAlbum - 1);
  } else {
    updateLightbox(albumList.length - 1);
  }
}

// Update next album
function updateNext() {
  if (currentAlbum < albumList.length - 1) {
    updateLightbox(currentAlbum + 1);
  } else {
    updateLightbox(0);
  }
}



//////////
// Document ready
//////////

$("document").ready(function(){
  $(".lightbox").hide();
  $(".sort").hide();

  //////////
  // Search function
  //////////

  // Form submit event handling
  $("#search-form").submit(function(event){
    // Prevents form from submitting
    event.preventDefault();
    // Captures the artist name, disables the form and runs the search
    var artist = $("#search-box").val();
    disableForm();
    searchAlbums(artist, albumSearchLimit);
  });


  //////////
  // User interaction events
  //////////

  // Bind sort buttons to sorting functions
  $(".sort-popularity").click(function(event){
    event.preventDefault();
    sortBy("popularity", $(this));
  });
  $(".sort-date").click(function(event){
    event.preventDefault();
    sortBy("date", $(this));
  });
  $(".sort-name").click(function(event){
    event.preventDefault();
    sortBy("name", $(this));
  });


  // Clicking the lightbox closes it down
  $(".lightbox").click(function(){
    $(this).fadeOut();
    $(".info").fadeOut(1);
  });


  // Bing Prev and Next click events
  $(".prev").click(function(event){
    event.stopPropagation();
    updatePrev();
  });
  $(".next").click(function(event){
    event.stopPropagation();
    updateNext();
  });


  // Bind escape, left and right arrow keys for navigation
  $(document).keydown(function(event){
    if ($(".lightbox").is(":visible") && event.which === 37)
    {
      updatePrev();
    }
    else if ($(".lightbox").is(":visible") && event.which === 39)
    {
      updateNext();
    }
    else if ($(".lightbox").is(":visible") && event.which === 27)
    {
      $(".lightbox").fadeOut();
      $(".info").fadeOut(1);
    }
  });

}); // ---end--- .ready()
