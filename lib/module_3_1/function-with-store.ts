import { Function, FunctionCode, ImportSource, KeyValueStore } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface FunctionPropsWithStore {
  /** Path to the function code */
  entryPath: string;

  /** KeyValueStore to be associated with the function */
  keyValueStoreImportSourcePath: string;
}

export class FunctionWithStore extends Function {
  constructor(scope: Construct, id: string, props: FunctionPropsWithStore) {
    const { entryPath, keyValueStoreImportSourcePath } = props;

    const keyValueStore = new KeyValueStore(scope, `${id}-store`, { source: ImportSource.fromAsset(keyValueStoreImportSourcePath) });
    
    const functionCodeRaw = readFileSync(entryPath).toString();
    const functionCodeWithKvsId = functionCodeRaw.replace("__KVS_ID__", keyValueStore.keyValueStoreId);
    const code = FunctionCode.fromInline(functionCodeWithKvsId);

    super(scope, id, { code, keyValueStore });
  }
}
