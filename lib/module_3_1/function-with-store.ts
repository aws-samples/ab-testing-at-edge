import { CfnFunction, Function, FunctionCode, FunctionRuntime, KeyValueStore } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface FunctionPropsWithStore {
  /** Path to the function code */
  entryPath: string;

  /** KeyValueStore to be associated with the function */
  store: KeyValueStore;
}

export class FunctionWithStore extends Function {
  constructor(scope: Construct, id: string, props: FunctionPropsWithStore) {
    const functionCodeRaw = readFileSync(props.entryPath).toString();
    const functionCodeWithKvsId = functionCodeRaw.replace('__KVS_ID__', props.store.keyValueStoreId);

    const actualProps = {
      code: FunctionCode.fromInline(functionCodeWithKvsId),
      runtime: FunctionRuntime.JS_2_0,
    };

    super(scope, id, actualProps);

    (this.node.defaultChild as CfnFunction)
      .addPropertyOverride("FunctionConfig.KeyValueStoreAssociations",
        [{ "KeyValueStoreARN": props.store.keyValueStoreArn }]
      )
  }
}
