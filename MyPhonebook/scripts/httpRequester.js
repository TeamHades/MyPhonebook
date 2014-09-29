var HttpRequester = (function () {
    var httpRequester = (function () {
        function ajaxRequest(url, type, headers, data) {
            var promise = new RSVP.Promise(function (resolve, reject) {
                if (data) {
                    data = JSON.stringify(data);
                }

                $.ajax({
                    url: url,
                    type: type,
                    contentType: 'application/json',
                    data: data,
                    headers: headers || {},
                    success: function (responseData) {
                        resolve(responseData);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });

            return promise;
        }

        function getJSON(url, headers) {
            return ajaxRequest(url, 'GET', headers);
        }

        function postJSON(url, headers, data) {
            return ajaxRequest(url, 'POST', headers, data);
        }

        function putJSON(url, headers, data) {
            return ajaxRequest(url, 'PUT', headers, data);
        }

        return {
            getJSON: getJSON,
            postJSON: postJSON,
            putJSON: putJSON
        }
    }());

    return httpRequester;
}());