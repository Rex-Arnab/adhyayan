# Lists and Tuples

Lists are Python's workhorse container: ordered, indexable, and mutable. Tuples are their immutable counterpart. Choosing between them is not a performance decision so much as a statement about whether the contents are allowed to change.

## Lists

```python
scores = [88, 92, 79]
scores.append(95)          # [88, 92, 79, 95]
scores.insert(0, 100)      # [100, 88, 92, 79, 95]
scores.remove(79)          # removes the first matching value
last = scores.pop()        # removes and returns the last item
len(scores)                # 4
```

Lists index and slice exactly like strings, including negative indices and the half-open `[start:stop]` convention:

```python
scores[0]      # 100
scores[-1]     # 79
scores[1:3]    # [88, 92]
```

Unlike a string, a list slice can be assigned to, and `sort()` reorders in place:

```python
scores.sort()               # in place, returns None
ordered = sorted(scores)    # returns a new list, leaves the original alone
scores.sort(reverse=True)
words.sort(key=len)         # sort by a computed value
```

`sort()` returning `None` is deliberate — it is Python's way of telling you the operation mutated the original. Writing `scores = scores.sort()` throws your data away, and it is the second most common beginner bug after mutable defaults.

## Aliasing and copying

Because a name is a label, two names can point at the same list:

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)        # [1, 2, 3, 4] — a changed too
```

To get an independent list, copy it explicitly:

```python
b = a.copy()    # or list(a), or a[:]
```

A copy made this way is *shallow*: the new list is independent, but nested objects inside it are still shared. For nested structures, use `copy.deepcopy`.

## Tuples

A tuple is written with commas — the parentheses are usually optional but almost always clearer.

```python
point = (3, 4)
x, y = point          # unpacking
```

Tuples cannot be appended to or reassigned, which makes them the right choice for a fixed record: coordinates, an RGB colour, a row returned from a database. They are also hashable when their contents are, so a tuple can be a dictionary key where a list cannot.

Unpacking works anywhere, including swaps and multiple returns:

```python
a, b = b, a                    # swap without a temp variable
first, *rest = [1, 2, 3, 4]    # first=1, rest=[2, 3, 4]

def min_max(values):
    return min(values), max(values)   # returns a tuple

low, high = min_max(scores)
```

The single-element tuple needs its trailing comma: `(5)` is the integer five, `(5,)` is a tuple.

## Choosing between them

Use a list when the collection is a variable number of like things you may add to or reorder. Use a tuple when the length and the meaning of each position are fixed — when you would be uneasy if someone appended to it.

## Key points

- Lists are mutable and ordered; slicing follows the same rules as strings.
- `sort()` mutates and returns `None`; `sorted()` returns a new list.
- Assignment aliases a list — use `.copy()` for an independent shallow copy.
- Tuples are immutable and hashable, so they can be dict keys; a one-element tuple needs a trailing comma.
- Unpacking handles swaps, multiple return values, and `first, *rest` splits.

Next: dictionaries, where you look things up by name instead of by position.
