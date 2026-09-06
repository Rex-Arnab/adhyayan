# Flexbox Basics: The Main Axis

Flexbox is a one-dimensional layout system: it arranges items along a single line, called the main axis, and distributes leftover space along it. Everything flexbox does starts from this idea, so getting comfortable with the main axis is the key to using flexbox confidently instead of guessing at properties until something looks right.

## Turning on flex and picking a direction

You create a flex context with `display: flex` on a container. By default, the main axis runs horizontally, left to right, because the default value of `flex-direction` is `row`. Setting `flex-direction: column` rotates the main axis to run vertically instead. This single property is the most important one in flexbox, because every other flex property is defined relative to whichever axis is currently "main." `justify-content`, for example, always aligns items along the main axis, whether that axis is horizontal or vertical.

```css
.nav {
  display: flex;
  flex-direction: row; /* default: items flow left to right */
  gap: 16px;
}

.sidebar {
  display: flex;
  flex-direction: column; /* items now flow top to bottom */
  gap: 8px;
}
```

The axis perpendicular to the main axis is called the cross axis. In a `row` container the cross axis is vertical; in a `column` container it is horizontal. You will meet the cross axis properly in the next chapter, but keep it in mind now: a lot of flexbox confusion comes from applying a main-axis property when you meant a cross-axis one, or vice versa.

## Controlling how items grow and shrink

Flex items do not just sit at their natural content size — flexbox actively decides how to distribute extra space or handle a shortage of space along the main axis. Three properties control this per item: `flex-grow` (how much of the extra space an item should absorb, relative to its siblings), `flex-shrink` (how much an item should shrink when there isn't enough room), and `flex-basis` (the item's starting size before growing or shrinking is applied).

These three are almost always set together using the `flex` shorthand. `flex: 1` is the most common pattern you will see, and it means "grow to fill available space, shrink if needed, starting from a basis of 0" — in other words, make all matching items share the remaining space equally.

```css
.layout {
  display: flex;
}

.sidebar {
  flex: 0 0 240px; /* don't grow, don't shrink, fixed 240px */
}

.main-content {
  flex: 1; /* grow to consume all remaining horizontal space */
}
```

This pattern — a fixed-size sidebar next to a fluid main area — is one of the most common real-world uses of flexbox, and it demonstrates why flexbox is content-based rather than container-based: item sizes are computed from a mix of their own content, their flex-basis, and how much room is actually available, not from a rigid predefined track like grid uses.

## A common mistake: reaching for flex when you need two dimensions

Flexbox only manages one axis at a time. If you try to build a layout that needs both rows and columns to align together, like a photo gallery where items must line up in both directions, flexbox will fight you — wrapped rows in a flex container do not know about each other, so columns will not line up unless every item happens to be the same size. That situation is a strong signal to use grid instead, which is covered in a later chapter.

## Key points

- `display: flex` creates a flex container; `flex-direction` decides which axis is the main axis.
- `justify-content` and the `flex` shorthand (`flex-grow`, `flex-shrink`, `flex-basis`) operate along the main axis.
- `flex: 1` is a shorthand for "grow and shrink freely from a zero basis," commonly used for fluid content areas.
- Flexbox sizing is content-based, computed from available space and each item's flex properties.
- When two directions need to line up together, that is a signal to reach for grid instead of flexbox.
- Once you can control the main axis, the next step is aligning items and wrapping them across the cross axis.
