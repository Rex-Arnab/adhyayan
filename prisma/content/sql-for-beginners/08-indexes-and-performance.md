# Indexes and Why Queries Get Slow

A query that returns correct results can still be a bad query if it takes ten seconds instead of ten milliseconds. This final chapter explains what indexes are, how the database decides whether to use one, and the specific habits - like `SELECT *` on a large table with no index - that make queries slow as data grows.

## What an index actually does

Without an index, finding rows that match a condition means scanning every row in the table one by one - a sequential scan. On a table with a few hundred rows, like our `books` example, that's instant. On a table with ten million `orders`, it means reading ten million rows to find the handful that match. An index is a separate, sorted structure the database maintains alongside the table, similar to a book's index: it lets the database jump almost directly to matching rows instead of checking every one.

```sql
CREATE INDEX idx_orders_book_id ON orders(book_id);

SELECT o.id, o.quantity, o.ordered_at
FROM orders o
WHERE o.book_id = 1;
```

With `idx_orders_book_id` in place, this query looks up `book_id = 1` directly in the index and jumps to the matching rows, rather than scanning the entire `orders` table. This is why foreign key columns used in JOIN conditions - like `orders.book_id` and `books.author_id` - are prime candidates for indexes: joins constantly filter and match on them.

## Seeing what the database actually does

PostgreSQL lets you ask it to show its plan with `EXPLAIN`:

```sql
EXPLAIN SELECT * FROM orders WHERE book_id = 1;

-- Result (abridged):
-- Index Scan using idx_orders_book_id on orders
--   Index Cond: (book_id = 1)
```

If the index didn't exist, or if the query prevented its use, you would instead see `Seq Scan on orders`, meaning every row was checked. Running `EXPLAIN` before and after adding an index is the concrete way to confirm a change actually helped, rather than assuming it did.

## Why SELECT * plus no index is a slow combination

Two habits compound each other badly on a growing table. First, `WHERE book_id = 1` with no index on `book_id` forces a sequential scan - the database has no shortcut, so it reads every row in `orders` to check each one's `book_id`. Second, `SELECT *` pulls every column of every row it touches, including large text columns you don't need, meaning more data read from disk and sent over the network for each row the scan touches. Individually each habit costs something; together, on a large table, they multiply into a full scan that reads and returns far more data than the question required. The fix is what earlier chapters already taught: select only the columns you need, and index columns used in WHERE and JOIN conditions - like `orders.book_id` - once the table is large enough to matter.

Indexes are not free, though. Each one speeds up reads on that column but adds overhead to every INSERT, UPDATE, and DELETE, since the database must keep the index's sorted structure up to date too. That's why you don't index every column "just in case" - you index what your real queries actually filter or join on, guided by slow queries you've actually observed, not guesswork.

## Key points

- An index lets the database jump to matching rows instead of scanning the whole table, much like a book's index.
- Foreign key columns used in JOIN and WHERE conditions, like `orders.book_id`, are the columns most worth indexing.
- `EXPLAIN` shows whether a query used an index scan or a sequential scan, so you can measure the effect of an index instead of assuming it.
- `SELECT *` combined with a missing index compounds the cost: a full table scan that also reads and transmits unnecessary columns.
- Indexes speed up reads but slow down writes, so add them based on real query patterns, not preemptively on every column.

You now have the core vocabulary of SQL - tables, SELECT, WHERE, ORDER BY, aggregates, JOINs, subqueries, and indexes - so the next step is applying it to real questions against real data, refining each query by checking its results and, when needed, its execution plan.
