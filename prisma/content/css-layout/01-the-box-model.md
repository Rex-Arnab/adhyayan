# The Box Model

Every element on a web page is a rectangular box, and CSS lays those boxes out according to a small set of rules. Before you can control flexbox or grid, you need to understand what a single box is actually made of, because layout bugs almost always trace back to a misunderstanding of the box model rather than the layout system itself.

## The four layers of a box

Each element's box is built from four nested layers, from the inside out: content, padding, border, and margin. The content box holds text or child elements. Padding is transparent space inside the border, used to keep content away from the edge. The border wraps the padding and content. Margin is transparent space outside the border, used to separate the box from its neighbors.

By default, when you set `width` and `height` in CSS, you are only sizing the content box. Padding and border are added on top of that, which means a box with `width: 200px`, `padding: 20px`, and `border: 2px solid` actually occupies 244px of horizontal space. This trips up almost everyone the first time they build a layout, because a row of "200px" boxes does not add up the way you expect.

```css
.card {
  width: 200px;
  padding: 20px;
  border: 2px solid #333;
  /* rendered width = 200 + 20*2 + 2*2 = 244px */
}
```

The fix that nearly every modern stylesheet applies is `box-sizing: border-box`, which changes the meaning of `width` and `height` so they include padding and border. With `border-box`, the box above stays exactly 200px wide, and the padding and border are subtracted from the content area instead of added on. This is why you will see this rule at the top of almost every real project:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

## Margin collapsing and negative space

Margins behave differently from padding in one important way: vertical margins between block-level siblings can collapse into a single margin equal to the larger of the two, rather than adding together. If one paragraph has `margin-bottom: 20px` and the next has `margin-top: 30px`, the visible gap between them is 30px, not 50px. This only happens with vertical margins on normal block flow, not with horizontal margins, and not inside flex or grid containers, where collapsing does not occur at all. Knowing this saves you from "fixing" a gap that was never actually broken.

Margins can also be negative, which pulls a box closer to its neighbors or even outside its parent's edge. This is a legitimate technique for overlapping elements, but it should be used deliberately, not as a workaround for a spacing bug you do not understand.

## Key points

- A box is content, padding, border, and margin, layered from the inside out.
- The default `content-box` sizing means padding and border add to your declared width; `box-sizing: border-box` makes width include them instead.
- Vertical margins between block siblings can collapse to the larger value; this does not happen inside flex or grid containers.
- Always set `box-sizing: border-box` globally so that width calculations match your intuition.
- Getting box sizing right first means fewer surprises once you start building layouts with flexbox and grid.

Once you can predict exactly how big a box will be, you are ready to look at how boxes are placed relative to one another, starting with normal flow and the `display` property.
