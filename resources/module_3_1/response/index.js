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

const COOKIE_KEY = "X-Experiment";

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

const setCookie = function (response, cookie) {
    console.log(`Setting cookie ${cookie}`);
    response.headers['set-cookie'] = response.headers['set-cookie'] || [];
    response.headers['set-cookie'] = [{
        key: "Set-Cookie",
        value: cookie
    }];
}

exports.handler = async event => {

    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const response = event.Records[0].cf.response;

    const cookieVal = getCookie(headers, COOKIE_KEY);
    if (cookieVal) {
        console.log(`setting cookie ${COOKIE_KEY}=${cookieVal}`);
        setCookie(response, `${COOKIE_KEY}=${cookieVal}`);
    }else{
        console.log(`no ${COOKIE_KEY} cookie`);
    }

    return response;

}