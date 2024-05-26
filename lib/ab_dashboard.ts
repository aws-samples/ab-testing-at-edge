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
    Duration,
    aws_cloudwatch as cloudwatch
  } from "aws-cdk-lib";

import { Construct } from "constructs";


export class ABDashboard extends Construct {


    constructor(scope: Construct, id: string) {
        super(scope, id);
    }

    private createLEVersionsWidget(functionName : string, region : string, title: string): cloudwatch.LogQueryWidget {

        return new cloudwatch.LogQueryWidget({
            logGroupNames: ["/aws/lambda/us-east-1."+functionName],
            view: cloudwatch.LogQueryVisualizationType.PIE,
            title: title,
            width: 6,
            height: 6,
            region: region,
            queryLines: [
              "fields @timestamp, @message",
              "filter @message like /X_Experiment_V/",
              'parse "* *" as a,version',
              "stats count(*) as VERSIONS by version as total",
            ]
          })

    }


    private createCFFVersionsWidget(functionName : string, title: string): cloudwatch.LogQueryWidget{
        return new cloudwatch.LogQueryWidget({
            logGroupNames: ["/aws/cloudfront/function/"+functionName],
            view: cloudwatch.LogQueryVisualizationType.PIE,
            title: title,
            width: 9,
            height: 8,
            queryLines: [
                "fields @timestamp, @message",
                "filter @message like /X_Experiment_V/",
                'parse "* * *" as a,b,version',
                "stats count(*) as VERSIONS by version as total",
            ]
            })

    }

    private createLEUsersWidget(functionName : string, region : string, title: string): cloudwatch.LogQueryWidget {

        return new cloudwatch.LogQueryWidget({
            logGroupNames: ["/aws/lambda/us-east-1."+functionName],
            view: cloudwatch.LogQueryVisualizationType.PIE,
            title: title,
            width: 6,
            height: 6,
            region: region,
            queryLines: [
              "fields @timestamp, @message",
              "filter @message like /X_Experiment_U/",
              'parse "* *" as a,version',
              "stats count(*) as USERS by version as total",
            ]
          })

    }


    private createCFFUsersWidget(functionName : string, title: string): cloudwatch.LogQueryWidget {

        return new cloudwatch.LogQueryWidget({
            logGroupNames: ["/aws/cloudfront/function/"+functionName],
            view: cloudwatch.LogQueryVisualizationType.PIE,
            title: title,
            width: 9,
            height: 8,
            queryLines: [
            "fields @timestamp, @message",
            "filter @message like /X_Experiment_U/",
            'parse "* * *" as a,b,version',
            "stats count(*) as USERS by version as total",
            ]
        })
    }


