var app = app || {};
app.viewmodels = app.viewmodels || {};
(function (scope) {
    'use strict';
     
    

    scope.details = function (e) {
        var vm = kendo.observable({
            title: 'Details',
            id: e.sender.params.id
        });

        kendo.bind(e.view.element, vm);
    };
}(app.viewmodels));