# Control Flow: if, switch, and Loops

Control flow determines which lines of code actually run and how many times, letting your program make decisions and repeat work instead of executing top to bottom in a straight line. This chapter covers conditional branching with `if`/`else` and `switch`, plus the main loop constructs for repetition.

## Conditional Branching

An `if` statement runs a block of code only when its condition is truthy. Chaining `else if` and `else` lets you handle multiple mutually exclusive cases.

```js
function describeTemp(celsius) {
  if (celsius <= 0) {
    return "freezing";
  } else if (celsius < 20) {
    return "cool";
  } else if (celsius < 30) {
    return "warm";
  } else {
    return "hot";
  }
}

console.log(describeTemp(25)); // "warm"
console.log(describeTemp(-5)); // "freezing"
```

Each condition is checked in order, and only the first matching branch runs — later branches are skipped entirely, even if their condition would also be true. This is why order matters: a beginner mistake is putting a broad condition (like `celsius < 30`) before a narrower one and accidentally shadowing it.

When you have many branches that all check the same single value for equality, a `switch` statement is often more readable than a long `else if` chain.

```js
function dayType(day) {
  switch (day) {
    case "Saturday":
    case "Sunday":
      return "weekend";
    case "Monday":
    case "Tuesday":
    case "Wednesday":
    case "Thursday":
    case "Friday":
      return "weekday";
    default:
      return "unknown";
  }
}

console.log(dayType("Sunday")); // "weekend"
```

Every `case` needs a `break` (or a `return`, as above) or execution "falls through" into the next case — sometimes useful, as with grouping `"Saturday"` and `"Sunday"` above, but a frequent source of bugs when forgotten accidentally.

## Loops

A `for` loop is ideal when you know how many times you want to repeat something, typically by counting with an index.

```js
const fruits = ["apple", "banana", "cherry"];

for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]);
}
// apple
// banana
// cherry
```

A `while` loop repeats as long as a condition stays true, which suits situations where you don't know the exact number of iterations in advance.

```js
let attempts = 0;
let success = false;

while (!success && attempts < 3) {
  attempts++;
  success = attempts === 3; // pretend this simulates a retry succeeding
}

console.log(`Succeeded after ${attempts} attempts`); // Succeeded after 3 attempts
```

For iterating over arrays and other iterable structures, `for...of` is usually cleaner than a manual index-based `for` loop, since it hands you each value directly.

```js
for (const fruit of fruits) {
  console.log(fruit.toUpperCase());
}
// APPLE
// BANANA
// CHERRY
```

Watch out for infinite loops: if a `while` loop's condition never becomes false — often because you forgot to update the variable it depends on — the program will hang. Always double-check that something inside the loop body moves you toward the exit condition.

## Key points

- `if`/`else if`/`else` branches run in order; only the first truthy condition's block executes.
- `switch` compares one value against several cases and needs `break` or `return` to prevent fallthrough.
- Use `for` when you know the iteration count, `while` when you're repeating until a condition changes.
- `for...of` is the cleanest way to loop directly over array values.
- Always verify a loop's condition will eventually become false to avoid infinite loops.

Now that you can branch and repeat code, the next chapter shows how to package logic into reusable functions.
