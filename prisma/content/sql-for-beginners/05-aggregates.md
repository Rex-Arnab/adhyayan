# COUNT, SUM, and GROUP BY

So far every query has returned one output row per input row. Aggregate functions break that pattern: they collapse many rows into a single summary value, and GROUP BY lets you compute that summary separately for each category instead of for the whole table at once.

## Aggregate functions on the whole table

`COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` all take a column (or `*` for COUNT) and reduce it to one number across all rows that match the WHERE clause:

```sql
SELECT COUNT(*) AS total_orders, SUM(quantity) AS total_units
FROM orders;

-- Result:
--  total_orders | total_units
-- --------------+-------------
--            42 |         137
```

`COUNT(*)` counts rows regardless of NULLs. `COUNT(column_name)` counts only rows where that column is not NULL, which matters if, say, some orders have a NULL `quantity` and you specifically want to know how many orders actually recorded a quantity.

## Grouping rows into categories

GROUP BY is what makes aggregates genuinely useful. Instead of one total for the entire table, it produces one aggregate value per distinct value in the grouping column. To find how many books each author has written and their average price, join `books` to `authors` and group by author:

```sql
SELECT a.name, COUNT(b.id) AS book_count, AVG(b.price) AS avg_price
FROM authors a
JOIN books b ON b.author_id = a.id
GROUP BY a.name;

-- Result:
--            name             | book_count | avg_price
-- ------------------------------+------------+-----------
--  Chimamanda Ngozi Adichie     |          1 |     15.99
--  Haruki Murakami              |          1 |     12.50
```

Every column in the SELECT list that is not wrapped in an aggregate function must appear in GROUP BY - the database needs to know how to collapse the remaining rows within each group, and `a.name` is what defines each group here.

## Filtering groups with HAVING

This is where beginners often get tripped up: WHERE filters individual rows before grouping happens, but you cannot use WHERE to filter on the result of an aggregate, because the aggregate doesn't exist yet at that stage. To filter based on an aggregated value - for example, only authors with more than one book - you need HAVING, which runs after grouping:

```sql
SELECT a.name, COUNT(b.id) AS book_count
FROM authors a
JOIN books b ON b.author_id = a.id
GROUP BY a.name
HAVING COUNT(b.id) > 1;
```

If you tried `WHERE COUNT(b.id) > 1` instead, the database would reject the query outright, because WHERE is evaluated row by row before any grouping or aggregation takes place. The rule of thumb: use WHERE to restrict which raw rows enter the calculation, and HAVING to restrict which groups survive after the calculation is done. You can use both in the same query - WHERE to exclude irrelevant rows early (which is also better for performance, since it shrinks the data before grouping), and HAVING to filter the resulting groups.

```sql
SELECT b.title, SUM(o.quantity) AS units_sold
FROM books b
JOIN orders o ON o.book_id = b.id
WHERE o.ordered_at >= '2024-01-01'
GROUP BY b.title
HAVING SUM(o.quantity) > 5;
```

## Key points

- Aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) collapse multiple rows into a single value.
- `COUNT(*)` counts all rows; `COUNT(column)` counts only non-NULL values in that column.
- GROUP BY produces one aggregate result per distinct value of the grouping column(s).
- WHERE filters raw rows before grouping; HAVING filters groups after aggregation - you cannot put an aggregate condition in WHERE.
- Combine WHERE and HAVING to shrink the data early and then filter the summarized results.

Aggregating within a single table is powerful, but real questions often need data spread across multiple tables at once, which is exactly what the next chapter on JOINs covers.
