import cf from 'cloudfront';
const kvsId = '__KVS_ID__'; // replaced during CDK template synthesis
const kvsHandle = cf.kvs(kvsId);

async function handler(event) {
    const request = event.request;
    const configRaw = await kvsHandle.get('config'); // CFF runtime doesn't support nested await
    const config = JSON.parse(configRaw);

    // Check if site was already visited by the user
    const returningUser = Boolean(request.cookies['X-Experiment']);
    console.log(returningUser ? 'RETURNING USER' : 'NEW USER');

    // If already visited, parse the experiment value, else generate one
    const experimentValue = returningUser ? parseInt(request.cookies["X-Experiment"].value) : Math.floor(Math.random() * 100);
    console.log('EXPERIMENT VALUE: ' + experimentValue);

    // Set the correct URI for the experiment
    request.uri = experimentValue < config.THRESHOLD ? config.URI_A : config.URI_B;
    console.log('FINAL URI: ' + request.uri);

    // Set the experiment value as a header - we will use it in the viewer response function
    request.headers['x-experiment'] = { value: "" + experimentValue };
    return request;
}
