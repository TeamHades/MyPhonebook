var app = app || {};
app.viewmodels = app.viewmodels || {};
(function (scope) {
    'use strict';
     
    function hasPic(contactId, hasPic) {
            if (hasPic) {
                getContactDetails(contactId);
            } else {
                postPhotoAndLocationToDb(contactId);
            }
        }
    
    function postPhotoAndLocationToDb(contactId) {
            var location = {};

            getCoordinates().then(gotLocation, gotLocation);

            function gotLocation(coordinates) {
                location = coordinates;
                getPhoto().then(gotPhoto);
            }

            function gotPhoto(photo) {
                everlive.Files.create({
                    Filename: Math.random().toString(36).substring(2, 15) + ".jpg",
                    ContentType: "image/jpeg",
                    base64: photo
                }).then(function (response) {

                    console.dir(response);
                    var contact = {
                        "Photo": response.result.Id,
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
                        url: 'http://api.everlive.com/v1/cAlfJ8nrI8IPqsTX/Contacts/' + contactId,
                        headers: {
                            "X-Everlive-Filter": JSON.stringify(filter)
                        },
                        contentType: "application/json",
                        data: JSON.stringify(contact),
                        success: function (data) {
                            navigator.notification.vibrate(1000);
                        },
                        error: function (error) {
                            navigator.notification.alert("Unfortunatelly we could not add the photo!");
                        }
                    });
                }, function (error) {
                    navigator.notification.alert("Unfortunatelly we could not add the photo!");
                });
            }
        }

        function getPhoto() {
            var promise = new RSVP.Promise(function (resolve, reject) {
                var onPhotoSuccess = function (data) {
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
                    navigator.notification.alert("Unfortunately we could not get your location!");
                    reject(error);
                };

                var geoSuccess = function (data) {
                    myGeolocation = {
                        longitude: data.coords.longitude,
                        latitude: data.coords.latitude
                    };

                    if (watchID != null) {
                        navigator.geolocation.clearWatch(watchID);
                        watchID = null;
                    }

                    resolve(myGeolocation);
                }

                var options = {
                    enableHighAccuracy: true,
                    maximumAge: 100,
                    timeout: 60000
                };

                if (navigator.geolocation) {
                    var watchID = navigator.geolocation.watchPosition(geoSuccess, error, options);
                } else {
                    error();
                }
            });

            return promise;
        }

        function getContactDetails(contactId) {
            var fieldsExp = {
                Contact: 1,
                Id: 0,
                Location: 1,
                Photo: 1
                //  "Location": 1
            };

            var filter = {
                "Id": contactId
            };


            $.ajax({
                url: 'http://api.everlive.com/v1/cAlfJ8nrI8IPqsTX/Contacts',
                type: "GET",
                headers: {
                    "X-Everlive-Fields": JSON.stringify(fieldsExp),
                    "X-Everlive-Filter": JSON.stringify(filter)
                },
                success: onGetContactSuccess,
                error: function (error) {
                    navigator.notification.alert("Unfortunately we could not get your contacts!");
                }
            });


            function onGetContactSuccess(data) {
                loadContactDetails(data.Result[0].Contact);
                loadPhoto(data.Result[0].Photo);
                loadMap(data.Result[0].Location);
            }

            function loadContactDetails(contact) {
                contact = {
                    "name": "Pesho",
                    "phoneNumber": "0891234567",
                    "test": null
                };
                var divForDetails = document.getElementById("contactDetails");
                var keys = _.keys(contact);
                var values = _.values(contact);

                for (var i = 0; i < keys.length; i++) {
                    if (values[i] != null && values[i] != '' && values[i] != undefined) {
                        var element = document.createElement("div");
                        var innerHtml = keys[i] + ': ' + values[i];
                        element.innerHTML = innerHtml;
                        divForDetails.appendChild(element);
                    }
                }
            }

            function loadPhoto(photoId) {
                console.dir(photoId);
                var fieldsExp = {
                    Uri: 1
                };
                $.ajax({
                    type: "GET",
                    url: 'http://api.everlive.com/v1/cAlfJ8nrI8IPqsTX/Files/' + photoId,
                    headers: {
                        "X-Everlive-Fields": JSON.stringify(fieldsExp),
                    },
                    contentType: "application/json",
                    success: onGetPhotoUriSuccess,
                    error: function (error) {
                        navigator.notification.alert("Unfortunately we could not get your contact's photo!");
                    }
                });

                function onGetPhotoUriSuccess(data) {
                    var divForPhoto = document.getElementById("photo");
                    var photo = document.createElement("img");
                    photo.setAttribute('src', data.Result.Uri);
                    photo.setAttribute('height', '150px');
                    photo.setAttribute('width', '200px');
                    divForPhoto.appendChild(photo);
                }
            }

            function loadMap(coordinates) {
                var map;
                var pos = new google.maps.LatLng(coordinates.latitude, coordinates.longitude);
                console.dir(coordinates);

                function initialize() {
                    var mapOptions = {
                        zoom: 6,
                        center: pos,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    };

                    map = new google.maps.Map(document.getElementById('map-canvas'),
                        mapOptions);

                    var marker = new google.maps.Marker({
                        position: map.getCenter(),
                        map: map
                    });
                }

                google.maps.event.addDomListener(window, 'load', initialize());
            }
        }

        function getConnectionType() {
            var connectionType = navigator.connection.type;
            return typeOfConnection;
        }

    scope.details = function (e) {
        hasPic(e.sender.params.id, e.sender.params.HasPic);
        var vm = kendo.observable({
            title: 'Details',
            id: e.sender.params.id,
            hasPic: e.sender.params.HasPic
        });

        kendo.bind(e.view.element, vm);
    };
}(app.viewmodels));