# Values, Variables, and Types

Python is a good first language because it asks you to write down very little that is not the idea itself. There are no type declarations, no semicolons, and no braces. What you gain in brevity you pay for in needing a clear mental model of what a value actually is, because Python will not warn you when you mix things up until the moment it fails.

## Names are labels, not boxes

A variable in Python is a *name bound to an object*. It is not a box that holds a value. Assignment never copies the object; it points another name at the same one.

```python
x = 10
y = x       # y and x now refer to the same integer object
x = 11      # rebinds x only — y is untouched
print(x, y) # 11 10
```

That distinction looks academic with numbers, but it decides how the language behaves everywhere. You create a name by assigning to it, and using a name that has never been assigned is an error rather than a silent `None`:

```python
print(total)
# NameError: name 'total' is not defined
```

Names are conventionally `snake_case`. Names in `ALL_CAPS` signal "treat this as a constant" — Python will not enforce it, but every Python programmer reads it that way.

## The core types

Every value has a type, and you can always ask for it:

```python
type(42)          # <class 'int'>
type(3.14)        # <class 'float'>
type("hello")     # <class 'str'>
type(True)        # <class 'bool'>
type(None)        # <class 'NoneType'>
```

Integers in Python have no maximum size — `2 ** 200` is an ordinary `int`, not an overflow. Floats are standard 64-bit approximations, which is why `0.1 + 0.2` prints `0.30000000000000004`. That is not a Python bug; it is how binary fractions work in every language. When exactness matters, such as money, use the `decimal` module instead of `float`.

`bool` is a subclass of `int`, so `True == 1` is genuinely true. `None` is Python's single "no value" object, used for a missing result — not for zero and not for an empty string.

## Dynamic typing, strong typing

Python is *dynamically* typed: a name can be rebound to a different type at any time. It is also *strongly* typed: it will not quietly convert between unrelated types to make an operation work.

```python
value = 5
value = "five"     # fine — dynamic

"5" + 5
# TypeError: can only concatenate str (not "int") to str
```

That error is a feature. Languages that guess produce `"55"` or `10` depending on the day. Python refuses and makes you say what you meant, with an explicit conversion:

```python
int("5") + 5       # 10
"5" + str(5)       # "55"
float("3.14")      # 3.14
int("abc")         # ValueError: invalid literal for int() with base 10: 'abc'
```

Note that `int()` and `float()` raise on garbage input rather than returning a nonsense value, so conversion of untrusted text belongs inside a check.

## Optional type hints

Modern Python lets you annotate types. The interpreter ignores them completely at runtime — they exist for readers and for tools like `mypy`.

```python
count: int = 0
name: str = "Ada"

def double(n: int) -> int:
    return n * 2
```

A hint that lies does not raise; `double("ab")` still returns `"abab"`. Hints are documentation the machine can check on demand, not a guarantee.

## Key points

- Assignment binds a name to an object; it never copies the object.
- Reading an unassigned name raises `NameError` rather than yielding a blank value.
- `int` is unbounded, `float` is an approximation, `bool` is a subclass of `int`, `None` means "no value".
- Python is dynamically typed but strongly typed: it refuses `"5" + 5` instead of guessing.
- Type hints are annotations for humans and tooling — never enforced at runtime.

Next we look at strings, the type you will spend more time formatting and slicing than any other.
