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
}());