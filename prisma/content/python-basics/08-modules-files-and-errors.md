# Modules, Files, and Errors

The last step from writing snippets to writing programs is organising code across files, reading data from disk, and deciding what should happen when something goes wrong.

## Modules

Every `.py` file is a module, and importing one runs it once and caches it.

```python
# geometry.py
PI = 3.14159

def area(radius):
    return PI * radius ** 2
```

```python
# main.py
import geometry
from geometry import area, PI
from geometry import area as circle_area

print(geometry.area(2))
print(area(2))
```

Prefer `import geometry` or explicit names over `from geometry import *`. The star form dumps unknown names into your namespace and silently shadows anything with a matching name.

Because importing *runs* the module, top-level code executes on import. That is why scripts guard their entry point:

```python
def main():
    print(area(2))

if __name__ == "__main__":
    main()
```

`__name__` is `"__main__"` only when the file is run directly, so the guard means importing `geometry` for its functions does not also execute its demo code.

The standard library is large enough that reaching outside it is usually unnecessary: `pathlib`, `json`, `csv`, `datetime`, `collections`, `itertools`, `re`, `math` and `random` cover an enormous amount of ground.

## Files

Always open files with `with`. The context manager closes the handle even if the body raises, which a bare `open()` does not.

```python
from pathlib import Path

with open("notes.txt", "r", encoding="utf-8") as f:
    content = f.read()

with open("notes.txt", "a", encoding="utf-8") as f:
    f.write("one more line\n")
```

The modes are `"r"` read, `"w"` write (which **truncates an existing file immediately**), `"a"` append, and `"x"` create-or-fail. Passing `encoding="utf-8"` explicitly matters: the default varies by platform, so omitting it is how a script that works on your machine mangles text on someone else's.

For line-by-line work, iterate the handle rather than calling `.read()` — it streams instead of loading the whole file into memory:

```python
with open("large.log", encoding="utf-8") as f:
    for line in f:
        if "ERROR" in line:
            print(line.rstrip())
```

`pathlib` handles paths without string surgery, and covers the small reads in one call:

```python
path = Path("data") / "notes.txt"
path.exists()
text = path.read_text(encoding="utf-8")
```

## Exceptions

An exception unwinds the call stack until something catches it. Catch only what you can actually handle, and name the type:

```python
try:
    value = int(user_input)
except ValueError:
    print("Not a number")
else:
    print(f"Got {value}")       # runs only if no exception
finally:
    print("done")               # always runs
```

A bare `except:` — or `except Exception:` used casually — swallows typos, interrupts and genuine bugs along with the error you meant to handle, turning a loud failure into a silent wrong answer. If you cannot say which exception you expect, you are not handling it; you are hiding it.

Raise your own when a caller has broken a contract:

```python
def set_age(age):
    if age < 0:
        raise ValueError(f"age must be non-negative, got {age}")
```

Include the offending value in the message. "Invalid input" costs the next person an hour; `got -3` costs them nothing.

## Key points

- Each file is a module; import runs it once, so guard scripts with `if __name__ == "__main__":`.
- Avoid `from module import *` — it shadows names invisibly.
- Use `with open(..., encoding="utf-8")` and iterate the handle for large files; `"w"` truncates on open.
- `try/except/else/finally`: catch specific exception types, never a bare `except`.
- Raise `ValueError`/`TypeError` with the offending value in the message.

That completes the tour. You now have the language core — values, text, control flow, functions, collections, comprehensions, and the file and error handling that turn scripts into programs. The next thing worth learning is a domain: the standard library modules above, or a library like `requests` or `pandas` built on exactly these foundations.
