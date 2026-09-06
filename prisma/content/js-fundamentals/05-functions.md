# Functions, Parameters, and Return Values

A function is a reusable block of code that takes input, does something with it, and optionally hands back a result. Functions let you name a piece of logic once and call it from anywhere in your program instead of copying the same code repeatedly. This chapter covers the ways to define functions, how parameters and arguments work, and what happens when a function returns — or doesn't.

## Defining Functions

JavaScript gives you three common ways to write a function: a function declaration, a function expression, and an arrow function. All three can do the same job, but they differ in syntax and a few behavioral details.

```js
// Function declaration — hoisted, callable before its definition in the file
function add(a, b) {
  return a + b;
}

// Function expression — not hoisted, stored in a variable
const subtract = function (a, b) {
  return a - b;
};

// Arrow function — concise syntax, does not have its own `this`
const multiply = (a, b) => a * b;

console.log(add(2, 3));      // 5
console.log(subtract(5, 2)); // 3
console.log(multiply(4, 6)); // 24
```

Arrow functions with a single expression body (like `multiply` above) automatically return that expression's value without needing the `return` keyword — this is called an implicit return. If the body needs multiple statements, use curly braces and an explicit `return`.

## Parameters, Arguments, and Defaults

Parameters are the named placeholders in a function's definition; arguments are the actual values you pass in when calling it. JavaScript does not enforce how many arguments you pass — missing ones become `undefined`, and extra ones are simply ignored.

```js
function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

console.log(greet("Ada"));            // "Hello, Ada!"
console.log(greet("Ada", "Hi"));      // "Hi, Ada!"
console.log(greet());                 // "Hello, undefined!"
```

Default parameters, like `greeting = "Hello"` above, only kick in when the argument is `undefined` — passing `null` explicitly does not trigger the default. Notice the last call: calling `greet()` without any arguments doesn't throw an error, it just uses `undefined` for `name`, which is a common source of bugs when a caller forgets a required value. Validating important parameters at the top of a function is a good habit.

## Return Values

A function that has no explicit `return` statement automatically returns `undefined`. This is easy to forget when a function has a side effect (like logging) but you meant for it to also produce a value.

```js
function logAndForget(message) {
  console.log(message);
  // no return statement here
}

const result = logAndForget("hi"); // logs "hi"
console.log(result); // undefined, not "hi"
```

A `return` statement immediately exits the function, so any code written after it inside the same block never runs. This is often used deliberately for early exits, called "guard clauses," which avoid deeply nested `if` blocks.

```js
function safeDivide(a, b) {
  if (b === 0) {
    return "Cannot divide by zero";
  }
  return a / b;
}

console.log(safeDivide(10, 2)); // 5
console.log(safeDivide(10, 0)); // "Cannot divide by zero"
```

## Key points

- Function declarations are hoisted; function expressions and arrow functions are not.
- Arrow functions with a single expression body return it implicitly, with no `return` keyword needed.
- Missing arguments become `undefined`; default parameters only apply when the argument is `undefined`.
- A function with no `return` statement always evaluates to `undefined`.
- `return` exits a function immediately, which is useful for early "guard clause" exits.

With functions under your belt, the next chapter turns to arrays and objects, the two structures functions most often operate on.
