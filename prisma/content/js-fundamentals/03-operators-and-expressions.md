# Operators and Expressions

An expression is any piece of code that produces a value, and operators are the symbols that combine values into new expressions. This chapter walks through the operators you will use constantly: arithmetic, comparison, logical, and the assignment shorthands that keep your code concise.

## Arithmetic and Assignment Operators

The basic arithmetic operators — `+`, `-`, `*`, `/`, `%`, and `**` — work as you would expect from math class, with `%` returning the remainder of division and `**` performing exponentiation.

```js
console.log(10 % 3);   // 1  (remainder after dividing 10 by 3)
console.log(2 ** 10);  // 1024 (2 to the power of 10)

let total = 100;
total += 50;  // same as total = total + 50
total -= 20;  // same as total = total - 20
total *= 2;   // same as total = total * 2
console.log(total); // 260
```

The `%` operator, called the modulo operator, is especially useful for checking divisibility — for example, `n % 2 === 0` tests whether `n` is even. The compound assignment operators (`+=`, `-=`, `*=`, `/=`) let you update a variable based on its own current value without repeating its name twice.

## Comparison Operators: == vs ===

JavaScript has two equality operators, and choosing the wrong one is one of the most common beginner mistakes. `==` (loose equality) coerces the operands to the same type before comparing them. `===` (strict equality) compares both value and type with no coercion at all.

```js
console.log(1 == "1");   // true  — the string is coerced to a number first
console.log(1 === "1");  // false — different types, no coercion

console.log(0 == false); // true  — false is coerced to 0
console.log(null == undefined);  // true, a special-cased rule
console.log(null === undefined); // false, different types
```

Because loose equality's coercion rules are easy to misremember, the near-universal convention is to always use `===` and `!==` unless you have a specific, well-understood reason to use `==`. This single habit eliminates an entire category of subtle bugs.

## Logical Operators and Short-Circuiting

`&&` (AND), `||` (OR), and `!` (NOT) combine boolean expressions, but in JavaScript they actually return one of their original operand values, not just `true`/`false`. Both `&&` and `||` "short-circuit," meaning they stop evaluating as soon as the result is determined.

```js
const user = { name: "Ada" };

// && returns the first falsy value, or the last value if all are truthy
console.log(user && user.name); // "Ada"

// || returns the first truthy value — useful for defaults
const displayName = user.name || "Guest";
console.log(displayName); // "Ada"

const config = null;
console.log(config?.timeout ?? 30); // 30, using optional chaining and nullish coalescing
```

The nullish coalescing operator `??` is a more precise alternative to `||` for defaults: it only falls back when the left side is `null` or `undefined`, not for every falsy value like `0` or `""`. This matters if a legitimate value like `0` should be preserved instead of replaced by a default.

## Key points

- Arithmetic operators follow normal math rules; `%` gives a remainder and is common for even/odd or cycle checks.
- Always prefer `===`/`!==` over `==`/`!=` to avoid unpredictable type coercion.
- `&&` and `||` return actual operand values and short-circuit, not just plain booleans.
- Use `??` instead of `||` when `0` or `""` should count as a valid value rather than trigger a fallback.
- Compound assignment operators (`+=`, `-=`, etc.) make updates to a variable more concise and readable.

With operators and expressions in hand, you are ready to control which code runs and how many times, which is what control flow is all about.
