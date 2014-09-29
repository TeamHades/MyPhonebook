var app = app || {};

app.viewmodels = app.viewmodels || {};
(function (scope) {
    'use strict';

    function hasPic(contactId, hasPic) {
        var promise = new RSVP.Promise(function (resolve, reject) {
            if (hasPic === 'true') {
                getContactDetails(contactId);
                resolve();
            } else {
                postPhotoAndLocationToDb(contactId);
                resolve();
            }
        });

        return promise;
    }

    function postPhotoAndLocationToDb(contactId) {
        var location = {};

        getCoordinates().then(gotLocation, gotLocation);

        function gotLocation(coordinates) {
            location = coordinates;
            getPhoto().then(gotPhoto);
        }

        function gotPhoto(photo) {
            console.dir(photo);
            $.ajax({
                       type: "POST",
                       url: window.EverliveURL + '/Files',
                       headers: {},
                       contentType: "application/json",
                       data: JSON.stringify(photo),
                       success: function (response) {
                           console.dir(response);
                           var contact = {
                               "Photo": response.Result.Id,
                               "Location": location,
                               "HasPic": true
                           }

                           var filter = {
                               "Photo": 1,
                               "Location": 1,
                               "HasPic": 1
                           };

                           $.ajax({
                                      type: "PUT",
                                      url: window.EverliveURL + '/Contacts/' + contactId,
                                      headers: {
                                   "X-Everlive-Filter": JSON.stringify(filter)
                               },
                                      contentType: "application/json",
                                      data: JSON.stringify(contact),
                                      success: function (data) {
                                          navigator.notification.vibrate(2000);
                                          getContactDetails(contactId);
                                      },
                                      error: function (error) {
                                          navigator.notification.alert("Unfortunatelly we could not add the photo!");
                                      }
                                  });
                       },
                       error: function (error) {
                           navigator.notification.alert("Unfortunatelly we could not add the photo!");
                       }
                   });
        }
    }

    function getPhoto() {
        var promise = new RSVP.Promise(function (resolve, reject) {
            var onPhotoSuccess = function (data) {
                var photo = {
                    Filename: Math.random().toString(36).substring(2, 15) + ".jpg",
                    ContentType: "image/jpeg",
                    base64: data
                };
                    
                resolve(photo);
                resolve(data);
            }

            var onPhotoError = function (error) {
                navigator.notification.alert("Unfortunatelly we could not add the photo!");
                reject(error);
            };

            var config = {
                destinationType: Camera.DestinationType.DATA_URL,
                targetHeight: 400,
                targetWidth: 400
            };

            navigator.camera.getPicture(onPhotoSuccess, onPhotoError, config);
        });

        return promise;
    }

    function getCoordinates() {
        var promise = new RSVP.Promise(function (resolve, reject) {
            var myGeolocation = {};

            var error = function (error) {
                if (error.code === 1) {
                    navigator.notification.alert("Unfortunately we don't have access to your location!");
                } else if (error.code === 2) {
                    alert("Unfortunately your position is unavailable!");
                }
                
                reject(null);
            };

            var geoSuccess = function (data) {
                myGeolocation = {
                    longitude: data.coords.longitude,
                    latitude: data.coords.latitude
                };

                if (watchID !== null) {
                    navigator.geolocation.clearWatch(watchID);
                    watchID = null;
                }

                resolve(myGeolocation);
            }

            var options = {
                frequency: 1000,
                enableHighAccuracy: true,
                timeout: 3000
            };

            if (navigator.geolocation) {
                var watchID = navigator.geolocation.watchPosition(geoSuccess, error, options);
            } else {
                error();
            }
        }
            );

        return promise;
    }

    function getContactDetails(contactId) {
        var fieldsExp = {
            Contact: 1,
            Id: 0,
            Location: 1,
            Photo: 1
        };

        var filter = {
            "Id": contactId
        };

        $.ajax({
                   url: window.EverliveURL + '/Contacts',
                   type: "GET",
                   headers: {
                "X-Everlive-Fields": JSON.stringify(fieldsExp),
                "X-Everlive-Filter": JSON.stringify(filter)
            },
                   success: onGetContactSuccess,
                   error: function (error) {
                       console.log(error);

                       navigator.notification.alert("Unfortunately we could not get your contacts!");
                   }
               });
        
        function onGetContactSuccess(data) {
            loadContactDetails(data.Result[0].Contact);
            loadPhoto(data.Result[0].Photo);
            loadMap(data.Result[0].Location);
        }

        function loadContactDetails(contact) {
            var keys = _.keys(contact);
            var values = _.values(contact);
            var contactDetails = [];

            for (var i = 0; i < keys.length; i++) {
                if (typeof(values[i]) !== 'object' && values[i] !== null && values[i] !== '' && values[i] !== undefined && keys[i].toLowerCase().indexOf("id") === -1) {
                    contactDetails.push(keys[i] + ': ' + values[i]);
                }
            }
            
            $("#contactDetails").kendoMobileListView({
                        dataSource: contactDetails,
                        template: "<div>#: data #</div>"
                    });
        }

        function loadPhoto(photoId) {
            console.dir(photoId);
            var fieldsExp = {
                Uri: 1
            };
            $.ajax({
                       type: "GET",
                       url: window.EverliveURL + '/Files/' + photoId,
                       headers: {
                    "X-Everlive-Fields": JSON.stringify(fieldsExp),
                },
                       contentType: "application/json",
                       success: onGetPhotoUriSuccess,
                       error: function (error) {
                           console.log(error);

                           navigator.notification.alert("Unfortunately we could not get your contact's photo!");
                       }
                   });

            function onGetPhotoUriSuccess(data) {
                var photos = [];
                photos.push(data.Result.Uri);
                 $("#photo").kendoMobileListView({
                        dataSource: photos,
                        template: "<div>Photo:</div><img src='#: data #'>"
                    });
            }
        }

        function loadMap(coordinates) {
            var map;
            var pos = new google.maps.LatLng(coordinates.latitude, coordinates.longitude);
            console.dir(coordinates);

            function initialize() {
                var mapOptions = {
                    zoom: 8,
                    center: pos,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };

                map = new google.maps.Map(document.getElementById('map-canvas'),
                                          mapOptions);
            }

            google.maps.event.addDomListener(window, 'load', initialize());
        }
    }

    function getConnectionType() {
        var connectionType = navigator.connection.type;
        return connectionType;
    }

    scope.details = function (e) {
        hasPic(e.sender.params.id, e.sender.params.hasPic).then(function () {
            var vm = kendo.observable({
                                          title: 'Details',
                                          id: e.sender.params.id,
                                          hasPic: e.sender.params.hasPic
                                      });

            kendo.bind(e.view.element, vm);
        });
    };
}(app.viewmodels));