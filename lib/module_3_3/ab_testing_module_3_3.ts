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
  Stack, App, StackProps, CfnOutput, RemovalPolicy,
  aws_s3_deployment as s3deployment,
  aws_cloudfront_origins as origins,
  aws_cloudfront as cloudfront,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_dynamodb as dynamodb
} from "aws-cdk-lib";

import { ABDashboard } from '../ab_dashboard';


export class Module_3_3 extends Stack {

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostingBucket = new s3.Bucket(this, 'hosting-bucket-deployment');
    new s3deployment.BucketDeployment(this, "hosting", {
      sources: [s3deployment.Source.asset("./resources/website")],
      destinationBucket: hostingBucket,
    });

    const lambdaEdgeViewerRequest = new lambda.Function(this, 'LambdaEdgeViewerRequest', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('resources/module_3_3/request'),
    });

    const lambdaEdgeViewerResponse = new lambda.Function(this, 'LambdaEdgeViewerResponse', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('resources/module_3_3/response'),
    });

    const table = new dynamodb.Table(this, 'RedirectTable', {
      tableName: 'WebsiteRedirection',
      partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
      replicationRegions: [
        'us-east-1',
        'us-east-2',
        'us-west-2',
        'eu-west-2',
        'eu-central-1', ],
      removalPolicy: RemovalPolicy.DESTROY,
    });


    table.grantReadData(lambdaEdgeViewerRequest);


    const hostingOrigin = new origins.S3Origin(hostingBucket);

    const myDistribution = new cloudfront.Distribution(this, 'AB testing distribution', {
      defaultBehavior: {
         origin: hostingOrigin, viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },

      additionalBehaviors: {
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

       comment : 'AB Testing Workshop - Module 3-3'
    });

    const dashboard = new ABDashboard(this, "MonitoringDashboard");
    dashboard.createModule33Dashboard(lambdaEdgeViewerRequest.functionName, "", "ABTestingWorkshopModule33");

    new CfnOutput(this, 'CloudFrontURL', {
      description: 'The CloudFront distribution URL',
      value: 'https://' + myDistribution.domainName,
  })

  }
}
