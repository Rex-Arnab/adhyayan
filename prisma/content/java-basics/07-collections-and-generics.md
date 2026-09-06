# Collections and Generics

Arrays in Java are fixed-length, which is almost never what a real program wants. The Collections Framework supplies the growable, keyed and de-duplicating structures instead, and generics make them type-safe.

## Arrays, briefly

```java
int[] scores = new int[3];      // {0, 0, 0} — numeric arrays default to zero
String[] names = {"Ada", "Alan"};
names.length;                   // 2 — a field, not a method
```

An array's length is fixed at creation. Reading past it throws `ArrayIndexOutOfBoundsException` rather than returning a blank. For anything whose size varies, use a `List`.

## List

```java
import java.util.*;

List<String> names = new ArrayList<>();
names.add("Ada");
names.add("Grace");
names.get(0);            // "Ada"
names.size();            // 2 — a method here, unlike an array
names.contains("Ada");   // true
names.remove("Ada");
```

Declare the variable as `List` and instantiate an `ArrayList`: the interface is the contract, the class is a choice you may want to revisit. `ArrayList` is the default — fast indexed access, cheap append. `LinkedList` only wins for heavy insertion at the front, which is rarer than people assume.

`List.of(...)` builds an immutable list in one line, which is ideal for constants but throws `UnsupportedOperationException` if anything tries to add to it.

## Map

A `Map` associates keys with values — Java's dictionary.

```java
Map<String, Integer> wordCount = new HashMap<>();
wordCount.put("read", 4);
wordCount.get("read");                  // 4
wordCount.get("missing");               // null — not an exception
wordCount.getOrDefault("missing", 0);   // 0
wordCount.containsKey("read");          // true

wordCount.merge("read", 1, Integer::sum);   // increment, inserting 1 if absent

for (Map.Entry<String, Integer> e : wordCount.entrySet()) {
    System.out.println(e.getKey() + " = " + e.getValue());
}
```

`get` returning `null` for a missing key is a frequent source of `NullPointerException`, especially when the value is unboxed into an `int`. Prefer `getOrDefault`. Note that `HashMap` gives no ordering guarantee at all — use `LinkedHashMap` to preserve insertion order or `TreeMap` for sorted keys.

## Set

A `Set` holds unique elements and answers membership questions quickly.

```java
Set<String> tags = new HashSet<>(List.of("java", "backend", "java"));
tags.size();            // 2 — the duplicate collapsed
tags.contains("java");  // true, effectively constant time
```

Membership in a `List` scans; membership in a `HashSet` hashes. If you test `contains` inside a loop, building a set first turns quadratic work into linear.

`HashSet` and `HashMap` rely on `hashCode` and `equals`. Store objects that override one but not the other and they will go into the collection and never be found again.

## Generics

The `<String>` above is a type parameter. It moves a whole class of error from runtime to compile time:

```java
List<String> names = new ArrayList<>();
names.add(42);        // compile error, caught before the program runs
```

The compiler also removes the cast that older Java required on every read. The `<>` on the right-hand side is the diamond operator — the type is inferred from the declaration, so you never write it twice.

Generics work on your own types too:

```java
public class Box<T> {
    private final T value;

    public Box(T value) { this.value = value; }
    public T get() { return value; }
}

Box<String> box = new Box<>("hello");
String s = box.get();     // no cast needed
```

One limit worth knowing: type parameters must be reference types, so `List<int>` is illegal — use `List<Integer>`, and be aware that autoboxing a `null` `Integer` into an `int` throws.

## Key points

- Arrays are fixed-length with a `.length` field; collections resize and use `.size()`.
- Declare by interface (`List`, `Map`, `Set`), instantiate the concrete class.
- `map.get` returns `null` for absent keys — prefer `getOrDefault`; `HashMap` has no ordering.
- Sets give near-constant membership tests and depend on correct `equals`/`hashCode`.
- Generics catch type errors at compile time and remove casts; type arguments cannot be primitives.

Next: what to do when the operation fails.
