# Methods, Parameters, and Overloading

A method is Java's unit of behaviour. Because the language is statically typed, a method signature is a contract the compiler enforces on both sides: the caller must supply the declared types, and the body must return the declared type on every path.

## Anatomy of a method

```java
public static int add(int a, int b) {
    return a + b;
}
```

Reading left to right: `public` is the visibility, `static` means it belongs to the class rather than an instance, `int` is the return type, `add` is the name, and the parentheses declare the parameters with their types.

A method declaring a return type must return a value on *every* path, or it will not compile:

```java
public static int classify(int n) {
    if (n > 0) {
        return 1;
    }
    // error: missing return statement
}
```

`void` means the method returns nothing; a bare `return;` may still be used to exit early.

## Arguments are passed by value — always

This trips up nearly everyone. Java copies the argument into the parameter. For a primitive it copies the number; for a reference it copies the *address*.

```java
static void reassign(int[] data) {
    data = new int[] {9, 9};    // rebinds the local copy only
}

static void mutate(int[] data) {
    data[0] = 9;                // changes the object both names point at
}

int[] values = {1, 2};
reassign(values);   // values is still {1, 2}
mutate(values);     // values is now {9, 2}
```

So a method can change the *contents* of an object you pass it, but it can never make your variable point at a different object. "Java is pass-by-value, where the value of a reference variable is a reference" is the precise phrasing, and it explains both behaviours above.

## Overloading

Several methods may share a name if their parameter lists differ in type, count or order. The compiler picks the match at compile time based on the argument types.

```java
static double area(double radius) {
    return Math.PI * radius * radius;
}

static double area(double width, double height) {
    return width * height;
}
```

The return type alone is *not* enough to distinguish two overloads — two methods differing only in what they return will not compile. Overload when the methods genuinely do the same thing to different inputs; when they do different things, give them different names.

## Varargs

`...` accepts any number of arguments and receives them as an array:

```java
static int sum(int... numbers) {
    int total = 0;
    for (int n : numbers) {
        total += n;
    }
    return total;
}

sum();            // 0
sum(1, 2, 3);     // 6
```

A varargs parameter must be last, and there can be only one.

## Scope and shadowing

A variable declared inside a block exists only within it. A parameter with the same name as a field *shadows* the field, which is the usual pattern in constructors and setters:

```java
public class User {
    private String name;

    public void setName(String name) {
        this.name = name;   // this.name is the field; name is the parameter
    }
}
```

Without `this.`, `name = name` assigns the parameter to itself and silently does nothing — a bug the compiler cannot catch because it is legal code.

## Key points

- A non-`void` method must return a value on every code path or it will not compile.
- Java is always pass-by-value; passing a reference copies the address, so callees can mutate an object but never rebind your variable.
- Overloads differ by parameter list; return type alone does not distinguish them.
- Varargs (`int... n`) arrive as an array and must be the last parameter.
- Use `this.field = param` when a parameter shadows a field.

Next: the classes and objects that these methods normally belong to.
