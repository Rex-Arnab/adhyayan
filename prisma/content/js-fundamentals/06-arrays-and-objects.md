# Arrays and Objects

Arrays and objects are the two building blocks JavaScript gives you for grouping related data together, and almost every real program relies on both. Arrays hold ordered lists of values; objects hold named properties. This chapter covers how to create, read, and update each, plus the destructuring syntax that makes working with them much more concise.

## Arrays

An array is an ordered, indexed collection of values, created with square brackets. Elements are accessed by a zero-based numeric index, meaning the first element is at index `0`, not `1`.

```js
const colors = ["red", "green", "blue"];

console.log(colors[0]);        // "red"
console.log(colors.length);    // 3

colors.push("yellow");         // adds to the end
colors[1] = "lime";            // overwrite an existing element
console.log(colors);           // ["red", "lime", "blue", "yellow"]

console.log(colors[10]);       // undefined, not an error — out-of-range access
```

Accessing an index beyond the array's length does not throw an error; it silently returns `undefined`, which can hide bugs if you don't check `.length` or validate indexes. Arrays declared with `const` can still have elements added, removed, or changed, because `const` only locks the variable binding, not the array's contents.

## Objects

An object stores data as key-value pairs, where keys are strings (or symbols) and values can be anything, including other objects or functions. You create one with curly braces.

```js
const book = {
  title: "1984",
  author: "George Orwell",
  year: 1949,
};

console.log(book.title);        // "1984", dot notation
console.log(book["author"]);    // "George Orwell", bracket notation

book.year = 1950;               // update an existing property
book.genre = "Dystopian";       // add a new property
delete book.year;               // remove a property

console.log(book);
// { title: "1984", author: "George Orwell", genre: "Dystopian" }
```

Use bracket notation instead of dot notation when the key is stored in a variable or contains characters that aren't valid in an identifier, such as spaces or hyphens.

```js
const key = "author";
console.log(book[key]); // "George Orwell" — dot notation cannot do this dynamically
```

## Destructuring

Destructuring lets you unpack array elements or object properties into individual variables in a single line, instead of accessing them one at a time.

```js
const point = [10, 20];
const [x, y] = point;
console.log(x, y); // 10 20

const person = { name: "Ada", age: 30, country: "UK" };
const { name, age } = person;
console.log(name, age); // Ada 30

// Renaming and defaults while destructuring
const { country: nation = "Unknown" } = person;
console.log(nation); // "UK"
```

Destructuring is especially common when a function receives an object as its single argument — it lets the function signature clearly document which properties it actually uses, instead of forcing callers to remember a specific order of positional arguments.

```js
function printUser({ name, age }) {
  console.log(`${name} is ${age} years old`);
}

printUser(person); // "Ada is 30 years old"
```

## Key points

- Arrays are ordered and indexed from `0`; out-of-range access returns `undefined` rather than throwing.
- Objects store key-value pairs; use bracket notation for dynamic or non-identifier keys.
- `const` prevents reassigning the array or object variable, not mutating its contents.
- Destructuring unpacks array elements or object properties into variables in one concise step.
- Deleting a property or mutating an array happens in place and affects every reference to that same object.

Now that you can structure data with arrays and objects, the next chapter shows how array methods like map, filter, and reduce let you transform that data without manual loops.
