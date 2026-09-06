# Exceptions and Resources

Java's error handling is unusual in that the compiler participates. Some exceptions must be declared and dealt with; others may propagate silently. Knowing which is which — and resisting the urge to make them all go away — is what separates robust Java from code that fails quietly at 3 a.m.

## try / catch / finally

```java
try {
    int value = Integer.parseInt(input);
    System.out.println(value * 2);
} catch (NumberFormatException e) {
    System.out.println("Not a number: " + input);
} finally {
    System.out.println("done");
}
```

`finally` runs whether or not an exception was thrown, and even if the `try` block returns. Multiple `catch` blocks are tested in order, so the most specific type must come first — a `catch (Exception e)` placed above a narrower one will not compile, because the narrower block would be unreachable.

You can combine types when the handling is identical:

```java
catch (NumberFormatException | ArithmeticException e) {
    log.warn("bad input", e);
}
```

## Checked vs unchecked

This is the distinction the compiler cares about.

- **Checked** exceptions extend `Exception`. They represent conditions a correct program should anticipate — a missing file, a dropped connection. The compiler *forces* you to either catch them or declare `throws`.
- **Unchecked** exceptions extend `RuntimeException` — `NullPointerException`, `IllegalArgumentException`, `IndexOutOfBoundsException`. These signal programming errors and need no declaration.

```java
public String readConfig(Path path) throws IOException {   // checked: declared
    return Files.readString(path);
}
```

`throws` pushes the decision to the caller, which is usually right: the layer that opened the file rarely knows what should happen when it is missing.

Throw your own with a message that names the offending value:

```java
if (age < 0) {
    throw new IllegalArgumentException("age must be non-negative, got " + age);
}
```

## Never swallow an exception

```java
try {
    risky();
} catch (Exception e) {
    // nothing here
}
```

That block converts a loud failure into a wrong answer produced silently, and it deletes the stack trace that would have told you where the problem was. If you catch, do one of three things: handle it meaningfully, log it *with* the exception object, or rethrow it wrapped in something more informative:

```java
catch (IOException e) {
    throw new IllegalStateException("could not load config from " + path, e);
}
```

Passing `e` as the cause preserves the original stack trace underneath your own — dropping it is how a one-line fix becomes an afternoon of guessing.

## try-with-resources

Anything holding a file handle, socket or database connection must be closed, and a `finally` block that closes it is verbose and easy to get wrong. Declare the resource in the `try` header instead and Java closes it for you, in reverse order, even when an exception is thrown:

```java
try (BufferedReader reader = Files.newBufferedReader(path)) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    log.error("failed reading {}", path, e);
}
```

Any type implementing `AutoCloseable` works here. This form is strictly better than the `finally` version — it is shorter, and it correctly reports the original exception rather than one thrown while closing.

## Key points

- `finally` always runs; order `catch` blocks from most specific to most general.
- Checked exceptions must be caught or declared with `throws`; unchecked ones signal bugs.
- An empty `catch` turns a crash into a silent wrong answer — handle, log with the exception, or rethrow.
- When wrapping, pass the original exception as the cause to preserve the stack trace.
- Use try-with-resources for anything `AutoCloseable`; never hand-close in `finally`.

That completes the essentials. You have the type system, control flow, methods, classes, inheritance and interfaces, collections, and error handling — the foundation every Java framework is built on. Spring, Android and the streams API all assume exactly what you now know.
