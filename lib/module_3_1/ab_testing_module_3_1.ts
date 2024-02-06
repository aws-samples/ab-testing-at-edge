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

import { Stack, App, StackProps, CfnOutput } from "aws-cdk-lib";
import { Distribution, Function, FunctionCode, FunctionEventType, FunctionRuntime, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { join } from "path";

import { ABDashboard } from "../ab_dashboard";
import { FunctionWithStore } from "./function-with-store";

const RESOURCES_PATH_PREFIX = join(__dirname, "../../resources/module_3_1");

export class Module_3_1 extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostingBucket = new Bucket(this, "bucket");
    new BucketDeployment(this, "deployment", {
      sources: [Source.asset("./resources/website")],
      destinationBucket: hostingBucket,
    });

    const viewerRequest = new FunctionWithStore(this, "viewer-request", {
      entryPath: RESOURCES_PATH_PREFIX + "/viewer-request-function.js",
      keyValueStoreImportSourcePath: RESOURCES_PATH_PREFIX + "/viewer-request-store-source.json"
    });

    const viewerResponse = new Function(this, "viewer-response", {
      code: FunctionCode.fromFile({ filePath: RESOURCES_PATH_PREFIX + "/viewer-response-function.js" }),
      runtime: FunctionRuntime.JS_2_0
    })

    const defaultBehavior = {
      origin: new S3Origin(hostingBucket),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    };

    const distribution = new Distribution(this, "distribution", {
      defaultBehavior,
      additionalBehaviors: {
        "/": {
          ...defaultBehavior,
          functionAssociations: [
            { function: viewerRequest, eventType: FunctionEventType.VIEWER_REQUEST },
            { function: viewerResponse, eventType: FunctionEventType.VIEWER_RESPONSE },
          ],
        },
      },
      comment: "AB Testing Workshop - Module 3-1"
    });

    new CfnOutput(this, "distribution-domain-name", {
      description: "CloudFront Distribution URL",
      value: "https://" + distribution.domainName,
    })

    const dashboard = new ABDashboard(this, "MonitoringDashboard");
    dashboard.createModule31Dashboard(viewerRequest.functionName, viewerResponse.functionName, "ABTestingWorkshopModule31");
  }
}
