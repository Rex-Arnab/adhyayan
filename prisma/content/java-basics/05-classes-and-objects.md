# Classes and Objects

Everything in Java lives in a class, but so far we have used classes only as containers for `static` methods. Their real job is to bundle *state* with the *behaviour* that operates on it, and to control who is allowed to touch that state.

## Fields, constructors, and instances

```java
public class Book {
    private final String title;
    private int pagesRead;

    public Book(String title) {
        this.title = title;
        this.pagesRead = 0;
    }

    public void read(int pages) {
        this.pagesRead += pages;
    }

    public int getPagesRead() {
        return pagesRead;
    }
}
```

```java
Book book = new Book("Dune");
book.read(30);
book.getPagesRead();    // 30
```

`new` allocates an object and runs the constructor. A constructor has no return type and shares the class's name. If you write none, Java supplies a no-argument default — but the moment you declare any constructor, that default disappears.

Each `new` produces an independent object with its own copy of the fields. `title` is `final`, so it must be assigned exactly once, in the constructor, and can never change afterwards.

## Encapsulation

Fields are `private` and access goes through methods. This is not bureaucracy; it is the only way to keep an object's state valid.

| Modifier | Visible to |
| --- | --- |
| `private` | this class only |
| *(none)* | the same package |
| `protected` | the same package and subclasses |
| `public` | everyone |

Because `pagesRead` is private, `book.pagesRead = -5` will not compile. The class can enforce its own rules on the way in:

```java
public void read(int pages) {
    if (pages < 0) {
        throw new IllegalArgumentException("pages must be positive, got " + pages);
    }
    this.pagesRead += pages;
}
```

Make fields `private` by default and widen only when you have a reason. A `public` field is a promise you can never take back without breaking every caller.

## static vs instance

A `static` member belongs to the class; an instance member belongs to each object.

```java
public class Book {
    private static int totalCreated = 0;   // one, shared by all books
    private final String title;            // one per book

    public Book(String title) {
        this.title = title;
        totalCreated++;
    }

    public static int getTotalCreated() {
        return totalCreated;
    }
}
```

`Book.getTotalCreated()` is called on the class. A `static` method cannot use `this` or read instance fields, because there is no particular instance to read from — which is exactly why `main` is static.

## toString, equals, and hashCode

Every class inherits from `Object`, whose default `toString()` prints something like `Book@6d06d69c`. Override it and printing an object becomes useful:

```java
@Override
public String toString() {
    return "Book{title='" + title + "', pagesRead=" + pagesRead + "}";
}
```

`equals()` defaults to identity, so two distinct `Book` objects with the same title are unequal until you say otherwise. If you override `equals`, you must also override `hashCode` — collections such as `HashMap` and `HashSet` use the hash to find the bucket and only then call `equals`. Overriding one without the other produces objects that vanish inside a `HashSet`.

## Records

For a class that is nothing but immutable data, a `record` generates the constructor, accessors, `equals`, `hashCode` and `toString` for you:

```java
public record Point(int x, int y) { }

Point p = new Point(3, 4);
p.x();                         // 3
p.equals(new Point(3, 4));     // true
```

That is the whole declaration. Reach for a record whenever a class would otherwise be fields plus boilerplate.

## Key points

- `new` allocates and runs a constructor; declaring any constructor removes the free default one.
- Keep fields `private` and validate in methods — encapsulation is what keeps state valid.
- `static` members belong to the class and cannot touch instance state or `this`.
- Override `toString` for debuggability, and never override `equals` without `hashCode`.
- Use a `record` for immutable data carriers instead of writing the boilerplate.

Next: relating classes to each other through inheritance and interfaces.
