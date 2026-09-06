# Your First Java Program

Java asks for more ceremony than a scripting language, and the ceremony is the point: everything has a declared type, everything lives inside a class, and the compiler checks the whole program before a single line runs. That trade — more typing now, fewer surprises later — is the reason Java still runs most of the world's back offices.

## The smallest program

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, world");
    }
}
```

Every word there is doing something:

- `public class Hello` — a class named `Hello`. In a multi-file project the public class must live in a file of the same name, `Hello.java`.
- `static` — this method belongs to the class itself, not to an instance, so the runtime can call it without constructing anything.
- `void` — it returns nothing.
- `main(String[] args)` — the fixed entry point. The JVM looks for exactly this signature; `Main`, `start` or a different parameter list will compile but never launch.
- `System.out.println` — print a line to standard output.

Statements end in semicolons and blocks are braced. Indentation is for humans only; the compiler ignores it entirely.

## Compile, then run

Java is compiled to *bytecode*, not to machine code. `javac` produces a `.class` file, and the JVM executes it:

```bash
javac Hello.java     # produces Hello.class
java Hello           # note: the class name, not the filename
```

That two-step is what "write once, run anywhere" means — the same `.class` file runs on any machine with a JVM. Since Java 11 you can also run a single file directly for quick experiments:

```bash
java Hello.java
```

The compile step is where Java earns its keep. Misspell a name, mismatch a type, or forget to return a value, and you get an error at build time rather than a crash in front of a user.

## Comments and documentation

```java
// a single-line comment

/* a block comment
   spanning lines */

/**
 * A Javadoc comment — tooling extracts these into API documentation.
 * @param args command-line arguments
 */
```

Javadoc on public methods is a strong convention in Java codebases; the three-slash-star form is what generates the docs you have read on every library site.

## Printing and reading input

```java
int count = 3;
System.out.println("Count: " + count);        // string concatenation
System.out.printf("Count: %d%n", count);      // formatted, %n is a newline
System.out.println("A" + 1 + 2);              // "A12" — left to right!
System.out.println(1 + 2 + "A");              // "3A"
```

That last pair catches everyone once: `+` concatenates as soon as either operand is a `String`, and it evaluates left to right. Reading input uses a `Scanner`:

```java
import java.util.Scanner;

Scanner scanner = new Scanner(System.in);
System.out.print("Name: ");
String name = scanner.nextLine();
System.out.println("Hello, " + name);
```

## Key points

- All code lives in a class; the public class name must match the filename.
- `public static void main(String[] args)` is the only entry point the JVM recognises.
- `javac` compiles to portable bytecode; `java <ClassName>` runs it — no `.class` extension.
- Compile-time checking is the language's core value: most mistakes surface before the program starts.
- `+` concatenates left to right once a `String` appears, so `"A" + 1 + 2` is `"A12"`.

Next: the type system that makes all of that checking possible.
