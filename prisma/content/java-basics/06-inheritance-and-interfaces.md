# Inheritance and Interfaces

Java gives you two ways to say that one type relates to another. Inheritance says "is a kind of" and shares implementation. An interface says "can do" and shares only a contract. Most well-designed Java leans heavily on the second.

## Inheritance

A subclass extends a superclass, inheriting its accessible members and adding or replacing behaviour.

```java
public class Content {
    protected final String title;

    public Content(String title) {
        this.title = title;
    }

    public int estimatedMinutes() {
        return 5;
    }
}

public class Chapter extends Content {
    private final int words;

    public Chapter(String title, int words) {
        super(title);            // must be the first statement
        this.words = words;
    }

    @Override
    public int estimatedMinutes() {
        return Math.max(1, words / 200);
    }
}
```

`super(...)` calls the superclass constructor and must come first — an object's inherited half is built before its own. `@Override` is optional but always worth writing: it makes the compiler verify you are actually replacing an inherited method rather than accidentally adding a new one with a mistyped name.

Java permits only single inheritance. A class has exactly one superclass, which avoids the ambiguity that multiple inheritance creates.

## Polymorphism

A variable of the supertype can hold any subtype, and the *runtime* type decides which override runs:

```java
List<Content> items = List.of(
    new Content("Intro"),
    new Chapter("Functions", 640)
);

for (Content c : items) {
    System.out.println(c.estimatedMinutes());   // 5, then 3
}
```

The compiler checks the call against `Content`; the JVM dispatches to `Chapter`'s implementation. This is the mechanism that lets you add a new subtype later without editing the loop.

## Abstract classes

An abstract class cannot be instantiated and may leave methods unimplemented for subclasses to fill in:

```java
public abstract class Content {
    public abstract int estimatedMinutes();   // no body

    public String summary() {                 // shared implementation
        return estimatedMinutes() + " min read";
    }
}
```

Use one when subtypes genuinely share state and code. Extending purely to reuse a couple of helper methods — inheritance for convenience rather than for an "is a" relationship — produces hierarchies nobody can safely change later.

## Interfaces

An interface declares what a type can do, with no state. A class may implement any number of them, which is how Java gets the flexibility of multiple inheritance without its ambiguity.

```java
public interface Trackable {
    void recordVisit(String userId);

    default boolean isTracked() {   // an optional default implementation
        return true;
    }
}

public class Chapter extends Content implements Trackable {
    @Override
    public void recordVisit(String userId) { /* ... */ }
}
```

Interface methods are implicitly `public`, and a `default` method supplies a body so that adding a method to a widely-implemented interface does not break every implementer.

Prefer to declare variables and parameters by interface type — `List<String> names = new ArrayList<>();` — so the implementation can change without touching the callers. That single habit is most of what "program to an interface" means in practice.

## Choosing between them

Extend a class when subtypes are genuinely a specialised kind of the parent and share real implementation. Implement an interface when unrelated types need to be usable in the same way. When in doubt, use an interface: it composes, and inheritance does not.

## Key points

- `super(...)` must be the first statement in a subclass constructor; Java allows one superclass only.
- `@Override` costs nothing and catches misspelled or mismatched overrides at compile time.
- Polymorphism dispatches on the runtime type, letting new subtypes slot into existing loops.
- Abstract classes share state and code; interfaces share a contract and can be implemented many times.
- Declare variables by their interface type so implementations stay swappable.

Next: the collections you will hold these objects in.
