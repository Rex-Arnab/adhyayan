# Tables, Rows, and Columns

Before you write a single query, you need a mental picture of what SQL actually operates on. A relational database stores data in tables, and every table is built from rows and columns. Once that picture is solid, everything else in this course - filtering, sorting, joining - is just different ways of asking questions about tables.

## What a table is

A table is a grid, similar to a spreadsheet, but with stricter rules. Each column has a fixed name and a fixed data type, and every row must supply a value (or NULL) for every column. Throughout this course we will use a small bookstore database with three tables:

- `authors(id, name, country)` - one row per author
- `books(id, title, author_id, price, published_year)` - one row per book
- `orders(id, book_id, quantity, ordered_at)` - one row per customer order

Notice that `books.author_id` refers back to `authors.id`. This is a foreign key, and it is how relational databases connect data that lives in separate tables instead of repeating the author's name and country on every single book row. Repeating that data would waste space and, worse, create a maintenance nightmare: if an author's country changed, you would have to update every book row instead of just one author row.

## Rows and columns in practice

A row is a single record - one specific book, one specific order. A column is an attribute that every row in that table shares. The `books` table might look like this in practice:

```sql
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author_id INTEGER REFERENCES authors(id),
    price NUMERIC(6,2),
    published_year INTEGER
);

INSERT INTO authors (name, country) VALUES
    ('Chimamanda Ngozi Adichie', 'Nigeria'),
    ('Haruki Murakami', 'Japan');

INSERT INTO books (title, author_id, price, published_year) VALUES
    ('Americanah', 1, 15.99, 2013),
    ('Norwegian Wood', 2, 12.50, 1987);

-- Result of SELECT * FROM books;
--  id |     title      | author_id | price | published_year
-- ----+----------------+-----------+-------+----------------
--   1 | Americanah     |         1 | 15.99 |           2013
--   2 | Norwegian Wood |         2 | 12.50 |           1987
```

Every column has a type - `TEXT` for names, `NUMERIC(6,2)` for money so you don't lose cents to floating point rounding, `INTEGER` for whole numbers like a year or a foreign key. The `SERIAL PRIMARY KEY` on `id` means the database assigns a unique, auto-incrementing number to every new row, and no two rows in the same table can ever share one.

## Why structure matters

You might wonder why not just store everything as one giant table with author name and country copied onto every book row. The answer is data integrity. Splitting authors and books into separate tables, linked by `author_id`, means an author's country is stored exactly once. If you fix a typo in the country, every book by that author reflects the fix automatically the next time you query, because the query re-reads the single authors row rather than a stale copy. This idea - storing each fact once and linking to it - is the foundation that later chapters on joins will build directly on top of.

## Key points

- A table is rows plus columns; every row must have a value or NULL for each column.
- The running example schema for this course is `authors`, `books`, and `orders`.
- A foreign key like `books.author_id` links rows in one table to rows in another instead of duplicating data.
- A primary key (`id`) uniquely identifies each row and cannot repeat within a table.
- Column types (`TEXT`, `NUMERIC`, `INTEGER`) constrain what values a column can hold and how they behave in calculations.

With tables in place, the next chapter shows you how to actually ask questions of them using SELECT.
