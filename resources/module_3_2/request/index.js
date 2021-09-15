/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const aws = require('aws-sdk');
aws.config.update({ region: "us-east-1" });
const https = require('https');

const TTL = 60000; // TTL of 60 seconds
const COOKIE_KEY = "X-Experiment";
const PATH = "/";
const config;

async function getConfigFromCF(distributionDomainName) {
  let dataString = '';
  const response = await new Promise((resolve, reject) => {
    const req = https.get('https://' + distributionDomainName + '/config/ab_testing_config.json', function (res) {
      res.on('data', chunk => {
        dataString += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(dataString));
      });
    });

    req.on('error', (e) => {
      reject(undefined);
    });
  });

  return response;
}


function fetchConfigFromCF(distributionDomainName) {
  if (!config) {
    config = getConfigFromCF(distributionDomainName);

    setTimeout(() => {
      config = undefined;
    }, TTL);
  }

  return config;
}

const getCookie = (headers, cookieKey) => {
  if (headers.cookie) {
    for (let cookieHeader of headers.cookie) {
      const cookies = cookieHeader.value.split(';');
      for (let cookie of cookies) {
        const [key, val] = cookie.split('=');
        if (key === cookieKey) {
          return val;
        }
      }
    }
  }
  return null;
}

const setCookie = function (headers, cookie) {
  console.log(`Setting cookie ${cookie}`);

  headers.cookie = headers.cookie || [];
  headers.cookie.push({ key: 'Cookie', value: cookie });

}


exports.handler = async event => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const distributionDomainName = event.Records[0].cf.config.distributionDomainName;
  console.log("EVENT=" + JSON.stringify(event));
  var X_Experiment_Value = 0;

  try {

    const cookieVal = getCookie(headers, COOKIE_KEY);
    const myConfig = await fetchConfigFromCF(distributionDomainName);

    if (cookieVal) {
      //we have a cookie, so no random applied
      X_Experiment_Value = parseInt(cookieVal);
      console.log("X_Experiment_U RETURNING_USER");
    } else {
      console.log("X_Experiment_U NEW_USER");

      //no cookie found, random value
      X_Experiment_Value = Math.floor(Math.random() * 100);

    }

    setCookie(headers, `${COOKIE_KEY}=${X_Experiment_Value}`);

    if (X_Experiment_Value < myConfig[PATH].segment) {
      request.uri = '/' + myConfig[PATH].version_b;
    } else {
      request.uri = '/' + myConfig[PATH].version_a;
    }

    console.log("X_Experiment_V " + (request.uri == '/' + myConfig[PATH].version_a ? 'A_VERSION' : 'B_VERSION'));

    return request;

  } catch (_error) {
    console.error(_error)
    return request;
  }
};