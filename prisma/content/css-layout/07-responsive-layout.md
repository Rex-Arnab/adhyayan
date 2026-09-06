# Responsive Layout Without Media Queries

Media queries have long been the default tool for responsive design, but many layout adjustments can now be handled entirely by flexbox and grid's own sizing features. Content-aware layout that reflows based on available space, rather than a fixed set of breakpoints, tends to hold up better across the huge range of screen sizes real users actually have.

## Wrapping flex items instead of hardcoding breakpoints

Combining `flex-wrap: wrap` with `flex-basis` gives you a layout that reflows automatically as the container shrinks, without ever checking a specific viewport width. Each item declares a minimum comfortable size, and the browser fits as many as will reasonably fit per row, wrapping the rest onto new lines.

```css
.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.product-card {
  flex: 1 1 220px; /* grow, shrink, but prefer 220px */
}
```

At a wide viewport, several 220px cards sit on one row and stretch to fill leftover space. As the container narrows, cards drop to the next line on their own once they can no longer maintain roughly 220px. There is no breakpoint to maintain, and the layout responds correctly to being embedded in a narrow sidebar just as well as a full-width page, which a media query tied to the viewport cannot do.

## auto-fit and minmax for grid

The grid equivalent, introduced briefly in an earlier chapter, deserves emphasis here because it is the single most useful responsive pattern in modern CSS: `repeat(auto-fit, minmax(min, 1fr))`. It tells the browser to compute how many columns of at least `min` width can fit, create that many, and stretch them evenly to fill the row.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
```

`auto-fit` and its close relative `auto-fill` differ in a subtle way worth knowing: `auto-fit` collapses unused tracks to zero width when there are fewer items than would fill a row, letting existing items stretch to consume the freed space, while `auto-fill` keeps the empty tracks in place, which can leave gaps if you actually want items to stay a fixed size rather than stretch. Choose `auto-fit` when items should grow to fill the row, and `auto-fill` when they should keep a consistent size even with fewer items present.

## Choosing between flexbox and grid, and combining them

A layout is not required to be pure flexbox or pure grid. It is common, and often correct, to use grid for the page-level structure — the overall regions defined with `grid-template-areas` from the previous chapter — and flexbox inside individual regions, like a horizontal row of buttons in a header or a vertically stacked form. Grid excels at aligning things in two dimensions and reasoning about the whole page at once; flexbox excels at distributing and aligning a group of items along one line, like a toolbar, a tag list, or a set of form controls.

A frequent mistake is trying to force one system to do the other's job: fighting flexbox to get a photo grid to align in both directions, or building an entire multi-region page in flexbox with a maze of nested wrappers just to get two independent axes of alignment. When you catch yourself adding wrapper divs purely to fake a second axis, that is the signal to switch to grid for that piece of the layout.

## Key points

- `flex-wrap` with a sensible `flex-basis` reflows a row of items based on available space, not a fixed breakpoint.
- `repeat(auto-fit, minmax(min, 1fr))` computes a responsive column count for grid without any media query.
- `auto-fit` collapses empty tracks so existing items stretch to fill space; `auto-fill` preserves them, which can leave gaps.
- Combine grid for page-level, two-dimensional structure with flexbox for one-dimensional groups inside each region.
- Reach for a media query only when spacing, typography, or visibility genuinely needs to change at a specific size — not as the default first tool for reflow.

With the box model, flow, flexbox, and grid all in hand, the natural next step is applying these layouts to a real page and refining them against actual content instead of placeholder boxes.
