# Comprehensions and Iteration

A comprehension builds a collection from an iterable in a single expression. It is not merely shorter than the equivalent loop — it states the *shape* of the result up front, so the reader knows they are looking at a transformation rather than an arbitrary block of side effects.

## From loop to comprehension

Here is the pattern every list comprehension replaces:

```python
squares = []
for n in range(6):
    squares.append(n * n)
```

The comprehension says the same thing in the order you would say it aloud — "the square of n, for each n in range":

```python
squares = [n * n for n in range(6)]   # [0, 1, 4, 9, 16, 25]
```

Add a filter with a trailing `if`. It is applied *before* the expression, so only the surviving items are transformed:

```python
evens = [n for n in range(10) if n % 2 == 0]
names = [u["name"] for u in users if u["active"]]
```

An `if/else` behaves differently: because it is a conditional *expression*, it goes at the front, and it transforms rather than filters.

```python
labels = ["even" if n % 2 == 0 else "odd" for n in range(4)]
```

Filter at the back, choose at the front. Mixing those up is the usual source of confusion.

## Dict and set comprehensions

The same syntax builds dicts and sets:

```python
lengths = {word: len(word) for word in ["read", "finish"]}
# {'read': 4, 'finish': 6}

initials = {name[0] for name in ["Ada", "Alan", "Grace"]}
# {'A', 'G'} — duplicates collapse

flipped = {v: k for k, v in lengths.items()}
```

Inverting a dict, indexing a list of records by id, and building a lookup table are all one-liners with this form:

```python
by_id = {row["id"]: row for row in rows}
```

## Generators and laziness

Swap the brackets for parentheses and you get a *generator expression*, which computes items on demand instead of building the whole collection.

```python
total = sum(n * n for n in range(1_000_000))
```

That never materialises a million-element list; it holds one number at a time. For large inputs — or a file you are streaming — this is the difference between constant and linear memory. The trade-off is that a generator is single-use: once consumed it is exhausted, and it has no `len()`.

```python
gen = (n for n in range(3))
list(gen)   # [0, 1, 2]
list(gen)   # [] — already spent
```

Functions that consume an iterable lazily pair naturally with them:

```python
any(u["active"] for u in users)     # stops at the first True
all(c > 0 for c in counts)          # stops at the first False
next((u for u in users if u["id"] == 7), None)   # first match or None
```

## When not to use one

A comprehension should read as one thought. Two nested `for` clauses plus a condition is a loop wearing a disguise, and a comprehension whose only purpose is a side effect — calling `print` or appending to something else — is a misuse; write the plain `for` loop instead.

```python
# unreadable
[f(x, y) for x in xs if p(x) for y in g(x) if q(y)]
```

Length is a reasonable proxy: if it does not fit on one line comfortably, expand it.

## Key points

- `[expr for item in iterable if condition]` — the trailing `if` filters; a leading `if/else` chooses.
- Dict and set comprehensions use the same shape with `{}`; `{k: v for ...}` builds lookup tables.
- Parentheses give a lazy generator expression — constant memory, single use, no `len()`.
- `any`, `all` and `next(..., default)` short-circuit over generators.
- Prefer an ordinary loop for side effects or for anything needing two levels of nesting.

Next: splitting code across modules, reading files, and handling the errors both produce.
