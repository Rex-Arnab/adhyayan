# WHERE and Filtering

SELECT tells the database which columns you want; WHERE tells it which rows qualify. This chapter covers comparison operators, combining conditions, pattern matching, and the single most common beginner mistake in SQL: testing for NULL with the wrong operator.

## Basic comparisons

WHERE filters rows using a condition that evaluates to true or false for each row. Only rows where the condition is true make it into the result:

```sql
SELECT title, price
FROM books
WHERE price > 13.00;

-- Result:
--    title    | price
-- ------------+-------
--  Americanah | 15.99
```

You can use `=`, `!=` (or `<>`), `<`, `>`, `<=`, and `>=` on numbers, text, and dates. Combine multiple conditions with `AND` and `OR`:

```sql
SELECT title, price, published_year
FROM books
WHERE price < 16.00 AND published_year > 2000;
```

`AND` requires both conditions to be true; `OR` requires at least one. When you mix them, use parentheses to make the grouping explicit, because SQL evaluates `AND` before `OR` by default and relying on that silently is a common source of bugs:

```sql
SELECT title
FROM books
WHERE (published_year < 1990 OR published_year > 2010) AND price < 16.00;
```

## Pattern matching and lists

To search text loosely, use `LIKE` with `%` as a wildcard for any number of characters and `_` for exactly one:

```sql
SELECT title
FROM books
WHERE title LIKE '%Wood%';

-- Result:
--      title
-- ----------------
--  Norwegian Wood
```

When you want to check a column against several specific values, `IN` is cleaner than a chain of `OR`:

```sql
SELECT name, country
FROM authors
WHERE country IN ('Nigeria', 'Japan');
```

`BETWEEN` is useful for ranges and is inclusive on both ends: `WHERE published_year BETWEEN 1980 AND 2000` includes books published in both 1980 and 2000.

## The NULL trap

This is the mistake almost every beginner makes at least once. Suppose some rows in `books` have no recorded `published_year`, stored as NULL. You might try:

```sql
SELECT title
FROM books
WHERE published_year != 2013;
```

You would expect this to return every book except the one from 2013 - but any row where `published_year` is NULL will be silently excluded too, even though NULL is technically "not 2013." The reason is that NULL means "unknown," and SQL will not guess whether an unknown value is or is not equal to something. Any comparison against NULL using `=`, `!=`, `<`, or `>` evaluates to NULL rather than true or false, and WHERE only keeps rows where the condition is true - so NULL comparisons never pass. To correctly find or exclude unknown values, use `IS NULL` or `IS NOT NULL`:

```sql
SELECT title
FROM books
WHERE published_year IS NULL;

SELECT title
FROM books
WHERE published_year IS NOT NULL AND published_year != 2013;
```

The second query is the correct version of what the beginner mistake was trying to do: it explicitly handles the NULL case instead of letting it silently vanish from the results.

## Key points

- WHERE filters rows before they reach the output; only rows where the condition is true are kept.
- Combine conditions with `AND`/`OR`, and use parentheses to control evaluation order explicitly.
- `LIKE` with `%` and `_` handles partial text matches; `IN` and `BETWEEN` simplify list and range checks.
- NULL means "unknown" - `=` and `!=` against NULL always evaluate to NULL, not true or false, so matching rows silently disappear.
- Always use `IS NULL` or `IS NOT NULL` to explicitly test for missing values.

Once you can filter rows, the next chapter shows you how to control the order they come back in and how many you get.