    private createLEInvocationMetric(functionName: string, region: string, title: string): cloudwatch.Metric {

        return new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Invocations",
            period: Duration.minutes(5),
            dimensionsMap: { FunctionName: "us-east-1." + functionName},
            label: title,
            statistic: "sum",
            region: region
        });

    }

    private createCFFInvocationMetricAvg(functionName: string, metricName: string, title: string): cloudwatch.Metric{
        return new cloudwatch.Metric({
            namespace: "AWS/CloudFront",
            metricName: metricName,
            period: Duration.minutes(5),
            dimensionsMap: { FunctionName: functionName, Region: "Global" },
            label: title,
            statistic: "avg"
        });
    }

        private createCFFInvocationMetricSum(functionName: string, metricName: string, title: string): cloudwatch.Metric{
        return new cloudwatch.Metric({
            namespace: "AWS/CloudFront",
            metricName: metricName,
            period: Duration.minutes(5),
            dimensionsMap: { FunctionName: functionName, Region: "Global" },
            label: title,
            statistic: "sum"
        });
    }

    private create1CFFInvocationWidgetGraph(functionNameVreq : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Invocations (sum)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricSum(functionNameVreq, "FunctionInvocations", "viewer-request")
            ]

          })
    }

    private create2CFFInvocationWidgetGraph(functionNameVreq : string, functionNameVresp : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Invocations (sum)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricSum(functionNameVreq, "FunctionInvocations", "viewer-request"),
                this.createCFFInvocationMetricSum(functionNameVresp, "FunctionInvocations", "viewer-response")
            ]

          })
    }

    private create1CFFValidationsWidgetGraph(functionName1 : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Validation Errors (Avg)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricAvg(functionName1, "FunctionValidationErrors", "viewer-request")
            ]

          })
    }

    private create2CFFValidationsWidgetGraph(functionNameVreq : string, functionNameVresp : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Validation Errors (Avg)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricAvg(functionNameVreq, "FunctionValidationErrors", "viewer-request"),
                this.createCFFInvocationMetricAvg(functionNameVresp, "FunctionValidationErrors", "viewer-response")
            ]

          })
    }

    private create1CFFErrorsWidgetGraph(functionNameVreq : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Execution Errors (Avg)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricAvg(functionNameVreq, "FunctionExecutionErrors", "viewer-request")
            ]

          })
    }

    private create2CFFErrorsWidgetGraph(functionNameVreq : string, functionNameVresp : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Execution Errors (Avg)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricAvg(functionNameVreq, "FunctionExecutionErrors", "viewer-request"),
                this.createCFFInvocationMetricAvg(functionNameVresp, "FunctionValidationErrors", "viewer-response")
            ]

          })
    }

    private create1CFFComputeWidgetGraph(functionNameVreq : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Compute Utilization (Avg)",
            height: 12,
            width: 24,
            stacked : true,
            left: [
                this.createCFFInvocationMetricAvg(functionNameVreq, "FunctionComputeUtilization", "viewer-request")
            ]

          })
    }

    private create2CFFComputeWidgetGraph(functionNameVreq : string, functionNameVresp : string): cloudwatch.GraphWidget {
        return new cloudwatch.GraphWidget({
            title: "Compute Utilization (Avg)",
            stacked : true,
            height: 12,
            width: 24,
            left: [
                this.createCFFInvocationMetricAvg(functionNameVreq, "FunctionComputeUtilization", "viewer-request"),
                this.createCFFInvocationMetricAvg(functionNameVresp, "FunctionComputeUtilization", "viewer-response")
            ]

          })
    }

    private create1CFFInvocationWidgetSingleValue(functionNameVreq : string): cloudwatch.SingleValueWidget {
        return new cloudwatch.SingleValueWidget({
            title: "Invocations (Sum)",
            width: 6,
            height: 8,
            setPeriodToTimeRange: true,
            metrics: [
                this.createCFFInvocationMetricSum(functionNameVreq, "FunctionInvocations", "viewer-request")
            ]

          })

    }

    private create2CFFInvocationWidgetSingleValue(functionNameVreq : string, functionNameVresp : string): cloudwatch.SingleValueWidget {
        return new cloudwatch.SingleValueWidget({
            title: "Invocations (Sum)",
            width: 6,
            height: 8,
            setPeriodToTimeRange: true,
            metrics: [
                this.createCFFInvocationMetricSum(functionNameVreq, "FunctionInvocations", "viewer-request"),
                this.createCFFInvocationMetricSum(functionNameVresp, "FunctionInvocations", "viewer-response")
            ]

          })

    }

    private createLEInvocationWidget(functionName : string): cloudwatch.SingleValueWidget {

        const m1 = this.createLEInvocationMetric(functionName, "us-east-1", "US-East (N. Virginia)");
        const m2 = this.createLEInvocationMetric(functionName, "us-east-2", "US-East (Ohio)");
        const m3 = this.createLEInvocationMetric(functionName, "us-west-1", "US-West (N. California)");
        const m4 = this.createLEInvocationMetric(functionName, "ap-south-1", "Asia Pacific (Mumbai)");
        const m5 = this.createLEInvocationMetric(functionName, "ap-northeast-1", "Asia Pacific (Tokyo)");
        const m6 = this.createLEInvocationMetric(functionName, "ap-northeast-2", "Asia Pacific (Seoul)");
        const m7 = this.createLEInvocationMetric(functionName, "ap-southeast-1", "Asia Pacific (Singapore)");
        const m8 = this.createLEInvocationMetric(functionName, "ap-southeast-2", "Asia Pacific (Sydney)");
        const m9 = this.createLEInvocationMetric(functionName, "eu-west-1", "EU (Ireland)");
        const m10 = this.createLEInvocationMetric(functionName, "eu-west-2", "EU (London)");
        const m11 = this.createLEInvocationMetric(functionName, "eu-west-3", "EU (Paris)");
        const m12 = this.createLEInvocationMetric(functionName, "eu-central-1", "EU (Frankfurt)");
        const m13 = this.createLEInvocationMetric(functionName, "sa-east-1", "South America (Sao Paulo)");
        const m14 = this.createLEInvocationMetric(functionName, "us-east-1", "All regions (sum)");

        return new cloudwatch.SingleValueWidget({
            title: "Lambda invocations - Viewer request",
            height: 6,
            width: 24,
            setPeriodToTimeRange: true,
            metrics: [
                new cloudwatch.MathExpression({
                        expression: "m1+m2+m3+m4+m5+m6+m7+m8+m9+m10+m11+m12+m13+m14",
                        label: "All regions (sum)",
                        usingMetrics: {
                          m1: m1,
                          m2: m2,
                          m3: m3,
                          m4: m4,
                          m5: m5,
                          m6: m6,
                          m7: m7,
                          m8: m8,
                          m9: m9,
                          m10: m10,
                          m11: m11,
                          m12: m12,
                          m13: m13,
                          m14: m14
                        },
                        }),
                        m1,
                        m2,
                        m3,
                        m4,
                        m5,
                        m6,
                        m7,
                        m8,
                        m9,
                        m10,
                        m11,
                        m12,
                        m13,
                        m14,
            ]

          })
    }


    public createLEDashboard(vreqFunctionName: string, vrespFunctionName: string, title: string): cloudwatch.Dashboard {

        return new cloudwatch.Dashboard(this, "MonitoringDashboard", {
        dashboardName: title,
        widgets: [
            [
            new cloudwatch.Column(this.createLEVersionsWidget(vreqFunctionName, "us-east-1", "US-East (N. Virginia)")),
            new cloudwatch.Column(this.createLEVersionsWidget(vreqFunctionName, "us-east-2", "US East (Ohio)")),
            new cloudwatch.Column(this.createLEVersionsWidget(vreqFunctionName, "eu-west-2", "EU (London)")),
            new cloudwatch.Column(this.createLEVersionsWidget(vreqFunctionName, "eu-west-1", "EU (Ireland)")),
            new cloudwatch.Column(this.createLEUsersWidget(vreqFunctionName, "us-east-1", "US-East (N. Virginia)")),
            new cloudwatch.Column(this.createLEUsersWidget(vreqFunctionName, "us-east-2", "US East (Ohio)")),
            new cloudwatch.Column(this.createLEUsersWidget(vreqFunctionName, "eu-west-2", "EU (London)")),
            new cloudwatch.Column(this.createLEUsersWidget(vreqFunctionName, "eu-west-1", "EU (Ireland)")),
            new cloudwatch.Column(this.createLEInvocationWidget(vreqFunctionName)),
            ]
        ]})

    }

    public create1CFFDashboard(vreqFunctionName: string, title: string): cloudwatch.Dashboard {

        return new cloudwatch.Dashboard(this, "MonitoringDashboard", {
        dashboardName: title,
        widgets: [
            [
            new cloudwatch.Column(this.createCFFVersionsWidget(vreqFunctionName, "Versions")),
            new cloudwatch.Column(this.create1CFFInvocationWidgetSingleValue(vreqFunctionName)),
            new cloudwatch.Column(this.create1CFFInvocationWidgetGraph(vreqFunctionName)),
            new cloudwatch.Column(this.create1CFFComputeWidgetGraph(vreqFunctionName)),
            new cloudwatch.Column(this.create1CFFValidationsWidgetGraph(vreqFunctionName)),
            new cloudwatch.Column(this.create1CFFErrorsWidgetGraph(vreqFunctionName)),

            ]
        ]})

    }

    public create2CFFDashboard(vreqFunctionName: string, vrespFunctionName: string, title: string): cloudwatch.Dashboard {

        return new cloudwatch.Dashboard(this, "MonitoringDashboard", {
        dashboardName: title,
        widgets: [
            [
            new cloudwatch.Column(this.createCFFVersionsWidget(vreqFunctionName, "Versions")),
            new cloudwatch.Column(this.createCFFUsersWidget(vreqFunctionName, "Users")),
            new cloudwatch.Column(this.create2CFFInvocationWidgetSingleValue(vreqFunctionName, vrespFunctionName)),
            new cloudwatch.Column(this.create2CFFInvocationWidgetGraph(vreqFunctionName, vrespFunctionName)),
            new cloudwatch.Column(this.create2CFFComputeWidgetGraph(vreqFunctionName, vrespFunctionName)),
            new cloudwatch.Column(this.create2CFFValidationsWidgetGraph(vreqFunctionName, vrespFunctionName)),
            new cloudwatch.Column(this.create2CFFErrorsWidgetGraph(vreqFunctionName, vrespFunctionName)),
            ]
        ]})

    }

    public createModule33Dashboard(vreqFunctionName: string, vrespFunctionName: string, title: string): cloudwatch.Dashboard {
        return this.createLEDashboard(vreqFunctionName, vrespFunctionName, title);
    }


    public createModule32Dashboard(vreqFunctionName: string, vrespFunctionName: string, title: string): cloudwatch.Dashboard {
        return this.createLEDashboard(vreqFunctionName, vrespFunctionName, title);
    }

    public createModule31Dashboard(vreqFunctionName: string, vrespFunctionName: string, title: string): cloudwatch.Dashboard {
        return this.create2CFFDashboard(vreqFunctionName, vrespFunctionName, title);
    }

    public createModule2Dashboard(vreqFunctionName: string, vrespFunctionName: string, title: string): cloudwatch.Dashboard {
        return this.create2CFFDashboard(vreqFunctionName, vrespFunctionName, title);
    }

    public createModule1Dashboard(vreqFunctionName: string, title: string): cloudwatch.Dashboard {
        return this.create1CFFDashboard(vreqFunctionName, title);
    }




}