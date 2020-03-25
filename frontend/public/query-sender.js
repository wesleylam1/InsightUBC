/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */

CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let httpRequest = new XMLHttpRequest();
        httpRequest.open('POST', '/query', true);
        httpRequest.setRequestHeader('Type', 'application/json');
        httpRequest.onload = function () {
            if (httpRequest.status === 200) {
                fulfill(httpRequest.responseText);
            } else {
                reject(httpRequest.responseText);
            }

        };
        httpRequest.onerror = function () {
            reject("request fail")
        }
        httpRequest.send(JSON.stringify(query));

    });
};
