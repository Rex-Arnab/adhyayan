# Control Flow

Java's control flow will look familiar if you have seen C, JavaScript or C#. The differences are in the details — the conditions must be genuinely boolean, and the `switch` statement has a famous sharp edge that the modern form removes.

## if / else

```java
int score = 74;
String grade;

if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}
```

The condition must be a `boolean`. Unlike C or Python, Java will not accept an integer or an object here, so the classic `if (x = 5)` typo — assignment instead of comparison — is a compile error rather than a silent bug.

Braces are optional for a single statement, and omitting them is how the well-known "goto fail" class of bug happens. Always brace.

The ternary is the expression form, useful when you are assigning:

```java
String label = score >= 50 ? "pass" : "fail";
```

## switch

The traditional `switch` falls through: without `break`, execution continues into the next case.

```java
switch (day) {
    case 6:
    case 7:
        type = "weekend";
        break;          // forget this and you fall into the next case
    default:
        type = "weekday";
}
```

Deliberate fall-through — stacking `case 6:` and `case 7:` — is occasionally what you want. Accidental fall-through is a bug the compiler will not warn you about. The arrow form, standard since Java 14, does not fall through at all and can be used as an expression:

```java
String type = switch (day) {
    case 6, 7 -> "weekend";
    default   -> "weekday";
};
```

Prefer the arrow form in new code. It is shorter, it cannot leak between branches, and as an expression the compiler checks that every path assigns a value.

## Loops

```java
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}

int[] scores = {88, 92, 79};
for (int s : scores) {          // enhanced for — "for each s in scores"
    System.out.println(s);
}

int attempts = 0;
while (attempts < 3) {
    attempts++;
}

do {
    attempts++;
} while (attempts < 3);         // body always runs at least once
```

Use the enhanced `for` whenever you do not need the index; it removes every opportunity for an off-by-one error. A counted `for` is for when the index itself matters.

Note that `i` declared in the `for` header is scoped to the loop and unavailable afterwards — which is what you want, and a reason to declare it there rather than above.

## break, continue, and labels

`break` leaves the loop; `continue` skips to the next iteration.

```java
for (int i = 0; i < 10; i++) {
    if (i % 2 == 0) continue;   // skip evens
    if (i > 7) break;           // stop entirely
    System.out.println(i);      // 1, 3, 5, 7
}
```

Java also allows a *labelled* break, which exits an outer loop from inside a nested one:

```java
outer:
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        if (grid[i][j] == target) {
            break outer;
        }
    }
}
```

This is rare and worth a comment when you use it, but it is far clearer than a `found` flag threaded through two conditions.

## Key points

- Conditions must be `boolean`; an accidental assignment in an `if` will not compile.
- Always use braces, even for one-line bodies.
- Traditional `switch` falls through without `break`; prefer the arrow form, which cannot.
- Use the enhanced `for (T item : collection)` unless the index itself is needed.
- A labelled `break` exits an outer loop directly and beats a manual flag variable.

Next: packaging these blocks into methods.
