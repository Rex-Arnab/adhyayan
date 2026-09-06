# Subqueries and CTEs

Some questions can't be answered in a single flat query - you need the result of one query to feed into another. SQL gives you two main tools for this: subqueries, which nest one SELECT inside another, and CTEs (Common Table Expressions), which name an intermediate result so you can reference it cleanly. This chapter shows both, using the bookstore schema.

## Subqueries in WHERE

A subquery is a SELECT statement placed inside another query, often inside a WHERE clause to filter based on a computed set of values. Suppose you want every book priced above the store's average price:

```sql
SELECT title, price
FROM books
WHERE price > (SELECT AVG(price) FROM books);

-- Result:
--    title    | price
-- ------------+-------
--  Americanah | 15.99
```

The inner query `SELECT AVG(price) FROM books` runs first and produces a single number, which the outer query then compares each book's price against. This is different from a JOIN because the subquery here returns one scalar value, not a set of rows to match against - it's answering "what is the threshold," not "which rows relate to which."

Subqueries can also return a list of values for use with `IN`. To find every book that has ever appeared in an order:

```sql
SELECT title
FROM books
WHERE id IN (SELECT DISTINCT book_id FROM orders);
```

## CTEs: naming your intermediate steps

As logic gets more complex, nesting subqueries inside subqueries becomes hard to read. A CTE, written with `WITH`, lets you name an intermediate result and reference it like a temporary table for the rest of the query. Rewriting the average-price example as a CTE:

```sql
WITH avg_price AS (
    SELECT AVG(price) AS avg_val FROM books
)
SELECT b.title, b.price
FROM books b, avg_price
WHERE b.price > avg_price.avg_val;
```

That example is simple enough that a plain subquery reads fine, but CTEs shine when you build a multi-step calculation. Here's a query that finds each book's total revenue from orders, then filters to books earning more than $50, using a CTE to keep the aggregation step separate and readable:

```sql
WITH book_revenue AS (
    SELECT b.id, b.title, SUM(b.price * o.quantity) AS revenue
    FROM books b
    JOIN orders o ON o.book_id = b.id
    GROUP BY b.id, b.title
)
SELECT title, revenue
FROM book_revenue
WHERE revenue > 50
ORDER BY revenue DESC;

-- Result:
--    title    | revenue
-- ------------+---------
--  Americanah |  191.88
```

Notice that the CTE (`book_revenue`) computes the aggregate once, and the outer query then filters and sorts that already-computed result with an ordinary WHERE clause - not HAVING, because by the time the outer query runs, `revenue` is just a regular column on a named result set, not a live aggregate being computed row by row.

## Choosing between them

Use a simple subquery for a single, self-contained lookup, like comparing against an average or checking list membership. Reach for a CTE when you have multiple computation stages, a result referenced more than once, or when naming a step improves readability. Both compile to similar execution plans in PostgreSQL, so the choice is mostly about clarity, not performance - though large or repeated CTEs are worth checking with EXPLAIN, the tool the next chapter introduces.

## Key points

- A subquery nests one SELECT inside another, commonly inside WHERE to filter against a computed value or list.
- A subquery returning a single value can be compared directly with `>`, `<`, or `=`; one returning multiple rows pairs with `IN`.
- CTEs, written with `WITH ... AS (...)`, name an intermediate result so later parts of the query can reference it clearly.
- Once a CTE's result is computed, you filter it with an ordinary WHERE, not HAVING, since it's no longer a live aggregation.
- Prefer CTEs over deeply nested subqueries when a query has multiple logical steps or reused intermediate results.

Subqueries and CTEs help you express complex logic clearly, but a query's clarity says nothing about its speed - which is exactly why the final chapter looks at indexes and why queries get slow.
