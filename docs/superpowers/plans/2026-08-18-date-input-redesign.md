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
- Modify: `index.html:138-141`

**Interfaces:**
- Consumes: the report block template with `input[data-report-date]`.
- Produces: a styled date-control wrapper while retaining the exact input selector used by `src/main.js`.

- [ ] **Step 1: Capture the failing visual baseline**

Run a Vite preview and capture the first report card with Chrome headless.

Expected: FAIL the visual acceptance check because the date input has a square,
browser-default calendar affordance instead of the application control style.

- [ ] **Step 2: Write minimal template implementation**

```html
<label class="field date-field">
  <span>Tanggal laporan</span>
  <span class="date-control">
    <input type="date" data-report-date required />
  </span>
</label>
```

- [ ] **Step 3: Confirm the binding contract**

Run: `npm test`

Expected: all existing report state and exporter tests pass; the `data-report-date`
attribute remains present for `src/main.js` to bind its existing `change` handler.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add report date control wrapper"
```

### Task 2: Style the Date Control

**Files:**
- Modify: `index.html:138-141`
- Modify: `src/styles.css:383-417`

**Interfaces:**
- Consumes: `.date-field > .date-control > input[data-report-date]` from Task 1.
- Produces: responsive date-control states for default, hover, focus-visible, and disabled input.

- [ ] **Step 1: Write minimal CSS implementation**

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

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: all tests pass while the existing date wiring is unchanged.

- [ ] **Step 3: Commit**

```bash
git add index.html src/styles.css
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

Expected: all existing test files pass.

- [ ] **Step 2: Create production build**

Run: `npm run build`

Expected: Vite exits successfully and writes `dist/index.html` plus assets.

- [ ] **Step 3: Verify in a browser**

Run a Vite preview and capture the report date area at desktop width.

Expected: the field has rounded borders, a green calendar affordance, and a
visible focus state; clicking the icon area still opens the native date picker.

- [ ] **Step 4: Commit**

```bash
git add index.html src/styles.css
git commit -m "feat: redesign report date control"
```
