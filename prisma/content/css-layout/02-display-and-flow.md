# Display and Normal Flow

Before you turn on flexbox or grid, every element already has a layout behavior called normal flow, controlled mostly by the `display` property. Understanding normal flow first makes it obvious why flexbox and grid exist and what problems they were built to solve.

## Block and inline display

In normal flow, elements are either block-level or inline-level. A block-level element, like a `div`, `p`, or `section`, starts on a new line and stretches to fill the available width of its parent by default. Its `width` and `height` are respected, and vertical margins can collapse with neighboring blocks. An inline element, like a `span` or `a`, flows within a line of text, sits next to other inline content, and ignores `width`, `height`, and vertical margin entirely — only horizontal padding and margin have any visible effect.

A third value, `inline-block`, gives you the best of both: the element flows inline with surrounding content but still respects `width`, `height`, and vertical margin/padding like a block does.

```css
.badge {
  display: inline-block;
  width: 80px;
  padding: 4px 8px;
  background: #eef;
  border-radius: 4px;
}
```

Before flexbox existed, developers relied on `inline-block`, `float`, and manual margin math to build multi-column layouts. It worked, but it was fragile: whitespace between inline-block elements created mystery gaps, floats required "clearfix" hacks to contain themselves, and vertical centering was famously difficult. These pain points are exactly what flexbox and grid were designed to remove.

## Why display: flex and display: grid change everything

Setting `display: flex` or `display: grid` on an element does two things at once. First, it turns that element into a flex or grid **container**. Second, it changes how its direct children are laid out — they become flex items or grid items and stop following normal block/inline flow entirely. Floats no longer apply to them, `vertical-align` becomes irrelevant, and margins between them never collapse.

This is a common point of confusion: `display: flex` affects the children's layout behavior, not the container's own box. The container itself still behaves like a block box in the flow of the page around it (unless you use `inline-flex`, which flows the whole container inline, similar to `inline-block`).

```css
.toolbar {
  display: flex;      /* children become flex items */
  gap: 12px;
}

.toolbar > button {
  /* no longer floated, no longer inline-block quirks */
}
```

Grid works the same way conceptually: `display: grid` makes the element's children grid items placed into a row/column structure you define, instead of stacking or flowing based on their own content width.

## Choosing where flow still matters

Not every layout needs flexbox or grid. A blog post body, with paragraphs, headings, and images that should just stack top to bottom, is already well served by normal block flow — wrapping it in a flex or grid container adds complexity without benefit. Reach for flexbox or grid when you need to distribute space among siblings, align items along an axis, or build an actual two-dimensional structure. Reach for normal flow when content is naturally linear and you just want it to read top to bottom.

## Key points

- Block elements stack vertically and respect width/height; inline elements flow within text and ignore them; inline-block gets both.
- `display: flex` and `display: grid` change how children are laid out, not how the container itself sits in the page.
- Floats, `vertical-align`, and margin collapsing stop applying to flex and grid items.
- Not all content needs a layout system — plain document flow is still the right tool for linear content like articles.
- With flow and display settled, the next step is turning that container into a flex context and understanding its main axis.
