# Control Flow: Conditions and Loops

Control flow decides which lines run and how often. Python's version is deliberately plain — there is no ternary soup and no `switch` for you to abuse — and it enforces the indentation you should have been writing anyway.

## Indentation is the syntax

Python uses indentation instead of braces. A consistent four spaces per level is the universal convention, and mixing tabs with spaces is an error rather than a style problem.

```python
temperature = 31

if temperature > 30:
    print("Hot")
    print("Drink water")
print("Always runs")
```

The two indented lines belong to the `if`; the third does not. Nothing else marks the block, so the indentation *is* the meaning.

## if / elif / else

```python
score = 74

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
```

Branches are tested top to bottom and the first true one wins, so ordering matters: putting `score >= 70` first would grade every passing student a C. Python also allows the conditional expression form for simple cases:

```python
label = "pass" if score >= 50 else "fail"
```

## Truthiness

Any value can be tested directly. Empty things are false; everything else is true.

```python
falsy = [0, 0.0, "", [], {}, set(), None, False]
```

That means `if items:` is the idiomatic way to ask "is this list non-empty" — clearer than `if len(items) > 0:`. Be careful when `0` is a legitimate value, because `if count:` treats a real zero as absent. When you mean "not provided", compare to `None` explicitly with `if count is None:`.

Use `is` only for `None`, `True` and `False` — it asks about object identity. For values, use `==`.

## for loops iterate over things

Python's `for` is a for-*each*. You do not manage an index unless you need one.

```python
for city in ["Pune", "Lisbon", "Osaka"]:
    print(city)

for i in range(3):        # 0, 1, 2
    print(i)

for i in range(1, 10, 2): # 1, 3, 5, 7, 9
    print(i)
```

When you genuinely need the position, use `enumerate`; when you need two sequences in step, use `zip`. Indexing manually with `range(len(x))` is the mark of code translated from another language.

```python
for index, city in enumerate(["Pune", "Lisbon"], start=1):
    print(index, city)          # 1 Pune / 2 Lisbon

for city, temp in zip(cities, temps):
    print(city, temp)
```

`zip` stops at the shorter sequence without complaint, which quietly discards data if the lengths were supposed to match — pass `strict=True` to make the mismatch raise instead.

## while, break, and continue

Use `while` when the number of iterations is unknown.

```python
attempts = 0
while attempts < 3:
    attempts += 1
    if attempts == 2:
        continue      # skip the rest of this iteration
    print(attempts)   # 1, then 3
```

`break` exits the loop entirely. Python also allows `else` on a loop, which runs only if the loop finished *without* breaking — useful for search:

```python
for item in inventory:
    if item == "key":
        print("found")
        break
else:
    print("not found")
```

## Key points

- Indentation defines blocks; four spaces, never mixed with tabs.
- `elif` chains stop at the first true branch, so order conditions from most specific to least.
- Empty collections, `0`, `""` and `None` are falsy — use `is None` when zero is a valid value.
- Prefer `enumerate` and `zip` over `range(len(...))`.
- `for ... else` runs the `else` only when no `break` fired.

Next we package these blocks into functions.
