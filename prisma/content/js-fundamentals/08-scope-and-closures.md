# Scope and Closures

Scope determines where in your code a variable is visible and accessible, and closures are what let a function "remember" variables from the place it was created even after that place has finished executing. Together they explain some of JavaScript's most useful — and most misunderstood — behavior. This chapter builds up from block scope to closures step by step.

## Block, Function, and Global Scope

A variable declared with `let` or `const` is block-scoped, meaning it only exists inside the nearest pair of curly braces `{ }` that contains it — an `if` block, a `for` loop, or a function body.

```js
function example() {
  const outer = "I'm in the function";

  if (true) {
    const inner = "I'm only in this block";
    console.log(outer); // accessible — inner scopes can see outer variables
    console.log(inner); // "I'm only in this block"
  }

  console.log(inner); // ReferenceError: inner is not defined
}

example();
```

Scopes nest: code inside a block can see variables declared in any enclosing block or function, but not the reverse. Variables declared outside any function are in the global scope and are accessible everywhere, but relying heavily on global variables makes programs hard to reason about, since any function anywhere could change them. Keeping variables as narrowly scoped as possible — declared right where they're needed — makes code easier to follow and less prone to naming collisions.

## Closures

A closure is created whenever a function is defined inside another function and continues to have access to that outer function's variables, even after the outer function has returned. This is not magic — JavaScript keeps the outer variables alive in memory precisely because the inner function still references them.

```js
function makeCounter() {
  let count = 0;

  return function () {
    count += 1;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

const anotherCounter = makeCounter();
console.log(anotherCounter()); // 1 — a completely separate `count`
```

Each call to `makeCounter` creates a brand-new `count` variable and a brand-new inner function bound to it. That inner function "closes over" `count`, keeping it alive and private — nothing outside the returned function can read or modify it directly. This pattern is the foundation for data privacy in JavaScript before classes had private fields, and it still shows up constantly in real code, such as event handlers, memoized functions, and module-style code organization.

## A Common Closure Pitfall

A classic mistake happens when closures are created inside a loop using `var`, because `var` is function-scoped, not block-scoped, so every closure ends up sharing the exact same variable.

```js
// Buggy version with var
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => console.log(i));
}
fns.forEach((fn) => fn()); // 3, 3, 3 — not what most people expect

// Fixed version with let
const fixedFns = [];
for (let j = 0; j < 3; j++) {
  fixedFns.push(() => console.log(j));
}
fixedFns.forEach((fn) => fn()); // 0, 1, 2 — each closure gets its own j
```

Because `let` creates a fresh binding for each iteration of the loop, each closure captures its own separate copy of the variable. This is one of the strongest practical reasons to prefer `let` over `var` in loops, beyond just style.

## Key points

- Block scope (`let`/`const`) confines a variable to the nearest `{ }`; `var` ignores block boundaries.
- Inner scopes can read outer variables, but outer scopes cannot read inner ones.
- A closure is a function paired with the outer variables it still references, kept alive after the outer function returns.
- Each function call creates its own separate set of variables, so closures from different calls do not share state.
- Looping with `var` and creating closures inside is a classic bug; `let` fixes it by giving each iteration its own binding.

With values, control flow, functions, data structures, and closures all in place, you have the core language tools needed to start building real, working JavaScript programs.
