# SELECT: Asking Your First Question

Every SQL query starts with a question you want answered about your data, and SELECT is the keyword that lets you ask it. In this chapter you will learn how to pull specific columns, rename them, and do simple calculations, all using the bookstore's `authors`, `books`, and `orders` tables from the previous chapter.

## Choosing columns

The simplest SELECT statement, `SELECT * FROM books`, returns every column for every row. That is fine for exploring a small table, but in real applications `SELECT *` is a habit worth breaking early. It pulls columns you may not need, makes queries harder to read, and - as you will see in the final chapter - can quietly cost you performance once tables grow large and indexes come into play. Instead, name the columns you actually want:

```sql
SELECT title, price, published_year
FROM books;

-- Result:
--      title      | price | published_year
-- ----------------+-------+----------------
--  Americanah     | 15.99 |           2013
--  Norwegian Wood | 12.50 |           1987
```

Listing columns explicitly also documents intent - anyone reading the query later knows exactly what data it depends on, without having to check the table's full definition.

## Renaming and computing columns

You can rename a column in the output using `AS`, which is useful when a column name is unclear or when you want cleaner headers in a report:

```sql
SELECT title AS book_title, price AS list_price
FROM books;
```

SELECT is not limited to raw columns. You can compute new values on the fly. Suppose you want to show each book's price with a 10 percent discount applied:

```sql
SELECT title, price, price * 0.9 AS discounted_price
FROM books;

-- Result:
--      title      | price | discounted_price
-- ----------------+-------+------------------
--  Americanah     | 15.99 |           14.391
--  Norwegian Wood | 12.50 |           11.250
```

The expression `price * 0.9` is evaluated for every row, and `AS discounted_price` gives that computed column a readable name. This is one of SQL's core strengths: you describe what result you want, and the database figures out how to compute it row by row.

## DISTINCT and a note on NULL

Sometimes a column repeats values across many rows - for example, if you selected `country` from a large `authors` table, the same country would appear once per author from that country. `DISTINCT` collapses repeated values so you see each one only once:

```sql
SELECT DISTINCT country
FROM authors;

-- Result:
--  country
-- ---------
--  Nigeria
--  Japan
```

Use `DISTINCT` when you care about the set of unique values, not about counting how many rows produced them. If you need the count instead, you are really asking an aggregate question, which is the subject of a later chapter.

Not every column is guaranteed to have a value, either. If a book's `published_year` was never recorded, that cell holds NULL, which means "unknown," not zero or an empty string. When you SELECT a column containing NULL, it displays as a blank or as `NULL` depending on your client, and any arithmetic involving it - like `price * 0.9` - will also produce NULL if `price` itself is NULL. Keep this in mind now, because the next chapter, on WHERE and filtering, spends real time on how NULL breaks ordinary comparisons like `=` and `!=`.

## Key points

- `SELECT column1, column2 FROM table` returns only the columns you name, which is clearer and generally faster than `SELECT *`.
- `AS` renames a column or an expression in the query's output without changing the underlying table.
- You can compute new values directly in SELECT, such as `price * 0.9 AS discounted_price`.
- `DISTINCT` removes duplicate values from the result set.
- NULL represents an unknown value and behaves differently from zero or an empty string in expressions.

Now that you can pull and shape columns, the next chapter teaches you how to narrow down which rows come back at all, using WHERE.
