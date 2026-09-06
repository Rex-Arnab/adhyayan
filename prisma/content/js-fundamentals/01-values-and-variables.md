# Values, Variables, and let vs const

Every JavaScript program works by creating, storing, and changing values, and variables are the labeled boxes you use to hold onto those values so you can use them later. Before you write any real logic, you need to understand how to declare a variable, what makes a value different from a variable, and why modern JavaScript strongly prefers `let` and `const` over the older `var`.

## Declaring Variables

A value is a single piece of data: the number `42`, the string `"hello"`, or the boolean `true`. A variable is a name that points to a value stored in memory. You create a variable with a declaration keyword, a name, and usually an initial value.

```js
let score = 10;
const name = "Ada";

score = score + 5; // reassignment is allowed
console.log(score); // 20
console.log(name);  // "Ada"

name = "Grace"; // TypeError: Assignment to constant variable.
```

`let` creates a variable whose value can change over the life of the program. `const` creates a variable whose *binding* cannot be reassigned after it is set. Note the wording carefully: `const` does not make a value unchangeable, only the variable name-to-value link. If a `const` variable holds an object or array, you can still change its contents.

```js
const user = { age: 30 };
user.age = 31; // fine, mutating the object
console.log(user.age); // 31

user = { age: 40 }; // TypeError, cannot reassign the binding
```

## Why const by Default

A common beginner habit is reaching for `let` everywhere because it feels more flexible. In practice, most values in a well-written program never need to be reassigned, so using `const` by default makes your intent explicit and helps you and future readers immediately spot which variables actually change. Reach for `let` only when you know a variable's value must change, such as a loop counter or a running total. This one habit prevents a real class of bugs: accidental reassignment deep inside a long function, where a typo silently overwrites a value you meant to keep.

## var and the Problems It Causes

Older JavaScript code uses `var`, which behaves very differently from `let` and `const`. Variables declared with `var` are function-scoped rather than block-scoped, meaning a `var` inside an `if` block or a `for` loop "leaks" out to the whole function. `var` also allows re-declaring the same variable name without error, which hides mistakes that `let` and `const` would catch immediately.

```js
if (true) {
  var leaked = "I'm visible outside!";
  let contained = "I'm not!";
}
console.log(leaked); // "I'm visible outside!"
console.log(contained); // ReferenceError: contained is not defined
```

Because of this leaking behavior, `var` makes it easy to accidentally overwrite a variable from an unrelated part of the code. Modern style guides recommend avoiding `var` entirely in new code.

## Key points

- A value is data; a variable is a named reference to a value.
- `const` prevents reassigning the variable binding, not mutation of the value it holds.
- Default to `const`; use `let` only for variables you know will change.
- Avoid `var` — it is function-scoped, not block-scoped, and allows silent re-declaration.
- Uninitialized variables (`let x;`) hold the special value `undefined` until assigned.

Once you are comfortable declaring variables, the next step is understanding the different kinds of values JavaScript can store and how it converts between them.
