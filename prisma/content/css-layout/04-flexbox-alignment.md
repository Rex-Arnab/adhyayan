# Flexbox Alignment and Wrapping

The previous chapter focused on the main axis — how items grow, shrink, and space themselves along the direction the container flows. This chapter covers the two things people mix up most in flexbox: aligning items on the cross axis, and letting a row of items wrap onto multiple lines instead of squeezing or overflowing.

## justify-content vs align-items: the axis rule

The single rule that resolves almost all flexbox alignment confusion is this: `justify-content` always operates on the main axis, and `align-items` always operates on the cross axis. In a default `row` container, the main axis is horizontal, so `justify-content` controls horizontal spacing (`flex-start`, `center`, `space-between`, `space-around`, `space-evenly`), while `align-items` controls vertical alignment within the line (`flex-start`, `center`, `flex-end`, `stretch`, `baseline`).

Switch `flex-direction` to `column`, and the axes swap: `justify-content` now controls vertical spacing, and `align-items` controls horizontal alignment. This is why the same two lines of CSS produce completely different-looking results depending on `flex-direction` — the properties did not change meaning, the axis they refer to did.

```css
.center-everything {
  display: flex;
  justify-content: center; /* centers along the main axis */
  align-items: center;     /* centers along the cross axis */
  height: 300px;
}
```

That four-line pattern is the classic "how do I center a div" answer, and it works precisely because it is addressing both axes independently rather than trying to center with margins or absolute positioning.

## Aligning a single item differently

Sometimes one item in a row needs to break from how its siblings are aligned — for example, pushing a "logout" link to the far right of a navbar while everything else stays left-aligned. `align-self` overrides `align-items` for a single flex item on the cross axis, and `margin-left: auto` (or `margin-right: auto`) can push a single item away from its siblings along the main axis by consuming all remaining free space in that direction.

```css
.navbar {
  display: flex;
  align-items: center;
}

.navbar .logout {
  margin-left: auto; /* pushes only this item to the far end */
}
```

## Wrapping items onto multiple lines

By default, flex items shrink to try to fit on one line, which can cause them to become uncomfortably narrow. Setting `flex-wrap: wrap` allows items to flow onto additional lines instead of shrinking indefinitely, similar to how words wrap in a paragraph. Once a container wraps, it has multiple lines along the cross axis, and a new property becomes relevant: `align-content`, which distributes space between those lines (not the items within a line — that is still `align-items`).

```css
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start; /* lines pack toward the top, don't stretch to fill height */
}
```

The shorthand `flex-flow: row wrap` combines `flex-direction` and `flex-wrap` in one declaration, which is handy but optional — writing them separately is just as valid and often clearer to read.

## A common mistake worth calling out

A frequent bug is expecting `align-items: center` to center items horizontally in a normal `row` container. It centers them vertically, because `align-items` is always cross-axis, and the cross axis in a row is vertical. If horizontal centering is what you want in a row, that is `justify-content: center`. Keeping the axis rule in mind, rather than memorizing property names in isolation, prevents this mistake entirely.

## Key points

- `justify-content` aligns along the main axis; `align-items` aligns along the cross axis; the axes swap when `flex-direction` changes.
- `align-self` overrides cross-axis alignment for one item; `margin-left/right: auto` pushes one item away along the main axis.
- `flex-wrap: wrap` lets items flow onto new lines instead of shrinking forever.
- `align-content` spaces out multiple wrapped lines and only matters once wrapping is active.
- Confusing justify-content with align-items is the single most common flexbox mistake — always ask which axis you actually mean.

With one-dimensional layout under control, the next chapter introduces grid, which manages rows and columns together as a single two-dimensional system.
