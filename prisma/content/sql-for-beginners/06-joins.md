# JOINs: Combining Tables

The bookstore schema splits data across three tables on purpose - authors, books, and orders each hold one kind of fact, linked by foreign keys. JOINs are how you stitch them back together at query time. This chapter covers INNER JOIN and LEFT JOIN, and the row-count differences that trip people up when they choose the wrong one.

## INNER JOIN: only matching rows

An INNER JOIN returns rows only when there is a match in both tables on the join condition. To list every book alongside its author's name and country, join `books` to `authors` on the foreign key relationship:

```sql
SELECT b.title, a.name, a.country
FROM books b
INNER JOIN authors a ON b.author_id = a.id;

-- Result:
--      title      |            name            | country
-- ----------------+----------------------------+---------
--  Americanah     | Chimamanda Ngozi Adichie   | Nigeria
--  Norwegian Wood | Haruki Murakami            | Japan
```

`ON b.author_id = a.id` tells the database how to line up rows from the two tables. If a book's `author_id` does not match any row in `authors` - which shouldn't happen if the foreign key is enforced, but can happen with orphaned data - that book simply would not appear in an INNER JOIN result. That is the defining trait of INNER JOIN: it silently drops rows without a match on either side.

## LEFT JOIN: keep everything from the left table

A LEFT JOIN keeps every row from the "left" table (the one named first) regardless of whether it finds a match on the right, filling in NULLs for the right side's columns when there is no match. This matters a lot for a table like `books`, where some books may never have been ordered yet. To list every book with its total units sold, including books with zero orders:

```sql
SELECT b.title, COALESCE(SUM(o.quantity), 0) AS units_sold
FROM books b
LEFT JOIN orders o ON o.book_id = b.id
GROUP BY b.title;

-- Result:
--      title      | units_sold
-- ----------------+------------
--  Americanah     |         12
--  Norwegian Wood |          0
```

If you had used INNER JOIN here instead, "Norwegian Wood" would disappear entirely from the result the moment it had zero matching order rows, because INNER JOIN only keeps rows with a match on both sides. That is the single most common JOIN mistake: reaching for INNER JOIN by default and silently losing rows that have no related data yet, when the actual question ("every book, with sales if any") called for LEFT JOIN. `COALESCE(SUM(o.quantity), 0)` turns the NULL that SUM produces for unmatched books into an explicit 0, which is usually what you want to display.

## Row counts change based on the join type

It helps to think concretely about row counts. If `books` has 2 rows and `orders` has 3 rows referencing those books (2 orders for Americanah, 1 for Norwegian Wood), an INNER JOIN produces 3 rows - one per matching order, with book details repeated. A LEFT JOIN from `books` to `orders` also produces 3 rows here, since every book has at least one order. But add a third book with zero orders: INNER JOIN still produces 3 rows (that book excluded), while LEFT JOIN produces 4 (the extra book appears once, with NULLs for order columns). Always ask "should unmatched rows still appear?" before picking the join type.

## Key points

- INNER JOIN returns only rows with a match in both tables; unmatched rows on either side are dropped.
- LEFT JOIN keeps every row from the left table, filling in NULLs when there is no match on the right.
- Choosing INNER JOIN when you actually need "everything, plus related data if it exists" silently drops legitimate rows - this is the most common JOIN bug.
- `COALESCE` converts a NULL aggregate result (from unmatched LEFT JOIN rows) into a meaningful default like 0.
- Think in terms of expected row counts before running a join, so an unexpectedly short result is easy to spot.

JOINs let you combine tables side by side, but sometimes you need the result of one query to feed into another - which is what subqueries and CTEs, covered next, are for.
