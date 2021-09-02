#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Bootstrap } from '../lib/bootstrap/ab_testing_bootstrap';
import { Module_1 } from '../lib/module_1/ab_testing_module_1';
import { Module_2 } from '../lib/module_2/ab_testing_module_2';
import { Module_3_1 } from '../lib/module_3_1/ab_testing_module_3_1';
import { Module_3_2 } from '../lib/module_3_2/ab_testing_module_3_2';
import { Module_3_3 } from '../lib/module_3_3/ab_testing_module_3_3';

const app = new cdk.App();

new Bootstrap(app, 'ABWorkshopBootstrap', {})
new Module_1(app, 'ABWorkshopModule1', {})
new Module_2(app, 'ABWorkshopModule2', {})
new Module_3_1(app, 'ABWorkshopModule31', {})
new Module_3_2(app, 'ABWorkshopModule32', {})
new Module_3_3(app, 'ABWorkshopModule33', {})
