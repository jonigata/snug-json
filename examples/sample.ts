import { snugJSON } from "snug-json";

const complexData = {
  longString: 'a'.repeat(1000),
  deepObject: { a: { b: { c: { d: 1 } } } },
  longArray: Array(1000).fill(1)
};

console.log(snugJSON(complexData, { maxLength: 100, maxStringLength: 10, maxArrayLength: 5, space: 2 ,oneLineLength: 0 }));


