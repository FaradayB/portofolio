# Task 3: CSS Polish — Section Transition Weight

**File edited:** `src/styles/cv.css`

## Summary

Applied three CSS edits to make section transitions feel heavier and more deliberate (premium sci-fi menu weight). All changes are isolated to animation timing, easing curves, and keyframe travel distances.

## Edits Applied

### Edit 1: Added Weighted Easing Token
**Location:** `:root` block, line 23 (after `--ease`)

**Before:**
```css
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
```

**After:**
```css
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-weighted: cubic-bezier(0.16, 1, 0.3, 1);
```

**Purpose:** Define a weighted easing curve with lower control points for a more deliberate deceleration.

---

### Edit 2: Updated View Animation Rules
**Location:** Lines 282–283 (`.view[data-dir=...]` selectors)

**Before:**
```css
.view[data-dir="down"] { animation: viewSlideUp 0.5s var(--ease) both; }
.view[data-dir="up"]   { animation: viewSlideDown 0.5s var(--ease) both; }
```

**After:**
```css
.view[data-dir="down"] { animation: viewSlideUp 0.66s var(--ease-weighted) both; }
.view[data-dir="up"]   { animation: viewSlideDown 0.66s var(--ease-weighted) both; }
```

**Changes:**
- Increased duration from `0.5s` → `0.66s` (32% slower)
- Switched easing from `var(--ease)` → `var(--ease-weighted)` (heavier curve)

---

### Edit 3: Increased Keyframe Travel Distance
**Location:** Lines 298–305 (`@keyframes viewSlideUp` and `@keyframes viewSlideDown`)

**Before:**
```css
@keyframes viewSlideUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: none; }
}
@keyframes viewSlideDown {
  from { opacity: 0; transform: translateY(-40px); }
  to   { opacity: 1; transform: none; }
}
```

**After:**
```css
@keyframes viewSlideUp {
  from { opacity: 0; transform: translateY(54px); }
  to   { opacity: 1; transform: none; }
}
@keyframes viewSlideDown {
  from { opacity: 0; transform: translateY(-54px); }
  to   { opacity: 1; transform: none; }
}
```

**Changes:**
- Increased translateY distance from `40px` → `54px` (35% more travel for enhanced weight perception)

---

## Verification

✓ **Keyframe names unchanged:** `viewSlideUp` and `viewSlideDown` remain exactly the same (other code depends on these names)  
✓ **Single easing token added:** `--ease-weighted` defined once in `:root` block  
✓ **Animation rules updated:** Both `.view[data-dir="down"]` and `.view[data-dir="up"]` reference `var(--ease-weighted)` with `0.66s`  
✓ **No other files modified:** Only `src/styles/cv.css` was edited  
✓ **CSS syntax valid:** All values are syntactically correct cubic-bezier and duration values

## Result

The portfolio's section transitions now feel more deliberate and premium through:
1. Slower animation duration (0.66s vs 0.5s)
2. Heavier easing curve with weighted deceleration
3. Greater visual travel distance for increased perceived mass
