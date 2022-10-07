var X_Experiment_A = "index.html";
var X_Experiment_B = "index_b.html";
var X_Experiment_Value = 0;

function handler(event) {
    console.log(JSON.stringify(event));
    var request = event.request;
    var headers = request.headers;

    // If no experiment value, generate it, and store it in a header, else read it.
    if (!request.cookies['X-Experiment']) {
        X_Experiment_Value = Math.floor(Math.random() * 100);
        console.log("X_Experiment_U NEW_USER");
    } else {
        X_Experiment_Value = parseInt(request.cookies["X-Experiment"].value);
        console.log("X_Experiment_U RETURNING_USER");

    }

    headers.createcookie = { value: (X_Experiment_Value).toString() };

    if (X_Experiment_Value < 80) {
        request.uri = '/index_b.html';
    } else {
        request.uri = '/index.html';
    }
    console.log("after=" + JSON.stringify(event));

    console.log("X_Experiment_V " + (request.uri == '/index.html' ? 'A_VERSION' : 'B_VERSION'));
    return request;

};