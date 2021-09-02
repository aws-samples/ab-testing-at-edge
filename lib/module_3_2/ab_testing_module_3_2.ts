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

import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deployment from "@aws-cdk/aws-s3-deployment";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from '@aws-cdk/core';
import { ABDashboard } from '../ab_dashboard';

export class Module_3_2 extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostingBucket = new s3.Bucket(this, 'hosting-bucket-deployment');
    const configBucket = new s3.Bucket(this, 'config-bucket-deployment');


    new s3deployment.BucketDeployment(this, "hosting", {
      sources: [s3deployment.Source.asset("./resources/website")],
      destinationBucket: hostingBucket,
    });

    new s3deployment.BucketDeployment(this, "config", {
      sources: [s3deployment.Source.asset("resources/module_3_2/segmentation")],
      destinationBucket: configBucket,
    });

    const lambdaEdgeViewerRequest = new lambda.Function(this, 'LambdaEdgeViewerRequest', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('resources/module_3_2/request'),
    });

    const lambdaEdgeViewerResponse = new lambda.Function(this, 'LambdaEdgeViewerResponse', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('resources/module_3_2/response'),
    });

    const hostingOrigin = new origins.S3Origin(hostingBucket);
    const configOrigin = new origins.S3Origin(configBucket);

    const myDistribution = new cloudfront.Distribution(this, 'AB testing distribution', {
      defaultBehavior: {
         origin: hostingOrigin, viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },

      additionalBehaviors: {
        'config/ab_testing_config.json': {
          origin: configOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,

        },
        '/': {
          origin: hostingOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          edgeLambdas: [
            {
              functionVersion: lambdaEdgeViewerRequest.currentVersion,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            },
            {
              functionVersion: lambdaEdgeViewerResponse.currentVersion,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
            },
          ],
        },

      },

       comment : 'AB Testing Workshop - Module 3-2'
    });

    const dashboard = new ABDashboard(this, "MonitoringDashboard");
    dashboard.createModule33Dashboard(lambdaEdgeViewerRequest.functionName, "", "ABTestingWorkshopModule32");


    new cdk.CfnOutput(this, 'CloudFrontURL', {
      description: 'The CloudFront distribution URL',
      value: 'https://' + myDistribution.domainName,
  })

  }
}
