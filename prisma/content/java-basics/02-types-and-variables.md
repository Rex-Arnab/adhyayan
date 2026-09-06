# Types, Variables, and Operators

Java is statically typed: every variable's type is fixed when you declare it, and the compiler rejects any use that does not fit. The types split into two families that behave differently in ways you must understand before writing anything non-trivial.

## Primitives and references

The eight *primitives* hold a value directly:

```java
int count = 42;                 // 32-bit integer
long population = 8_100_000_000L;  // 64-bit; note the L suffix
double price = 19.99;           // 64-bit floating point
float ratio = 0.5f;             // 32-bit; note the f suffix
boolean active = true;
char grade = 'A';               // single quotes, one character
byte flags = 8;
short offset = 1024;
```

Everything else is a *reference* type — `String`, arrays, and every class you or a library defines. A reference variable holds the address of an object, not the object itself.

```java
String name = "Ada";
int[] scores = {88, 92, 79};
```

The distinction shows up immediately in equality. `==` compares what the variable holds: for primitives that is the value, for references that is the identity of the object.

```java
String a = new String("hi");
String b = new String("hi");

a == b          // false — two different objects
a.equals(b)     // true  — same contents
```

**Use `.equals()` for objects, `==` for primitives.** Comparing strings with `==` sometimes appears to work because the compiler pools identical literals, which is worse than it never working — it hides the bug until the string comes from user input.

An uninitialised reference is `null`, and calling a method on it throws `NullPointerException`, the most common runtime failure in Java.

## Declarations, finality, and `var`

```java
final double TAX_RATE = 0.18;   // cannot be reassigned
var total = 100;                // inferred as int (Java 10+)
```

`final` means the *binding* cannot change; for a reference it does not freeze the object, only which object the name points at. `var` infers the type from the initialiser — it is still static typing, just written once instead of twice. Use it where the right-hand side already names the type, not where it hides it.

## Integer division and overflow

Two integers divided produce an integer. The fractional part is discarded, not rounded:

```java
int result = 7 / 2;             // 3, not 3.5
double correct = 7 / 2.0;       // 3.5 — one operand must be floating point
int remainder = 7 % 2;          // 1
```

`int` also wraps silently on overflow rather than raising:

```java
int max = Integer.MAX_VALUE;    // 2147483647
max + 1;                        // -2147483648
```

Use `long` for anything counting money in cents, milliseconds, or file sizes. And never use `double` for currency — `0.1 + 0.2 != 0.3` in binary floating point. `BigDecimal` exists for exactly that.

## Casting

Widening happens automatically because it cannot lose information. Narrowing must be explicit, because it can:

```java
int small = 5;
double wide = small;            // implicit widening

double value = 9.99;
int truncated = (int) value;    // 9 — explicit cast, decimal discarded
```

A cast is you telling the compiler you accept the loss. It truncates toward zero; it does not round.

## Operators worth noting

```java
count++;            // post-increment
count += 5;
boolean ok = active && count > 0;   // && short-circuits: right side skipped if left is false
String label = count > 0 ? "some" : "none";
```

Short-circuiting is what makes `if (s != null && s.length() > 0)` safe — the null check runs first and the second operand is never evaluated when it fails.

## Key points

- Primitives hold values; references hold addresses. `==` compares the holder, so use `.equals()` for objects.
- `null` dereferenced throws `NullPointerException` — Java's most frequent runtime error.
- `7 / 2` is `3`: integer division truncates. Force a `double` operand for real division.
- `int` overflows silently; use `long` for large counts and `BigDecimal` for money.
- Widening casts are implicit; narrowing ones must be explicit and discard data.

Next: using these values to make decisions and repeat work.
