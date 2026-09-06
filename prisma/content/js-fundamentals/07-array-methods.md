# Array Methods: map, filter, and reduce

Modern JavaScript rarely loops over arrays with a manual `for` loop when it can instead express the same idea with a purpose-built method. `map`, `filter`, and `reduce` are the three most important ones: they transform, select, and combine array elements, respectively, and they all leave the original array untouched. This chapter walks through each one and shows how they chain together.

## map: Transforming Every Element

`map` creates a brand-new array by applying a function to every element of the original array, in order. The new array always has the same length as the original.

```js
const prices = [10, 20, 30];

const withTax = prices.map((price) => price * 1.08);
console.log(withTax); // [10.8, 21.6, 32.4]
console.log(prices);  // [10, 20, 30] — the original array is unchanged
```

A common beginner mistake is using `map` when you don't actually need the returned array — for example, calling `map` purely to run a side effect like logging. If you're not using the returned array, use `forEach` instead; `map` implies "I want a transformed copy."

## filter: Selecting Elements

`filter` creates a new array containing only the elements for which the callback function returns a truthy value. Like `map`, it does not modify the original array.

```js
const numbers = [1, 2, 3, 4, 5, 6];

const evens = numbers.filter((n) => n % 2 === 0);
console.log(evens); // [2, 4, 6]

const products = [
  { name: "Pen", price: 2 },
  { name: "Laptop", price: 999 },
  { name: "Notebook", price: 3 },
];
const affordable = products.filter((p) => p.price < 10);
console.log(affordable); // [{ name: "Pen", price: 2 }, { name: "Notebook", price: 3 }]
```

The callback you pass to `filter` should return a boolean — or at least a value JavaScript can coerce to one — deciding whether each element is "kept" or "dropped."

## reduce: Combining Into One Value

`reduce` is the most flexible and, for many beginners, the most confusing of the three. It walks through the array and "accumulates" a single result, using a callback that receives the running accumulator and the current element.

```js
const cart = [10, 20, 30];

const total = cart.reduce((accumulator, item) => accumulator + item, 0);
console.log(total); // 60
```

The second argument to `reduce` (`0` above) is the starting value of the accumulator. If you omit it, `reduce` uses the array's first element as the initial accumulator and starts iterating from the second element — this works, but it fails confusingly on an empty array, so always pass an explicit initial value.

`reduce` can build more than numbers — it can construct objects, arrays, or any shape you need.

```js
const words = ["apple", "banana", "apple", "cherry", "banana", "apple"];

const counts = words.reduce((acc, word) => {
  acc[word] = (acc[word] || 0) + 1;
  return acc;
}, {});

console.log(counts); // { apple: 3, banana: 2, cherry: 1 }
```

## Chaining Methods

Because `map` and `filter` each return a new array, you can chain them together to express multi-step transformations clearly.

```js
const order = [
  { item: "Book", price: 15, qty: 2 },
  { item: "Pen", price: 2, qty: 10 },
  { item: "Desk", price: 150, qty: 1 },
];

const total = order
  .filter((line) => line.price > 5)
  .map((line) => line.price * line.qty)
  .reduce((sum, subtotal) => sum + subtotal, 0);

console.log(total); // 180 (Book: 30 + Desk: 150)
```

## Key points

- `map` transforms every element into a new array of the same length; use `forEach` if you don't need the result.
- `filter` keeps only elements whose callback returns truthy, producing a possibly shorter array.
- `reduce` combines all elements into a single accumulated value; always pass an explicit initial value.
- None of these methods mutate the original array — they all return a new one.
- Chaining `filter`, `map`, and `reduce` together expresses multi-step data transformations clearly.

With these tools for working on data, the final chapter looks at scope and closures, which explain how variables stay accessible even after their surrounding function has finished running.
