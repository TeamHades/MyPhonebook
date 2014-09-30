var app = app || {};
app.viewmodels = app.viewmodels || {};

(function (scope) {
    'use strict';

    function getConnection() {
        var promise = new RSVP.Promise(function (resolve, reject) {
            resolve("Your connection is: " + navigator.connection.type);
        });
        return promise
    }
    

    scope.connection = function (e) {
        getConnection().then(function (result) {
            console.log(result);

            var vm = kendo.observable({
                connection: result
            });

            kendo.bind(e.view.element, vm);
        });
    };
}(app.viewmodels));