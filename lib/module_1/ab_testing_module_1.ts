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

import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deployment from "@aws-cdk/aws-s3-deployment";
import { ABDashboard } from '../ab_dashboard';

import * as cdk from "@aws-cdk/core";
export class Module_1 extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostingBucket = new s3.Bucket(this, 'hosting-bucket');
    const myOrigin = new origins.S3Origin(hostingBucket);

    const myConfigBucket = new s3.Bucket(this, "my-config-ab-testing-bucket");

    const viewerRequestFunction = new cloudfront.Function(this, 'StatelessViewerRequest', {
      code: cloudfront.FunctionCode.fromInline(`
      var X_Experiment_A = 'index.html';
      var X_Experiment_B = 'index_b.html';

      function handler(event) {
        var request = event.request;
        if (Math.random() < 0.8) {
           request.uri = '/' + X_Experiment_A;
        } else {
           request.uri = '/' + X_Experiment_B;
        }
        console.log('X_Experiment_V ' + (request.uri == '/index.html' ? 'A_VERSION' : 'B_VERSION'));

        return request;
      }

      `),
    });

    new s3deployment.BucketDeployment(this, "myDeployment", {
      sources: [s3deployment.Source.asset("./resources/website")],
      destinationBucket: hostingBucket,
    });

    const myDistribution = new cloudfront.Distribution(this, "myDistribution", {
      defaultBehavior: {
        origin: myOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/': {
          origin: myOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [{
            function: viewerRequestFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          }],
        }
      },
      comment: "AB Testing Workshop - Module 1",
    });

    const dashboard = new ABDashboard(this, "MonitoringDashboard");
    dashboard.createModule1Dashboard(viewerRequestFunction.functionName, "ABTestingWorkshopModule1");

    new cdk.CfnOutput(this, "CloudFrontURL", {
      description: "The CloudFront distribution URL",
      value: "https://" + myDistribution.domainName,
    });
  }
}
