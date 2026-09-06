# Dictionaries and Sets

A list answers "what is at position 3". A dictionary answers "what is the value for this key". Most real programs are mostly dictionaries, because most real data is labelled rather than positional.

## Dictionaries

A dict maps keys to values. Keys must be hashable — strings, numbers and tuples work; lists do not.

```python
user = {"name": "Ada", "role": "engineer", "years": 12}

user["name"]              # 'Ada'
user["city"]              # KeyError: 'city'
user.get("city")          # None — no exception
user.get("city", "n/a")   # 'n/a' — a default
```

The difference between `[]` and `.get()` is a design decision, not a style choice. Square brackets say "this key must exist and a missing one is a bug worth crashing over". `.get()` says "absence is normal, here is the fallback."

Writing and deleting:

```python
user["city"] = "Pune"      # add or overwrite
user.update({"years": 13, "team": "platform"})
del user["team"]
user.pop("role", None)     # remove, tolerating absence
"city" in user             # True — membership tests keys
```

Since Python 3.7 dictionaries preserve insertion order, so iterating one is reproducible rather than arbitrary.

## Iterating a dict

Looping over a dict directly gives you the keys. Most of the time you want `.items()`:

```python
for key in user:
    print(key)

for key, value in user.items():
    print(f"{key}: {value}")

list(user.keys())      # ['name', 'years', 'city']
list(user.values())    # ['Ada', 13, 'Pune']
```

A very common shape is counting or grouping. `dict.setdefault` and `collections.defaultdict` both remove the "does the key exist yet" boilerplate:

```python
from collections import defaultdict

by_role = defaultdict(list)
for person in people:
    by_role[person["role"]].append(person["name"])
```

## Nesting

Dicts and lists compose freely, which is exactly the shape JSON arrives in:

```python
report = {
    "course": "python-basics",
    "chapters": [
        {"title": "Values", "minutes": 4},
        {"title": "Strings", "minutes": 3},
    ],
}

report["chapters"][0]["title"]   # 'Values'
total = sum(c["minutes"] for c in report["chapters"])
```

Deeply chained subscripts are fragile — one missing key raises. When the data is untrusted, walk it with `.get()` at each level or validate it once at the boundary.

## Sets

A set is an unordered collection of unique, hashable values. Its two superpowers are instant membership tests and deduplication.

```python
tags = {"python", "backend", "python"}   # {'python', 'backend'}
unique = set([1, 2, 2, 3])               # {1, 2, 3}

"python" in tags        # True — O(1), regardless of size
tags.add("data")
tags.discard("backend") # no error if absent (unlike .remove)
```

Membership in a list scans every element; membership in a set is a hash lookup. Converting a list to a set before repeatedly testing `in` turns an accidentally quadratic loop into a linear one.

Sets also do algebra, which replaces a lot of nested loops:

```python
a = {"read", "write"}
b = {"write", "delete"}

a | b    # union         {'read', 'write', 'delete'}
a & b    # intersection  {'write'}
a - b    # difference    {'read'}
a ^ b    # symmetric difference {'read', 'delete'}
```

Note that `{}` is an empty *dict*, not an empty set — use `set()` for that.

## Key points

- `d[key]` raises on a missing key; `d.get(key, default)` does not. Pick by whether absence is a bug.
- Dicts preserve insertion order and test membership on keys.
- Iterate with `.items()` when you need both key and value; use `defaultdict` for grouping.
- Sets give O(1) membership and free deduplication — convert before repeated `in` tests.
- `{}` is an empty dict; an empty set is `set()`.

Next: comprehensions, which express most of these loops in one line.
