# ORDER BY and LIMIT

A query result has no guaranteed order unless you ask for one. This chapter shows how to sort results with ORDER BY and how to cap the number of rows returned with LIMIT, plus how the two work together to answer questions like "what are the five most expensive books."

## Sorting with ORDER BY

By default, a database can return rows in whatever order is most convenient internally - often the order they were physically stored in, which is not something you should rely on. To guarantee an order, use ORDER BY:

```sql
SELECT title, price
FROM books
ORDER BY price;

-- Result:
--      title      | price
-- ----------------+-------
--  Norwegian Wood | 12.50
--  Americanah     | 15.99
```

This sorts ascending by default. To sort from highest to lowest, add `DESC`:

```sql
SELECT title, price
FROM books
ORDER BY price DESC;
```

You can sort by multiple columns, which matters when the first column has ties. This query sorts books by published year, and within the same year, alphabetically by title:

```sql
SELECT title, published_year
FROM books
ORDER BY published_year ASC, title ASC;
```

The database applies the first sort key, and only for rows that tie on it does it look at the second key. You can also sort by a column that isn't in the SELECT list, and you can sort by a computed expression:

```sql
SELECT title, price
FROM books
ORDER BY price * 1.08 DESC;
```

## Limiting results

LIMIT restricts how many rows come back, which matters both for readability and for performance - fetching a million rows to display ten of them wastes time and bandwidth. LIMIT is almost always paired with ORDER BY, because "the top 5" only means something once you've defined what order you're ranking by:

```sql
SELECT title, price
FROM books
ORDER BY price DESC
LIMIT 2;

-- Result:
--    title    | price
-- ------------+-------
--  Americanah | 15.99
--  Norwegian Wood | 12.50
```

Without ORDER BY, `LIMIT 2` would still return only two rows, but which two is undefined and can change between runs. That is rarely what you want when the question is "give me the top N by some measure."

## OFFSET for pagination

If you're building a paged list - page 1, page 2, and so on - combine LIMIT with OFFSET to skip a number of rows before starting to return results:

```sql
SELECT title, price
FROM books
ORDER BY published_year
LIMIT 10 OFFSET 10;
```

This skips the first 10 rows (page 1) and returns the next 10 (page 2). Note that OFFSET on a large table still has to scan past the skipped rows internally, so very deep pagination (offset in the tens of thousands) can get slow - a concern the final chapter on indexes and performance will return to.

## Key points

- ORDER BY controls the row order in the result; without it, order is not guaranteed.
- `DESC` sorts descending; the default is ascending (`ASC`).
- Multiple sort keys break ties: earlier keys take priority, later keys only apply when earlier ones are equal.
- LIMIT caps the number of rows returned and should almost always be paired with ORDER BY so "top N" is well-defined.
- OFFSET skips rows for pagination but gets progressively slower on large offsets.

With sorting and limiting covered, the next chapter moves from looking at individual rows to summarizing groups of them with aggregate functions.
