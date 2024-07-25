# snugJSON

snugJSON is a lightweight NPM library that intelligently truncates JSON data, making it more readable and manageable for humans. It's perfect for logging, debugging, or any situation where you need to display complex JSON structures in a concise, human-friendly format.

## Features

- Truncates long strings, arrays, and deep objects
- Respects maximum length constraints
- Preserves JSON structure while abbreviating content
- Customizable truncation options
- Handles nested structures elegantly

## Installation

```bash
npm install snugjson
```

## Usage

```javascript
import { snugJSON } from 'snugjson';

const complexData = {
  longString: 'a'.repeat(1000),
  deepObject: { a: { b: { c: { d: 1 } } } },
  longArray: Array(1000).fill(1)
};

console.log(snugJSON(complexData, { maxLength: 100, maxStringLength: 10, maxArrayLength: 5, space: 2 ,oneLineLength: 0 }));
```

Output:
```json
{
  "longString": "aaaaaaaaaa...",
  "deepObject": {"a":?},
  "longArray": [1000]
}
```

## API

### snugJSON(obj, options)

- `obj`: The object to stringify and potentially truncate.
- `options`: An optional object with the following properties:
  - `maxLength` (number): Maximum length of the resulting JSON string. Default: Infinity.
  - `maxStringLength` (number): Maximum length for individual string values. Default: Infinity.
  - `maxArrayLength` (number): Maximum number of array elements to include. Default: Infinity.
  - `space` (string | number): Indentation for pretty-printing. Default: undefined (no pretty-printing).
  - `oneLineLength` (number): Maximum length for single-line output. Default: 80.
  - `replacer` (function): A custom replacer function for `JSON.stringify()`. Default: undefined.

## Examples

### Truncating Long Strings

```javascript
const input = { longString: 'a'.repeat(1000) };
console.log(snugJSON(input, { maxStringLength: 10 }));
// Output: {"longString":"aaaaaaaaaa..."}
```

### Truncating Long Arrays

```javascript
const input = { longArray: Array(1000).fill(1) };
console.log(snugJSON(input, { maxArrayLength: 5 }));
// Output: {"longArray":[1,1,1,1,1,...+995]}
```

### Truncating Deep Objects

```javascript
const input = { a: { b: { c: { d: { e: 1 } } } } };
console.log(snugJSON(input, { maxLength: 20 }));
// Output: {"a":{"b":{"c":?}}}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.