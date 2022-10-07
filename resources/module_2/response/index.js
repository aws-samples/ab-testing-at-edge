function handler(event) {
    console.log(JSON.stringify(event));
    var response = event.response;
    var headers = event.request.headers;
    var request = event.request;
    var X_Experiment_Value = 0;

    if (headers.createcookie) {
        console.log("create cookie exist");
        X_Experiment_Value = headers["createcookie"].value;
        response.cookies['X-Experiment'] = { "value": X_Experiment_Value };
        console.log("setting X-Experiment=" + X_Experiment_Value);

    } else {
        console.log("cookie missing");
    }

    return response;
}