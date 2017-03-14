var apis = require('./apis');

/*
  This is a component to communicate with the map.
  In order to separate the map from other parts of the app, it's created
  within the initMap function's scope. This way it won't interfere with
  other parts of the app and cleanly separate the concerns.
*/
var mapComponent = {
  currentMarkers: [], // Holds the markers currently displayed on the map.

  refreshMap: function(places) {
    this.removeAllMarkers();
    this.renderMarkers(places);
    this.focusMap(this.currentMarkers);
  },

  // Removes all current markers from the map.
  removeAllMarkers: function() {
    this.currentMarkers.forEach(function(marker) {
      marker.setMap(null);
    });
  },

  // Focuses the map on the markers provided as parameters.
  focusMap: function(markers) {
    var bounds = new google.maps.LatLngBounds();

    markers.forEach(function(marker) {
      bounds.extend(marker.position);
    });

    map.fitBounds(bounds);
  },

  // Creates markers from an array of places and renders them on the map.
  renderMarkers: function(places) {
    var marker;
    var self = this;

    for (var i = 0; i < places.length; i++) {
      marker = new google.maps.Marker({
        position: places[i].geometry.location,
        title: places[i].name,
        animation: google.maps.Animation.DROP,
        id: i
      });

      this.currentMarkers.push(marker);

      marker.setMap(map);

      marker.addListener('click', function() {
        if(!self.infoWindow) {
          self.infoWindow = new google.maps.InfoWindow();
        }
        self.populateInfoWindow(this, self.infoWindow);
      });
    }
  },

  populateInfoWindow: function(marker, infowindow) {
    if (infowindow.marker != marker) {
      apis.callWikipedia(marker.title, function(data) {
        if (data.query) {
          var pages = data.query.pages;
          for(var property in pages) {
            if(pages.hasOwnProperty(property)) {
              infowindow.setContent(
                '<div>' + pages[property].title + '</div>' +
                '<p>' + pages[property].extract + '</p>'
              );
              infowindow.open(map, marker);
            }
          }
        } else {
          infowindow.setContent('<p>No Wikpedia article found</p>');
          infowindow.open(map, marker);
        }
      });

      apis.callYelp(marker.title, map.getBounds().toJSON(), function(data) {
        var business = JSON.parse(data.custom).businesses[0];
        if (business != undefined) {
          infowindow.setContent(
            '<a href=\'' + business.url + '\'>' + business.name + '</a><br/>' +
            '<span>Phone: ' + business.display_phone + '</span><br/>' +
            '<span>Description: ' + business.snippet_text + '</span><br/>' +
            '<img src=\'' + business.image_url + '\'/>'
          );
          infowindow.open(map, marker);
        } else {
          infowindow.setContent('<p>No Yelp information found</p>');
          infowindow.open(map, marker);
        }
      });
    }
  }
};

module.exports = mapComponent;