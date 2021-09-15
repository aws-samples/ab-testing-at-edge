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
const ssm = new aws.SSM();
const s3 = new aws.S3();

let configBucketName;
const TTL = 60000; // TTL of 60 seconds
const COOKIE_KEY = "X-Experiment";
const PATH = "/";
const S3_CONFIG_KEY = "config/ab_testing_config.json";
const SSM_BUCKET_PARAM_NAME = "AB-S3-ConfigBucket";


async function getConfigFromS3() {

  try {

    const s3Params = {
      Bucket: configBucketName,
      Key: S3_CONFIG_KEY,
    };
    const response = await s3.getObject(s3Params).promise();
    return JSON.parse(response.Body.toString('utf-8'));
  } catch (_error) {
    console.error(_error)
    return undefined;
  }
}

let config;
function fetchConfigFromS3() {
  if (!config) {
    config = getConfigFromS3();

    setTimeout(() => {
      config = undefined;
    }, TTL);
  }

  return config;
}

async function fetchConfigFromSSM() {
  if (!configBucketName) {
    try {
      configBucketName = await ssm
        .getParameter({ Name: SSM_BUCKET_PARAM_NAME, WithDecryption: true })
        .promise()
        .then(data => {
          return data.Parameter.Value
        });
    } catch (_error) {
      console.error(_error);
      return undefined;
    }
  }
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
  await fetchConfigFromSSM();
  var X_Experiment_Value = 0;

  try {
    const cookieVal = getCookie(headers, COOKIE_KEY);
    const myConfig = await fetchConfigFromS3();

    if (cookieVal) {
      //we have a cookie, so no random applied
      X_Experiment_Value = parseInt(cookieVal);
      console.log("X_Experiment_U RETURNING_USER");

    } else {
      //no cookie found, select random based on S3 config path
      console.log("X_Experiment_U NEW_USER");
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