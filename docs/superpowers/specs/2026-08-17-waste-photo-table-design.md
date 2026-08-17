# Waste Photo Table — Design Specification

## Purpose

Build a browser-based tool for arranging daily waste photographs into a fixed four-column table, then exporting the same structured report as both Microsoft Word (`.docx`) and Excel (`.xlsx`). The report must remain neat when opened in either application.

## Scope

The first version is a local-first, single-page website. It does not require an account, server, database, or cloud upload. Selected images remain in the browser and are only used to build previews and downloaded documents.

## User Flow

1. The user selects a report date.
2. The user selects or drops multiple JPG, PNG, or WebP images.
3. Images appear in upload order in a fixed four-column preview table.
4. The user can reorder or remove individual images.
5. The user downloads the result as Word or Excel.

## Interface

The page has a clear control area followed by the report preview. The control area contains the date picker, multi-file upload/drop zone, photo count, clear action, and Word/Excel download buttons. The preview contains one merged date header and a four-column image grid matching the supplied reference.

The date header uses Indonesian day and month names, for example `Senin, 10 Agustus 2026`. On narrow screens, the editing controls remain responsive while the report preview keeps its four-column structure and may scroll horizontally. This prevents the exported layout from being misrepresented.

Each preview cell has a fixed aspect ratio and displays its image with `object-fit: cover`. Empty cells complete the last row so table borders remain aligned. Reordering controls do not appear in exported files.

## Architecture

The app uses Vite with plain HTML, CSS, and modular JavaScript. A small in-memory state stores the selected date and ordered image records. Rendering, file intake, image processing, and document export are separated into focused modules.

- `state`: owns the selected date and ordered image list.
- `image-utils`: validates image types, corrects orientation through browser decoding, and produces export-ready image data.
- `preview`: renders the fixed grid and editing actions.
- `word-export`: creates a real `.docx` file with a four-column fixed-width table and embedded images.
- `excel-export`: creates a real `.xlsx` workbook with fixed column widths, fixed row heights, a merged date header, borders, and embedded images.

## Export Rules

### Word

The document uses a landscape page with controlled margins. The title row spans all four columns. Table layout is fixed, each column has the same width, image rows use exact heights, and every image is scaled proportionally to fit inside its cell. Borders are applied to every cell. If the photo count is not divisible by four, blank bordered cells complete the final row.

### Excel

The worksheet merges the first four columns for the title. Columns A–D use identical fixed widths and all image rows use identical fixed heights. Each photo is anchored inside a single cell with padding and proportional sizing. Every cell in the used report range has a thin border. The print area, landscape orientation, fit-to-page settings, and centered horizontal alignment are configured so the workbook also prints cleanly and can be copied into Word without irregular columns.

## Validation and Error Handling

Only JPG/JPEG, PNG, and WebP images are accepted. Invalid files are skipped and summarized in an inline message. Export buttons are disabled until both a date and at least one valid image exist. Export failures are reported without clearing the current report. Duplicate filenames are allowed because each selection is represented by its own image record.

## Accessibility

Inputs have visible labels, all actions are keyboard accessible, focus states are visible, status messages use a live region, and controls include textual labels rather than relying only on icons.

## Verification

Automated tests cover Indonesian date formatting, file validation, row grouping, and export sizing calculations. A production build must complete successfully. Manual verification covers multi-file selection, drag-and-drop, reordering, deletion, the four-column preview, and opening generated `.docx` and `.xlsx` files to confirm embedded images, merged date headings, borders, and stable dimensions.

## Explicit Non-Goals

This version does not persist reports after the page is refreshed, synchronize between devices, authenticate users, classify waste automatically, or upload photos to an external server.
