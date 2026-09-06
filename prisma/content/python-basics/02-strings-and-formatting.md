# Strings, Slicing, and f-strings

Text is the type you will handle most, and Python's string API is one of the reasons the language reads so well. Strings are sequences of characters, they are immutable, and every method that appears to change one actually returns a new string.

## Literals and immutability

Single and double quotes are identical in meaning — pick whichever avoids escaping. Triple quotes span lines.

```python
name = "Ada"
quoted = 'She said "hello"'
block = """Line one
Line two"""
```

Immutability is the rule that catches beginners:

```python
greeting = "hello"
greeting.upper()      # returns "HELLO"
print(greeting)       # still "hello" — nothing was modified
greeting = greeting.upper()
print(greeting)       # "HELLO"
```

If you do not assign the result of a string method, it is thrown away. Every string method works this way.

## Indexing and slicing

Characters are indexed from `0`, and negative indices count from the end. A *slice* takes `[start:stop:step]`, where `start` is included and `stop` is excluded.

```python
word = "python"
word[0]      # 'p'
word[-1]     # 'n'
word[0:3]    # 'pyt'   — indices 0, 1, 2
word[3:]     # 'hon'   — to the end
word[:3]     # 'pyt'   — from the start
word[::-1]   # 'nohtyp' — reversed
```

The half-open convention — stop excluded — means `word[:n]` and `word[n:]` always partition the string with no overlap and nothing lost. Once you internalise that, off-by-one slicing errors mostly stop happening.

Out-of-range *indexing* raises `IndexError`, but out-of-range *slicing* silently clamps:

```python
word[99]     # IndexError: string index out of range
word[2:99]   # 'thon'  — no error
```

## f-strings

Formatting with `+` requires manual `str()` calls and reads badly. Prefer f-strings, which evaluate any expression inside `{}`.

```python
name, score = "Ada", 0.9317

f"{name} scored {score}"            # 'Ada scored 0.9317'
f"{name} scored {score:.1%}"        # 'Ada scored 93.2%'
f"{score:.2f}"                      # '0.93'
f"{1234567:,}"                      # '1,234,567'
f"{name:>10}|"                      # '       Ada|'  — right-aligned in 10 cols
f"{score = }"                       # 'score = 0.9317' — debugging shorthand
```

The format spec after `:` controls precision, thousands separators, alignment and padding. `:.2f` for fixed decimals and `:,` for separators will cover most of what you need in reports and logs.

## The methods worth memorising

```python
"  spaced  ".strip()            # 'spaced'
"a,b,c".split(",")             # ['a', 'b', 'c']
", ".join(["a", "b", "c"])     # 'a, b, c'
"hello".replace("l", "L")      # 'heLLo'
"Hello".lower()                # 'hello'
"report.csv".endswith(".csv")  # True
"ada" in "ada lovelace"        # True
```

`split` and `join` are inverses and together handle most parsing you will do before reaching for a real parser. Note `join` is called on the *separator*, not on the list — that ordering surprises everyone once.

## Key points

- Strings are immutable; methods return new strings, so you must assign the result.
- Slices are `[start:stop:step]` with `stop` excluded, which makes `s[:n]` and `s[n:]` a clean split.
- Indexing out of range raises `IndexError`; slicing out of range clamps silently.
- Use f-strings, with `:.2f`, `:,`, `:%` and alignment specs instead of manual concatenation.
- `split` and `join` are inverses; `join` is a method on the separator string.

Next: control flow, where these values start making decisions.
