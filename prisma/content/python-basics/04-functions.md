# Functions, Arguments, and Scope

A function names a piece of logic so you can call it instead of repeating it. Python's function syntax is small, but its argument handling is unusually rich — and one of its defaults is a trap worth learning before you meet it in production.

## Defining and returning

```python
def area(width, height):
    """Return the area of a rectangle."""
    return width * height

print(area(3, 4))   # 12
```

The string on the first line is a *docstring*, retrievable with `help(area)` or `area.__doc__`. It is the closest thing Python has to enforced documentation, and it costs one line.

A function with no `return` returns `None`. This bites when a function has a side effect and you assume it also produced a value:

```python
def log(message):
    print(message)

result = log("hi")   # prints "hi"
print(result)        # None
```

`return` exits immediately, which makes guard clauses the natural way to avoid nesting:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

## Positional, keyword, and default arguments

Arguments can be passed by position or by name, and parameters can carry defaults.

```python
def greet(name, greeting="Hello", punctuation="!"):
    return f"{greeting}, {name}{punctuation}"

greet("Ada")                          # 'Hello, Ada!'
greet("Ada", "Hi")                    # 'Hi, Ada!'
greet("Ada", punctuation="?")         # 'Hello, Ada?'
```

Keyword arguments let you skip a middle default and, more importantly, make call sites readable. `create_user("ada", True, False)` tells the reader nothing; `create_user("ada", admin=True, verified=False)` tells them everything.

Parameters with defaults must come after those without, otherwise Python cannot tell which position you meant.

## The mutable default argument trap

Default values are evaluated **once**, when the `def` line runs — not on each call. A mutable default is therefore shared across every call:

```python
def add_item(item, basket=[]):     # wrong
    basket.append(item)
    return basket

add_item("apple")    # ['apple']
add_item("pear")     # ['apple', 'pear']  — the same list!
```

The fix is to default to `None` and build a fresh object inside:

```python
def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket
```

This is the single most common Python bug that survives code review, because it only misbehaves on the second call.

## \*args and \*\*kwargs

`*args` collects extra positional arguments into a tuple; `**kwargs` collects extra keyword arguments into a dict.

```python
def total(*numbers, label="sum"):
    return f"{label}: {sum(numbers)}"

total(1, 2, 3)                  # 'sum: 6'
total(1, 2, label="score")      # 'score: 3'
```

The same stars *unpack* at the call site, which is how you forward arguments through a wrapper:

```python
values = [1, 2, 3]
total(*values)                  # same as total(1, 2, 3)

options = {"label": "score"}
total(*values, **options)
```

## Scope

Names assigned inside a function are local to it. A function may *read* an outer name, but assigning to one creates a new local instead of modifying the outer:

```python
count = 0

def bump():
    count = count + 1   # UnboundLocalError
```

Python decided `count` was local the moment it saw an assignment to it, so the read on the right-hand side has nothing to read. The honest fix is almost never `global` — it is to take the value as a parameter and return the new one.

## Key points

- No `return` means the function returns `None`.
- Defaults are evaluated once at definition time — never default a parameter to `[]` or `{}`.
- Keyword arguments make call sites self-documenting; prefer them for booleans and flags.
- `*args`/`**kwargs` collect in a definition and unpack at a call.
- Assigning to a name inside a function makes it local for the whole function body.

Next: the collections these functions spend most of their time operating on.
