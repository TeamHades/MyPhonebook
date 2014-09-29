(function () {
    'use strict';

    document.addEventListener('deviceready', function () {
        window.IMEI = device.uuid;
        window.EverliveURL = 'http://api.everlive.com/v1/H9jYTBMuDM1bSgv2';
        window.imeiId = {};

        navigator.splashscreen.hide();
        new kendo.mobile.Application(document.body, {
            transition: 'slide'
        });
    }, false);

    document.addEventListener("offline", function () {
        navigator.notification.confirm('There is no internet! Please check your connection. Exit now?',
            onConfirmQuit,
            'No internet connection',
            new Array("Exit", "Cancel")
        );

        function onConfirmQuit(button) {
            if (button == "1") {
                navigator.app.exitApp();
            }
        }
    }, false);

}());