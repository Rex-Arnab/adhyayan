# Grid Template Areas

Placing grid items by counting row and column line numbers works, but it is hard to read and easy to get wrong once a layout has more than a few regions. Grid template areas let you name each region of your layout and then draw the whole structure as an ASCII diagram right inside your CSS, which is often the clearest way to express a page layout.

## Naming regions with grid-template-areas

`grid-template-areas` takes a string for each row, where each word names the area that row's cells belong to. Repeating a name across adjacent cells, horizontally or vertically, makes that area span multiple tracks. Once the areas are named, you assign each child to one with `grid-area`, matching the name exactly.

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "sidebar header"
    "sidebar main"
    "sidebar footer";
  min-height: 100vh;
  gap: 16px;
}

.header  { grid-area: header; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
.sidebar { grid-area: sidebar; }
```

Reading that string block, you can see the entire page structure at a glance: a sidebar running down the full left column, and header, main, and footer stacked in the right column. This is the biggest practical benefit of named areas — the CSS itself documents the layout, so a teammate (or you, in six months) does not have to mentally reconstruct the grid from line numbers.

Every row in the string needs the same number of words, and a cell that should stay empty is marked with a period (`.`) rather than a name. Any area name used in `grid-template-areas` must exactly match the value used in `grid-area`, including case — a typo here silently leaves an item unplaced rather than throwing an error, which makes careful naming worth the extra attention.

## Changing layout by redefining areas, not moving markup

The real power of named areas shows up when you want to rearrange a layout at different screen sizes. Because the HTML order of elements does not need to match their visual position in a grid, you can move the sidebar from the side to the top on small screens purely by redefining `grid-template-areas` and `grid-template-columns` inside a media query — no markup changes, no reflowing based on source order.

```css
@media (max-width: 700px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
  }
}
```

This is a meaningful advantage over flexbox's `order` property, which can only reorder items along a single axis and quickly becomes unwieldy for anything more complex than swapping two items.

## When line-based placement is still better

Named areas work best for a small number of large, distinct regions, like the overall page chrome. For a repetitive structure, like a table-like data grid or a photo gallery where many similar items are placed by pattern rather than by named role, line-based placement (`grid-column: span 2`, `grid-row: 1 / 3`) or the `repeat()` function is usually less verbose and easier to maintain than inventing dozens of area names.

## Key points

- `grid-template-areas` names regions as an ASCII layout; `grid-area` assigns a child to a named region.
- Each row string needs equal word counts, and a period (`.`) marks a deliberately empty cell.
- Named areas let you completely restructure a layout in a media query without touching HTML or its source order.
- Mismatched or misspelled area names fail silently, so double-check that `grid-area` values match the template exactly.
- Prefer line-based placement over named areas for repetitive, pattern-based grids like card lists or tables.

With both explicit tracks and named areas available, the next chapter looks at combining flexbox and grid to build layouts that adapt to screen size without writing a single media query.
