# Grid Basics: Rows and Columns

Flexbox manages one axis at a time. Grid manages both at once, letting you define rows and columns together as a single structure and place items into specific cells. This makes grid the right tool whenever a layout genuinely needs to line up in two directions, rather than just flow along one.

## Defining the tracks

You turn an element into a grid container with `display: grid`, then describe its structure with `grid-template-columns` and `grid-template-rows`. Each value in these properties defines one "track" — a column width or a row height. The `fr` unit, short for fraction, is grid's answer to flexbox's `flex: 1`: it represents a share of the remaining space after fixed-size tracks are accounted for.

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
  min-height: 100vh;
}
```

This single declaration creates a fixed 240px sidebar column followed by two equal flexible columns, and a header/content/footer row structure where the middle row absorbs any extra vertical space. Notice that grid sizing is container-based in a way flexbox is not: you are declaring the structure up front, and items are placed into it, rather than computing sizes from content and then distributing leftover space.

## Explicit vs implicit grid

The tracks you define with `grid-template-columns` and `grid-template-rows` make up the **explicit grid** — the structure you asked for. But if you place more items than fit into that structure, or don't specify rows at all, grid automatically generates extra rows (or columns) to hold them. These auto-generated tracks are the **implicit grid**, and their size is controlled by `grid-auto-rows` and `grid-auto-columns` rather than the template properties.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* explicit: exactly 3 columns */
  grid-auto-rows: minmax(120px, auto);   /* implicit rows created as needed */
  gap: 12px;
}
```

This distinction matters because a common bug is setting `grid-template-rows` expecting it to apply to every row your content produces — it only applies to the rows you explicitly listed. Anything beyond that falls back to `grid-auto-rows`, which defaults to `auto` if you never set it.

## repeat(), minmax(), and auto-fit

Writing out `1fr 1fr 1fr` gets tedious and brittle, so grid provides `repeat(3, 1fr)` as a shorthand for exactly that. Combined with `minmax()`, you can build a responsive card grid without a single media query: `minmax(200px, 1fr)` tells each column to never shrink below 200px but to grow to fill available space above that.

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

Here, `auto-fit` tells the browser to fit as many 200px-minimum columns as will comfortably fit in the container's width, collapsing empty tracks, and `1fr` lets the columns stretch to fill any leftover space evenly. This one line replaces what used to require several breakpoints of hand-tuned flexbox or float code.

## Key points

- `display: grid` plus `grid-template-columns`/`grid-template-rows` defines an explicit set of row and column tracks.
- The `fr` unit distributes remaining space, similar in spirit to `flex: 1` but declared as part of the track list itself.
- Items beyond the explicit grid create implicit tracks, sized by `grid-auto-rows`/`grid-auto-columns`.
- `repeat()` and `minmax()` together, especially with `auto-fit`, build responsive column counts without media queries.
- Reach for grid instead of flexbox whenever rows and columns need to align together, not just flow along one line.

Once you can define tracks, the next step is naming areas of the grid directly so you can place items by role rather than by row and column numbers.
