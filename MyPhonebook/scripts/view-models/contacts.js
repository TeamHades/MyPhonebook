/* global window, kendo */

var http = http || HttpRequester;
var app = app || {};
app.viewmodels = app.viewmodels || {};

(function (scope) {
    'use strict';

    function getContactsFromPhone() {
        var fields = [
            navigator.contacts.fieldType.displayName
        ];

        var options = new ContactFindOptions();
        options.multiple = true;

        var promise = new RSVP.Promise(function (resolve, reject) {
            navigator.contacts.find(fields,
              function (contactsResponse) {
                  window.contacts = contactsResponse;
                  resolve(contactsResponse);
              },
              function (contactsResponse) {
                  reject(contactsResponse);
              }, options);
        });

        return promise;
    }

    function saveContactsOnServer(contacts, imeiResponse) {
        var contactsToSend = [];
        for (var i = 0; i < contacts.length; i++) {
            contactsToSend.push({
                Imei_id: imeiResponse.Result.Id,
                Contact: contacts[i],
                HasPic: false
            });
        }

        return http.postJSON(window.EverliveURL + '/Contacts', {}, contactsToSend);
    }

    function getContactactsFromServer(imeiIdFromServer) {
        var fields = {
            Id: 1,
            Contact: 1,
            HasPic: 1
        };
        var filter = {
            "Imei_id": imeiIdFromServer
        }
        var headers = {
            "X-Everlive-Fields": JSON.stringify(fields),
            "X-Everlive-Filter": JSON.stringify(filter)
        }

        return http.getJSON(window.EverliveURL + '/Contacts', headers);
    }

    function saveImeiToServer(imei) {
        var imeiToSend = {
            Imei: imei
        };

        return http.postJSON(window.EverliveURL + '/Imeis', {}, imeiToSend);
    }

    function getImeiFromServer(imei) {
        var fields = {
            Imei: 1
        };
        var filter = {
            "Imei": imei
        }
        var headers = {
            "X-Everlive-Fields": JSON.stringify(fields),
            "X-Everlive-Filter": JSON.stringify(filter)
        }

        return http.getJSON(window.EverliveURL + '/Imeis', headers);
    }

    function loadContacts() {
        var promise = new RSVP.Promise(function (resolve, reject) {
            getImeiFromServer(window.IMEI).then(function (response) {
                console.dir(response);
                if (response.Count == 0) {
                    saveImeiToServer(window.IMEI)
                        .then(function (imeiResponse) {
                            window.imeiId = imeiResponse;
                            return getContactsFromPhone();
                        }, function (error) {
                            console.log(error);
                        })
                        .then(function (contactsFromPhone) {
                            console.log(contactsFromPhone);
                            console.log(window.imeiId);
                            return saveContactsOnServer(contactsFromPhone, window.imeiId);
                        }, function (error) {
                            console.log(error);
                        })
                        .then(function (response) {
                            console.log(response);
                            resolve(response);
                        }, function (erro) {
                            console.log(erro);
                            reject(erro);
                        });
                } else {
                    var imeiIdFromServer = response.Result[0].Id;
                    getContactactsFromServer(imeiIdFromServer)
                        .then(function (responseContacts) {
                            window.contacts = responseContacts;
                            resolve(responseContacts);
                        });
                }
            });
        });

        return promise;
    }

    function syncContacts(e) {
                function findNewContacts(database, contacts) {
            var newContacts = contacts.filter(function (x) {
                for (var i = 0; i < database.length; i++) {
                    if (_.isEqual(x, database[i])) {
                        return false;
                    }
                }

                return true;
            });

            return newContacts;
        }
    }

    scope.contacts = function (e) {
        console.log("ddsd");
        loadContacts().then(function (result) {
            console.log(result.Result);
            var vm = kendo.observable({
                title: 'Contacts',
                contacts: result.Result,
                sync: syncContacts
            });

            kendo.bind(e.view.element, vm);
        });
    };
}(app.viewmodels));