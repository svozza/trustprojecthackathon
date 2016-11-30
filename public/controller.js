var app = angular.module("trustProject", []);
var map;
var apiData = {};

app.controller("trustProjectController", function($scope) {

  $scope.inputSearch = '';
  $scope.alertMessage = false;
  $scope.showMessage = false;
  $scope.apiData;

  function requestConfig(URL) {
    var endPoint = "/api/validate";

    $.ajax({
      type: "POST",
      url: endPoint,
      data: { url: URL },
      dataType: 'JSON',
      success: function (data) {
        window.console.log("Data Sent: " + JSON.stringify(data));
        apiData = data;
        $scope.apiData = data;
        updateMapLocations(apiData.author.locations);
        $scope.showMessage = false;
        $scope.$apply();
        window.google.maps.event.trigger(map, 'resize');
      }
    });
  }

  function validateUrl(value){
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
  }

  $scope.trackClick = function() {

    var validateURL = validateUrl($scope.inputSearch);

    if (!validateURL) {
      $scope.alertMessage = true;
      $scope.showMessage = false;
    } else {
      requestConfig($scope.inputSearch);
      $scope.showMessage = true;
      $scope.alertMessage = false;
    }
  }

});

function initMap() {
  map = new google.maps.Map(document.getElementById('map_canvas'), {
    center: {lat: 0, lng: 0},
    zoom: 2
  });
}

function updateMapLocations(locations) {
  for (var i = 0; i < locations.length; i++) {
    var coords = locations[i];
    var latLng = new google.maps.LatLng(coords.latitude,coords.longitude);
    var marker = new google.maps.Marker({
      position: latLng,
      map: map
    });
  }
}

