import { describe, it, expect } from 'vitest';
import { snugJSON } from './snugJson';

describe('smugJSON', () => {
  it('JSON.stringify test', () => {
    const result = JSON.stringify('');
    expect(result).toBe('""');
    const result2 = JSON.stringify(null);
    expect(result2).toBe('null');
    const result3 = JSON.stringify(undefined);
    expect(result3).toBe(undefined);
    const result4 = JSON.stringify(42);
    expect(result4).toBe('42');
  });
  it('should return empty string for empty input', () => {
    const result = snugJSON('');
    expect(result).toBe('""');
  });
  it('should return number when input is number', () => {
    const result = snugJSON(42);
    expect(result).toBe('42');
  });
  it('should return string when input is string', () => {
    const result = snugJSON('hello');
    expect(result).toBe('"hello"');
  });
  it('should return null when input is null', () => {
    const result = snugJSON(null);
    expect(result).toBe('null');
  });
  it('should return undefined when input is undefined', () => {
    const result = snugJSON(undefined);
    expect(result).toBe(undefined);
  });
  it('should not truncate short JSON', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = snugJSON(input);
    expect(result).toBe(JSON.stringify(input));
  });

  it('should truncate long strings', () => {
    const input = { longString: 'a'.repeat(1000) };
    const result = snugJSON(input, { maxStringLength: 10, maxLength: 40 });
    expect(result).toContain('"longString":"aaaaaaaaaa..."');
  });

  it('should truncate long arrays', () => {
    const input = { longArray: Array(1000).fill(1) };
    const result = snugJSON(input, { maxArrayLength: 5, maxLength: 40 });
    expect(result).toContain('"longArray":[1,1,1,1,1,...+995]');
  });

  it('should truncate long arrays with depth', () => {
    const input = { a: { longArray: Array(1000).fill(1) } };
    const result = snugJSON(input, { maxArrayLength: 5, maxLength: 30 });
    expect(result).toContain('{"a":{"longArray":[1000]}}');
  });

  it('should truncate deep objects', () => {
    const input = { a: { b: { c: { d: { e: 1 } } } } };
    const result = snugJSON(input, { maxLength: 20 });
    expect(result).toContain('{"a":{"b":{"c":?}}}');
  });

  it('should respect maxLength option', () => {
    const input = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const result = snugJSON(input, { maxLength: 15 });
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).toContain('...');
  });

  it('should use custom replacer if provided', () => {
    const input = { a: 1, b: 2, secret: 'sensitive' };
    const replacer = (key: string, value: any) => key === 'secret' ? '[REDACTED]' : value;
    const result = snugJSON(input, { replacer });
    expect(result).toContain('"secret":"[REDACTED]"');
  });

/*
  循環参照は非対応
  it('should handle circular references', () => {
    const input: any = { a: 1 };
    input.self = input;
    const result = snugJSON(input);
    expect(result).toContain('"self":"[Circular]"');
  });
*/

  it('should truncate nested arrays and objects', () => {
    const input = {
      nested: {
        array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        object: { a: 1, b: 2, c: 3, d: 4, e: 5 }
      }
    };
    const result = snugJSON(input, { maxArrayLength: 3, maxLength: 80 });
    expect(result).toContain('"array":[1,2,3,...+7]');
  });

  it('should respect oneLineLength option', () => {
    const input = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const result = snugJSON(input, { oneLineLength: 30, space: 2 });
    expect(result).toContain('\n');
  });

  it('should handle empty objects and arrays', () => {
    const input = { emptyObject: {}, emptyArray: [] };
    const result = snugJSON(input);
    expect(result).toBe('{"emptyObject":{},"emptyArray":[]}');
  });

  it('should handle forced truncation correctly', () => {
    const input = {
      longObject: Object.fromEntries(Array(100).fill(0).map((_, i) => [`key${i}`, `value${i}`])),
      someArray: Array(100).fill('item')
    };
    const result = snugJSON(input, { maxLength: 50 });
    expect(result).toContain('{"longObject":{"key0":?,...+99},"some');
    expect(result).toMatch(/\.\.\./);  // Ensures it ends with ...
    expect(result.length).toBe(50);
  });

  it('should not break special identifiers when force truncating', () => {
    const input = {
      obj1: { a: 1, b: 2, c: 3, d: 4, e: 5 },
      obj2: { f: 6, g: 7, h: 8, i: 9, j: 10 },
      arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    };
    const result = snugJSON(input, { maxLength: 70 });
    expect(result).not.toContain('__TRUNCATED_OBJECT__');
    expect(result).not.toContain('__TRUNCATED_ARRAY__');
    expect(result).toContain('{"obj1":{"a":?,...+4},"obj2":{"f":?,...+4},"arr":[10]}');
    expect(result.length).toBe(54);
  });

  it('should handle very short maxLength', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = snugJSON(input, { maxLength: 10 });
    expect(result).toBe('{"a":?,...');
    expect(result.length).toBe(10);
  });

  it('complex data', () => {
    const input = {
      longString: 'a'.repeat(1000),
      deepObject: { a: { b: { c: { d: 1 } } } },
      longArray: Array(1000).fill(1)
    };
    const result = snugJSON(input, { maxLength: 100, maxStringLength: 10, maxArrayLength: 5, space: 2 ,oneLineLength: 0 })
    expect(result).toBe(`{
  "longString": "aaaaaaaaaa...",
  "deepObject": {"a":?},
  "longArray": [1000]
}`);
  });

});