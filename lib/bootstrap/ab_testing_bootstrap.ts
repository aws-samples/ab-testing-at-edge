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


export class Bootstrap extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const myBucket = new s3.Bucket(this, 'cdk-myBucket-deployment');
    const configBucket = new s3.Bucket(this, 'config-bucket-deployment');

    new s3deployment.BucketDeployment(this, "myDeployment", {
      sources: [s3deployment.Source.asset("./resources/website")],
      destinationBucket: myBucket,
    });

    const myDistribution = new cloudfront.Distribution(this, 'myDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(myBucket), viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS},
      defaultRootObject : 'index.html',
      comment : 'AB Testing Workshop - Bootstrap'
    });

    myDistribution.addBehavior('/', new origins.S3Origin(myBucket), {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    new CfnOutput(this, 'CloudFrontURL', {
      description: 'The CloudFront distribution URL',
      value: 'https://' + myDistribution.domainName,
    })

    new CfnOutput(this, 'ConfigBucketName', {
      description: 'The name of the bucket to store the configuration',
      value: configBucket.bucketName,
    })

  }
}
