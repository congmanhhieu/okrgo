# Design System Strategy: The Organic Precision

## 1. Overview & Creative North Star
The "Organic Precision" is the creative north star for this design system. We are moving away from high-contrast multi-color schemes to create a feeling of **Clarity, Trust, and Professional Growth**. 

To achieve a high-end minimalist feel, we reject visual clutter. This design system utilizes **Spatial Breathing**—where generous white space defines importance—and **Accent Focus**, where our signature green (#00b24e) acts as the singular pulse for action. We aren't just tracking goals; we are creating a focused environment where objectives become inevitable. The vibe is clinical yet alive, balancing the stillness of a premium workspace with the energy of a successful "done" state.

---

## 2. Colors & Surface Philosophy
Our palette is anchored in a monochromatic base to ensure the primary green remains the absolute hero of the interface.

### The Palette
* **Primary (#00b24e):** Our "Growth Green." Used strictly for primary calls to action, active states, and success indicators.
* **On-Surface (#111827):** "Ink Black." A deep, sophisticated navy-black used for headlines to provide maximum authority.
* **Neutral (#6b7280):** "Slate Grey." Used for body text and secondary information to maintain a calm visual hierarchy.
* **Surface Tiers:** We utilize `surface-base` (#ffffff) for the main canvas and `surface-subtle` (#f9fafb) for structural elements like sidebars.

### The "Invisible Boundary" Rule
**Explicit Instruction:** Do not use 1px solid lines to separate sections. Sectioning must be achieved through:
1.  **Background Shifts:** Transitioning from `surface-base` (#ffffff) to `surface-subtle` (#f9fafb).
2.  **Negative Space:** Using a strict 8px/16px/32px/64px spacing rhythm to define boundaries.
3.  **Tonal Stacking:** Placing a white card on a light grey background to imply depth without strokes.

### The "Eco-Clean" Rule
To maintain a "premium" feel, avoid heavy gradients or textures. Hero sections should remain clean white or very light grey. Floating navigation elements should utilize a "Glassmorphism Lite" effect: 80% opacity on the surface color with a 12px backdrop blur, ensuring the UI feels integrated and lightweight.

---

## 3. Typography: Minimalist Authority
We utilize a clean, geometric Sans-serif stack (such as **Inter** or **Satoshi**) to create a modern, high-contrast hierarchy.

* **Display & Headlines:** These are the "Statement" of the system. We use tight letter-spacing (-0.01em) and `Semibold` weights in `Ink Black` to make goals feel definitive.
* **Body & Labels:** These are the "Information." We prioritize legibility and breathability, using `Slate Grey` to keep the interface from feeling "heavy."
* **The Data Scale:** Use large, bold typography for OKR percentages (e.g., 75%). The contrast between a large number and a small description is what creates the "modern dashboard" impact.

---

## 4. Elevation & Depth: The Layering Principle
We do not use heavy shadows; we use subtle light elevation to imply physics.

* **Flat Elevation:** For a management card, use a 1px border of `#f3f4f6` (almost invisible) or no border at all.
* **Ambient Shadows:** When an element must "float" (e.g., a dropdown), use a shadow with a 24px blur and 3% opacity. This mimics a clean, studio-lit environment rather than a digital "drop shadow."
* **The Active Edge:** Instead of highlighting a whole card in green, use a 3px vertical "accent bar" on the left edge of an active element.

---

## 5. Components

### Buttons
* **Primary (Growth Green):** Filled with `#00b24e`, using white text. 6px or 8px rounded corners for a sharp, modern look.
* **Secondary:** No fill; 1px border of `#e5e7eb` with `Ink Black` text.
* **Tertiary (Ghost):** No fill; `Slate Grey` text. Used for secondary actions like "View History."

### Cards: The Goal Primitive
* **Architecture:** No borders. Use `surface-base` (#ffffff).
* **Progress Bars:** Background bar in `#f3f4f6`. Progress fill in `#00b24e`. Keep the height slim (4px to 6px) for an editorial feel.
* **Interactive State:** On hover, a card should have a very subtle lift or a slight change in background color to `#f9fafb`.

### Inputs & Search
* **Search Bar:** A clean, rectangular container with a subtle `#f3f4f6` background.
* **Focus State:** Instead of a heavy border, the outline shifts to `#00b24e` with a 1px thickness.

### Selection Chips
* **Unselected:** `surface-subtle` background with `Slate Grey` text.
* **Selected:** `Growth Green` background with white text. No borders.

---

## 6. Do’s and Don'ts

### Do:
* **Do** use extreme whitespace. If a layout feels "okay," add 20% more padding.
* **Do** keep icons outlined and thin (1.5px stroke).
* **Do** use the `#00b24e` green as a "reward" color—only show it when something is progressing or requires action.

### Don't:
* **Don't** use 1px grey lines to separate content unless absolutely necessary for accessibility.
* **Don't** use pure black (#000000). Always use `Ink Black` (#111827) for a softer, more premium look.
* **Don't** use green for decorative elements. It must remain a "functional" color that signals status or action.