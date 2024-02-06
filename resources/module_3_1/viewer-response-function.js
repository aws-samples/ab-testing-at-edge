function handler(event) {
  const request = event.request;
  const response = event.response;

  // The header x-experiement is set by the viewer request function, but we check it here anyway for sanity
  if (request.headers['x-experiment']) {
      const experimentValue = request.headers["x-experiment"].value;
      response.cookies['X-Experiment'] = { value: experimentValue };
      console.log('EXPERIMENT VALUE: ' + experimentValue);
      console.log('FULL RESPONSE: ' + JSON.stringify(response));
  }

  return response;
}
