# Portrait and Dynamic Columns — Design Specification

## Purpose

Update the waste photo report website so the user can choose two, three, or four columns and receive matching portrait-oriented Word and Excel documents. The preview and both exports must always use the same selected column count.

## User Experience

A labeled `Jumlah kolom` selector appears with the report setup controls. It offers `2 kolom`, `3 kolom`, and `4 kolom`; four columns remains the default to preserve the current behavior. Changing the selection updates the preview immediately without removing or reordering any photos.

The existing fixed-column badge becomes dynamic and displays the active choice. On narrow screens, the preview may scroll horizontally, but its visual column count and proportions continue to represent the exported document.

## Shared Report State

The report state gains a numeric `columns` property restricted to 2, 3, or 4. The selected value is passed together with the date and ordered image records to both exporters. Shared row-grouping logic receives this value instead of relying on the existing four-column default.

Invalid or missing column values fall back to four columns at the user-interface boundary. Export builders validate the value before constructing a document so direct programmatic calls cannot produce irregular tables.

## Preview

The preview table rebuilds its `colgroup` so it contains exactly the selected number of equal-width columns. Each image row also contains exactly that many cells, including bordered blank cells used to complete the final row. Image numbering is calculated from the active column count rather than the previous hard-coded value of four. Preview image-cell heights are 360 pixels for two columns, 300 pixels for three columns, and 255 pixels for four columns.

## Word Export

Word output uses A4 portrait with 720-twip margins on every side. The available table width is fixed at 10,400 twips and divided evenly by the selected column count. The merged date heading spans the active number of columns, and the Word table grid contains the same number of equal-width entries.

Image row height adapts to the selected layout: two columns use 4,200-twip rows, three columns use 3,200-twip rows, and four columns use 2,600-twip rows. Every image is scaled proportionally to fit within its cell and is never cropped. Rows are prevented from splitting across pages, while additional rows flow naturally onto following portrait pages.

## Excel Export

Excel output uses A4 portrait and retains fit-to-one-page-width printing. The worksheet creates only the selected report columns, merges the heading from column A through the final active column, and sets the print area to the same range. Active columns use an identical width of 24 characters. Photo-row heights are 210 points for two columns, 170 points for three columns, and 150 points for four columns. Images remain anchored inside their cells with proportional sizing and padding.

No unused report columns receive borders or enter the print area. This ensures that a two-column report remains visually centered and does not print as a four-column sheet with empty space.

## Error Handling and Compatibility

The export buttons retain their existing readiness rules: a valid date, at least one photo, and no active processing. Changing the column count does not clear the report. Word and Excel filenames remain `laporan-sampah-YYYY-MM-DD.docx` and `.xlsx`.

All image input formats, upload limits, ordering controls, deletion behavior, and local-only processing remain unchanged.

## Verification

Automated tests cover row padding for two, three, and four columns; state validation; dynamic Word table grids and portrait page settings; dynamic Excel merges, print areas, image anchoring, and portrait page settings. Browser verification confirms that changing the selector updates the preview and that Word and Excel downloads preserve the chosen column count.

## Non-Goals

This change does not add one-column or five-column layouts, separate column settings for each export format, automatic column selection, landscape output, or persistent report settings after refresh.
