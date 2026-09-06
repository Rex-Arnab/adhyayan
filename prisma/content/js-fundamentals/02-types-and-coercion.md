# Types and Type Coercion

JavaScript values always have a type, and understanding those types — along with the rules for converting between them — will save you from some of the most confusing bugs in the language. This chapter covers the primitive types, how to check them, and how JavaScript automatically converts values when you least expect it.

## Primitive Types

JavaScript has seven primitive types: `string`, `number`, `boolean`, `undefined`, `null`, `bigint`, and `symbol`. Everything else — arrays, objects, functions — is an `object` under the hood. You can inspect a value's type with the `typeof` operator.

```js
console.log(typeof "hello");     // "string"
console.log(typeof 42);          // "number"
console.log(typeof true);        // "boolean"
console.log(typeof undefined);   // "undefined"
console.log(typeof null);        // "object" (a long-standing language quirk)
console.log(typeof [1, 2, 3]);   // "object"
console.log(typeof { a: 1 });    // "object"
```

Note that `typeof null` returns `"object"` — this is a historical bug in JavaScript that can never be fixed without breaking old code, so you simply have to memorize it. To check for `null` specifically, compare directly with `=== null`.

`undefined` means a variable has been declared but never assigned a value, or a function did not explicitly return anything. `null` is a value you assign deliberately to represent "no value on purpose." Treating them as interchangeable is a common source of bugs, especially when checking for missing data from an API.

## Implicit and Explicit Coercion

Coercion is JavaScript converting a value from one type to another. Explicit coercion happens when you deliberately convert a value, usually with functions like `Number()`, `String()`, or `Boolean()`. Implicit coercion happens automatically, often inside operators like `+` or `==`, and it is where most confusion comes from.

```js
// Explicit coercion — you asked for this
console.log(Number("42"));   // 42
console.log(String(42));     // "42"
console.log(Boolean(""));    // false

// Implicit coercion — JavaScript decided for you
console.log("5" + 3);        // "53"  (number coerced to string, then concatenated)
console.log("5" - 3);        // 2     (string coerced to number, because - has no string meaning)
console.log(1 + true);       // 2     (true coerced to 1)
console.log("" + null);      // "null"
```

The `+` operator is the trickiest case: if either operand is a string, `+` performs string concatenation instead of addition. Every other arithmetic operator (`-`, `*`, `/`) always tries to coerce both operands to numbers, since there is no meaningful string version of subtraction or multiplication.

Truthiness follows a similar pattern. In a boolean context — an `if` condition, for example — JavaScript coerces values to `true` or `false`. Only eight values are "falsy": `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, and `NaN`. Everything else, including `"0"` and `[]` (an empty array), is truthy, which surprises many beginners.

```js
if ("0") {
  console.log("This runs, because a non-empty string is truthy!");
}
```

## Key points

- JavaScript has seven primitive types; arrays, objects, and functions are all technically `object` (functions also report `typeof` as `"function"`).
- `typeof null` returns `"object"` — a known quirk, not a bug you introduced.
- Prefer explicit coercion (`Number()`, `String()`, `Boolean()`) over relying on implicit rules.
- The `+` operator concatenates if either side is a string; other math operators coerce to numbers.
- Only eight values are falsy; everything else, including `"0"` and empty arrays, is truthy.

Understanding how types convert sets you up to read operators and comparisons correctly, which is the focus of the next chapter.
