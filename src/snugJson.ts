export interface TruncateOptions {
  maxLength?: number;
  maxStringLength?: number;
  maxArrayLength?: number;
  indent?: string | number;
  oneLineLength?: number;
  replacer?: (key: string, value: any) => any;
}

class Ommited {
}

class Ellipsis extends Ommited {
}

class TruncatedObject extends Ommited {
  firstKey: string;
  length: number;
  constructor(obj: any) {
    super();
    const keys = Object.keys(obj);
    this.firstKey = keys[0];
    this.length = keys.length-1;
  }
}

class TruncatedParticalArray extends Ommited {
  constructor(public length: number) {
    super();
  }
}

class TruncatedArray extends Ommited {
  length: number;
  constructor(arr: any[]) {
    super();
    this.length = arr.length;
    if (arr[arr.length-1] instanceof TruncatedParticalArray) {
      this.length += arr[arr.length-1].length - 1;
    }
  }
}

const TRUNCATED_OBJECT_MARKER = '__TRUNCATED_OBJECT__';
const TRUNCATED_ARRAY_MARKER = '__TRUNCATED_ARRAY__';
const TRUNCATED_PARTIAL_ARRAY_MARKER = '__TRUNCATED_PARTIAL_ARRAY__';


function snugJSON(obj: undefined, userOptions?: TruncateOptions): undefined;
function snugJSON(obj: any, userOptions?: TruncateOptions): string;

function snugJSON(obj: any, userOptions: TruncateOptions = {}): string | undefined {
  const options = { ...userOptions };
  options.maxLength ??= Infinity;
  options.maxStringLength ??= Infinity;
  options.maxArrayLength ??= Infinity;
  options.oneLineLength ??= 80;
  options.oneLineLength = Math.min(options.oneLineLength, options.maxLength);
  // console.log("Debug: Options", options);

  const { maxLength, maxStringLength, maxArrayLength, indent, oneLineLength, replacer } = options;

  const customReplacer = (key: string, value: any) => {
    if (value instanceof Ellipsis) {
      return '...';
    }
    if (value instanceof TruncatedObject) {
      return `${TRUNCATED_OBJECT_MARKER}${value.firstKey}:${value.length}`;
    }
    if (value instanceof TruncatedArray) {
      return `${TRUNCATED_ARRAY_MARKER}${value.length}`;
    }
    if (value instanceof TruncatedParticalArray) {
      return `${TRUNCATED_PARTIAL_ARRAY_MARKER}${value.length}`;
    }
    if (replacer) {
      return replacer(key, value);
    }
    return value;
  };

  const stringify = (value: any) => JSON.stringify(value, customReplacer, indent);

  // 後処理関数
  const postProcess = (jsonString: string): string | undefined => {
    if (jsonString === undefined) { return undefined; }
    return jsonString
      .replace(new RegExp(`"${TRUNCATED_OBJECT_MARKER}([^:]+):(0)"`, 'g'), '{"$1":?}')
      .replace(new RegExp(`"${TRUNCATED_OBJECT_MARKER}([^:]+):(\\d+)"`, 'g'), '{"$1":?,...+$2}')
      .replace(new RegExp(`"${TRUNCATED_ARRAY_MARKER}(\\d+)"`, 'g'), '[$1]')
      .replace(new RegExp(`"${TRUNCATED_PARTIAL_ARRAY_MARKER}(\\d+)"`, 'g'), '...+$1');
  };

  // stringifyとpost-processingを行い、長さをチェックする関数
  const processAndCheck = (data: any): string | null | undefined => {
    const oneline = postProcess(JSON.stringify(data, customReplacer));
    if (oneline === undefined) { return undefined; }
    if (oneline.length <= oneLineLength) return oneline;
    const processed = postProcess(stringify(data));
    if (processed === undefined) { return undefined; }
    return processed.length <= maxLength ? processed : null;
  };
  
  // 文字列を切り詰める関数
  const truncateString = (str: string): string => 
    str.length > maxStringLength ? str.slice(0, maxStringLength) + '...' : str;

  // 再帰的に文字列を見つけて切り詰める関数
  const truncateStrings = (data: any): any => {
    if (typeof data === 'string') return truncateString(data);
    if (Array.isArray(data)) return data.map(truncateStrings);
    if (typeof data === 'object' && data !== null) {
      const result: {[key: string]: any} = {};
      for (const [key, val] of Object.entries(data)) {
        result[key] = truncateStrings(val);
      }
      return result;
    }
    return data;
  }

  // 配列を切り詰める関数
  const truncateArray = (arr: any[]): any[] => 
    arr.length > maxArrayLength ? [
      ...arr.slice(0, maxArrayLength), 
      new TruncatedParticalArray(arr.length - maxArrayLength)
    ] : arr;

  // 再帰的に配列を見つけて切り詰める関数
  const truncateArrays = (data: any): any => {
    if (Array.isArray(data)) return truncateArray(data);
    if (data instanceof Ommited) return data;
    if (typeof data === 'object' && data !== null) {
      const result: {[key: string]: any} = {};
      for (const [key, val] of Object.entries(data)) {
        result[key] = truncateArrays(val);
      }
      return result;
    }
    return data;
  }

  // 最大深度を求める関数
  const getMaxDepth = (data: any): number => {
    if (data instanceof Ommited) return 0;
    if (typeof data !== 'object' || data === null) return 0;
    let maxDepth = 0;
    for (const key in data) {
      const depth = getMaxDepth(data[key]);
      if (depth > maxDepth) maxDepth = depth;
    }
    return 1 + maxDepth;
  };

  // 指定深度より深いオブジェクトを切り詰める関数
  const truncateDepth = (data: any, depth: number): any => {
    if (depth === 0) return data;
    if (depth === 1) {
      if (Array.isArray(data)) return new TruncatedArray(data);
      if (data instanceof Ommited) return data;
      if (typeof data === 'object' && data !== null) {
        return new TruncatedObject(data);
      }
      return data;
    }
    if (Array.isArray(data)) return data.map(val => truncateDepth(val, depth - 1));
    if (data instanceof Ommited) return data;
    if (typeof data === 'object' && data !== null) {
      const result: {[key: string]: any} = {};
      for (const [key, val] of Object.entries(data)) {
        result[key] = truncateDepth(val, depth - 1);
      }
      return result;
    }
    return data;
  };

  // メイン処理
  // console.log("Debug: Input", obj);
  let result = processAndCheck(obj);
  if (result) return result;

  // console.log("Debug: before Truncate Strings");
  obj = truncateStrings(obj);
  result = processAndCheck(obj);
  if (result) return result;

  // console.log("Debug: before Truncate Arrays");
  obj = truncateArrays(obj);
  result = processAndCheck(obj);
  if (result) return result;

  // console.log("Debug: Undepth");
  let depth = getMaxDepth(obj);
  while (depth > 0) {
    obj = truncateDepth(obj, depth);
    result = processAndCheck(obj);
    if (result) return result;
    depth--;
  }

  // 最後の手段として、強制的に切り詰める
  const postProcessed = postProcess(stringify(obj));
  if (postProcessed === undefined) { return postProcessed; }
  return postProcessed.slice(0, maxLength - 3) + '...';
}

export { snugJSON }
