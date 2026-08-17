# Date Input Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present each report date as a polished, accessible date control while preserving native calendar selection and existing report-state wiring.

**Architecture:** The report block template gains only presentational classes and a decorative calendar icon. CSS styles the date input and its wrapper, while the existing `data-report-date` attribute remains the single binding point for `src/main.js`.

**Tech Stack:** HTML template, CSS, Vitest, Vite.

## Global Constraints

- Retain `input type="date"`, `data-report-date`, its ISO value, and its existing `change` event flow.
- Do not add a date-picker dependency or custom date parsing.
- Preserve native calendar access on desktop and mobile.
- Match the existing green, rounded control system and retain visible keyboard focus.

---

### Task 1: Preserve Date Binding Contract

**Files:**
- Create: `src/date-input-template.test.js`
- Modify: `index.html:138-141`

**Interfaces:**
- Consumes: the report block template with `input[data-report-date]`.
- Produces: a styled date-control wrapper while retaining the exact input selector used by `src/main.js`.

- [ ] **Step 1: Write the failing test**

```js
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const template = await readFile(new URL("../index.html", import.meta.url), "utf8");

describe("report date template", () => {
  it("keeps the native date binding inside the styled control", () => {
    expect(template).toMatch(/class="date-control"[\\s\\S]*<input[\\s\\S]*type="date"[\\s\\S]*data-report-date/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/date-input-template.test.js`

Expected: FAIL because the `date-control` wrapper does not exist.

- [ ] **Step 3: Write minimal template implementation**

```html
<label class="field date-field">
  <span>Tanggal laporan</span>
  <span class="date-control">
    <input type="date" data-report-date required />
  </span>
</label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/date-input-template.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html src/date-input-template.test.js
git commit -m "test: protect report date template binding"
```

### Task 2: Style the Date Control

**Files:**
- Modify: `index.html:138-141`
- Modify: `src/styles.css:383-417`
- Test: `src/date-input-template.test.js`

**Interfaces:**
- Consumes: `.date-field > .date-control > input[data-report-date]` from Task 1.
- Produces: responsive date-control states for default, hover, focus-visible, and disabled input.

- [ ] **Step 1: Write the failing test**

```js
it("exposes the decorative date control classes", () => {
  expect(template).toContain('class="date-control__icon"');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/date-input-template.test.js`

Expected: FAIL because the calendar icon class does not exist.

- [ ] **Step 3: Write minimal CSS implementation**

```css
.date-control { position: relative; display: block; }
.date-control input[type="date"] { min-height: 54px; padding: 0 62px 0 16px; }
.date-control__icon { position: absolute; inset: 50% 10px auto auto; transform: translateY(-50%); }
.date-control:focus-within { box-shadow: 0 0 0 4px rgba(47, 116, 90, 0.18); }
```

Add the icon wrapper to the Task 1 template with this exact SVG:

```html
<span class="date-control__icon" aria-hidden="true">
  <svg viewBox="0 0 24 24"><path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
</span>
```

Use the existing color variables and maintain a visible focus outline. The native
calendar indicator remains available as an invisible clickable overlay in the
right-side icon area.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/date-input-template.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/date-input-template.test.js
git commit -m "feat: style native report date input"
```

### Task 3: Build and Visually Verify

**Files:**
- Verify: `dist/index.html`

**Interfaces:**
- Consumes: template and CSS from Tasks 1-2.
- Produces: deployable styling with all existing report behavior intact.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all test files pass, including `date-input-template.test.js`.

- [ ] **Step 2: Create production build**

Run: `npm run build`

Expected: Vite exits successfully and writes `dist/index.html` plus assets.

- [ ] **Step 3: Verify in a browser**

Run a Vite preview and capture the report date area at desktop width.

Expected: the field has rounded borders, a green calendar affordance, and a
visible focus state; clicking the icon area still opens the native date picker.

- [ ] **Step 4: Commit**

```bash
git add index.html src/styles.css src/date-input-template.test.js
git commit -m "feat: redesign report date control"
```
