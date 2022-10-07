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

import {
  Stack, App, StackProps, CfnOutput,
  aws_s3_deployment as s3deployment,
  aws_cloudfront_origins as origins,
  aws_cloudfront as cloudfront,
  aws_s3 as s3
} from "aws-cdk-lib";

import { ABDashboard } from '../ab_dashboard';


export class Module_2 extends Stack {

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostingBucket = new s3.Bucket(this, 'hosting-bucket');
    const myOrigin = new origins.S3Origin(hostingBucket);

    new s3.Bucket(this, 'my-config-ab-testing-bucket');

    const viewerRequestFunction = new cloudfront.Function(this, "StatefulViewerRequest", {
      code: cloudfront.FunctionCode.fromFile({
        filePath: "resources/module_2/request/index.js",
      })
    });

    const viewerResponseFunction = new cloudfront.Function(this, "StatefulViewerResponse", {
      code: cloudfront.FunctionCode.fromFile({
        filePath: "resources/module_2/response/index.js",
      })
    });

    new s3deployment.BucketDeployment(this, "myDeployment", {
      sources: [s3deployment.Source.asset("./resources/website")],
      destinationBucket: hostingBucket,
    });

    const myDistribution = new cloudfront.Distribution(this, 'myDistribution', {
      defaultBehavior: {
        origin: myOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      additionalBehaviors: {
        '/': {
          origin: myOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [{
            function: viewerRequestFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
          {
            function: viewerResponseFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE,
          }],
        }
      },
      comment : 'AB Testing Workshop - Module 2'
    });

    const dashboard = new ABDashboard(this, "MonitoringDashboard");
    dashboard.createModule2Dashboard(viewerRequestFunction.functionName, viewerResponseFunction.functionName, "ABTestingWorkshopModule2");

    new CfnOutput(this, 'CloudFrontURL', {
      description: 'The CloudFront distribution URL',
      value: 'https://' + myDistribution.domainName,
  })

  }
}
