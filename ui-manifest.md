# UI Engineering Philosophy

This project strictly follows a brutalist, high-density, utilitarian design language. It is a functional technical tool, not a consumer web app. 

**Strictly Forbidden (The "AI Slop" Ban List):**
*   No glassmorphism or background blurs.
*   No gradients of any kind.
*   No soft drop shadows (`box-shadow` is only permitted for hard, solid offsets).
*   No rounded corners greater than `2px`.
*   No pastel or low-contrast Tailwind defaults (e.g., `slate-50`, `blue-400`).
*   No excessive padding (avoid anything over `1.5rem` or `24px` for structural elements).

**Required Standards:**
*   **Typography:** System fonts, monospace for data/input, or highly opinionated serifs. No Inter, Roboto, or standard sans-serifs.
*   **Borders:** Use hard, high-contrast borders (`1px solid #000` or `#111`) to delineate layout sections.
*   **Colors:** Pure black text (`#000`), pure white or slightly off-white backgrounds (`#FAFAFA`), and single solid primary colors for actions.
*   **Layouts:** Favor asymmetrical, left-aligned, dense structures over perfectly centered, floating symmetrical cards.