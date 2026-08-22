import "./styles.css";
import { isSupportedImage, normalizeImageFile } from "./image-utils.js";
import {
  formatIndonesianDate,
  formatReportTitle,
  getReportType,
  groupIntoRows,
  normalizeColumnCount,
  normalizeReportType,
} from "./report-utils.js";
import {
  addBlock,
  canExportAll,
  createBlock,
  moveItem,
  removeBlock,
  removeItemById,
  updateBlock,
} from "./report-state.js";
import { enhanceSelects } from "./custom-select.js";

const elements = {
  columnCount: document.querySelector("#column-count"),
  columnBadge: document.querySelector("#column-badge"),
  blocks: document.querySelector("#blocks"),
  blocksCount: document.querySelector("#blocks-count"),
  addBlock: document.querySelector("#add-block"),
  emptyPreview: document.querySelector("#empty-preview"),
  previewBlocks: document.querySelector("#preview-blocks"),
  downloadExcel: document.querySelector("#download-excel"),
  downloadWord: document.querySelector("#download-word"),
  statusMessage: document.querySelector("#status-message"),
};

const blockTemplate = document.querySelector("#block-template");

const state = {
  columns: 4,
  blocks: [createBlock({ date: getTodayIso() })],
  busy: false,
};

// Per-block transient UI state (drag depth) keyed by block id.
const dragDepthByBlock = new Map();

function getTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setStatus(message, tone = "neutral") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.tone = tone;
}

function setBusy(busy, message = "") {
  state.busy = busy;
  elements.columnCount.disabled = busy;
  elements.addBlock.disabled = busy;
  if (message) setStatus(message, busy ? "working" : "neutral");
  render();
}

function findBlock(id) {
  return state.blocks.find((block) => block.id === id);
}

function blockSummary(block) {
  const typeLabel = getReportType(block.reportType).label.replace("Laporan ", "");
  const dateLabel = block.date ? formatIndonesianDate(block.date) : "Tanggal belum dipilih";
  const shortDate = block.date
    ? dateLabel.replace(/^[^,]+,\s*/, "").replace(/\s\d{4}$/, "")
    : dateLabel;
  return `${typeLabel} • ${shortDate} • ${block.images.length} foto`;
}


function createActionButton(label, symbol, onClick, disabled = false, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `photo-action${danger ? " photo-action--danger" : ""}`;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = symbol;
  button.disabled = disabled || state.busy;
  button.addEventListener("click", onClick);
  return button;
}

function moveImage(blockId, imageId, offset) {
  const block = findBlock(blockId);
  if (!block) return;
  const nextImages = moveItem(block.images, imageId, offset);
  state.blocks = updateBlock(state.blocks, blockId, { images: nextImages });
  render();
  setStatus("Urutan foto diperbarui.", "success");
}

function removeImage(blockId, imageId) {
  const block = findBlock(blockId);
  if (!block) return;
  const selected = block.images.find((image) => image.id === imageId);
  if (selected) URL.revokeObjectURL(selected.dataUrl);
  const nextImages = removeItemById(block.images, imageId);
  state.blocks = updateBlock(state.blocks, blockId, { images: nextImages });
  render();
  setStatus("Foto dihapus dari laporan.", "success");
}

function clearBlock(blockId) {
  const block = findBlock(blockId);
  if (!block || !block.images.length) return;
  if (!window.confirm("Hapus semua foto dari laporan ini?")) return;
  block.images.forEach((image) => URL.revokeObjectURL(image.dataUrl));
  state.blocks = updateBlock(state.blocks, blockId, { images: [] });
  render();
  setStatus("Semua foto pada laporan ini telah dihapus.", "success");
}

async function addFiles(blockId, fileList) {
  const block = findBlock(blockId);
  if (!block) return;
  const files = [...fileList];
  if (files.length === 0) return;

  const validFiles = files.filter(isSupportedImage);
  const invalidCount = files.length - validFiles.length;

  if (validFiles.length === 0) {
    setStatus(
      "Tidak ada gambar yang dapat dipakai. Pilih JPG, PNG, atau WebP maksimal 25 MB.",
      "error",
    );
    return;
  }

  setBusy(true, `Memproses ${validFiles.length} foto…`);
  const results = await Promise.allSettled(validFiles.map(normalizeImageFile));
  const completed = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const failedCount =
    invalidCount + results.filter((result) => result.status === "rejected").length;

  // Re-read the block in case state changed while awaiting.
  const current = findBlock(blockId);
  if (current) {
    state.blocks = updateBlock(state.blocks, blockId, {
      images: [...current.images, ...completed],
    });
  }
  setBusy(false);

  if (failedCount > 0) {
    setStatus(
      `${completed.length} foto ditambahkan, ${failedCount} file dilewati.`,
      completed.length ? "warning" : "error",
    );
  } else {
    setStatus(`${completed.length} foto ditambahkan. Semua siap disusun.`, "success");
  }
}

function addNewBlock() {
  const previous = state.blocks[state.blocks.length - 1];
  const block = createBlock({
    date: getTodayIso(),
    reportType: previous ? previous.reportType : "waste",
  });
  state.blocks = addBlock(state.blocks, block);
  render();
  setStatus("Laporan baru ditambahkan. Isi tanggal dan fotonya.", "success");
}

function deleteBlock(blockId) {
  if (state.blocks.length <= 1) return;
  const block = findBlock(blockId);
  if (block) block.images.forEach((image) => URL.revokeObjectURL(image.dataUrl));
  dragDepthByBlock.delete(blockId);
  state.blocks = removeBlock(state.blocks, blockId);
  render();
  setStatus("Laporan dihapus.", "success");
}

function renderPhotoListInto(container, block) {
  const fragment = document.createDocumentFragment();

  block.images.forEach((image, index) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    const preview = document.createElement("img");
    preview.src = image.dataUrl;
    preview.alt = `Foto ${index + 1}: ${image.name}`;

    const number = document.createElement("span");
    number.className = "photo-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const info = document.createElement("div");
    info.className = "photo-info";
    const name = document.createElement("strong");
    name.textContent = image.name;
    const dimensions = document.createElement("small");
    dimensions.textContent = `${image.width} × ${image.height} px`;
    info.append(name, dimensions);

    const actions = document.createElement("div");
    actions.className = "photo-actions";
    actions.append(
      createActionButton(
        `Pindahkan ${image.name} ke kiri`,
        "←",
        () => moveImage(block.id, image.id, -1),
        index === 0,
      ),
      createActionButton(
        `Pindahkan ${image.name} ke kanan`,
        "→",
        () => moveImage(block.id, image.id, 1),
        index === block.images.length - 1,
      ),
      createActionButton(
        `Hapus ${image.name}`,
        "×",
        () => removeImage(block.id, image.id),
        false,
        true,
      ),
    );

    card.append(preview, number, info, actions);
    fragment.append(card);
  });

  container.replaceChildren(fragment);
}

function buildBlockCard(block, index) {
  const node = blockTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.blockId = block.id;

  const indexLabel = node.querySelector(".block-card__index");
  indexLabel.textContent = `Laporan ${index + 1}`;
  node.querySelector(".block-card__summary").textContent = blockSummary(block);

  const removeButton = node.querySelector("[data-remove]");
  removeButton.hidden = state.blocks.length <= 1;
  removeButton.disabled = state.busy;
  removeButton.addEventListener("click", () => deleteBlock(block.id));

  const typeSelect = node.querySelector("[data-report-type]");
  typeSelect.value = block.reportType;
  typeSelect.disabled = state.busy;
  typeSelect.addEventListener("change", (event) => {
    const reportType = normalizeReportType(event.currentTarget.value);
    event.currentTarget.value = reportType;
    state.blocks = updateBlock(state.blocks, block.id, { reportType });
    render();
    setStatus("Jenis laporan diperbarui.", "success");
  });

  const dateInput = node.querySelector("[data-report-date]");
  dateInput.value = block.date;
  dateInput.disabled = state.busy;
  dateInput.addEventListener("change", (event) => {
    const date = event.currentTarget.value;
    state.blocks = updateBlock(state.blocks, block.id, { date });
    render();
    setStatus(
      date ? `Tanggal diubah menjadi ${formatIndonesianDate(date)}.` : "Pilih tanggal laporan.",
      date ? "success" : "warning",
    );
  });

  const dropZone = node.querySelector("[data-drop-zone]");
  dropZone.classList.toggle("is-busy", state.busy);
  const photoInput = node.querySelector("[data-photo-input]");
  photoInput.disabled = state.busy;
  photoInput.addEventListener("change", async (event) => {
    // Simpan referensi input sebelum `await`: `addFiles` memanggil render()
    // yang membangun ulang kartu blok, sehingga `event.currentTarget` sudah
    // bernilai null setelah promise selesai.
    const input = event.currentTarget;
    await addFiles(block.id, input.files);
    input.value = "";
  });

  dropZone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    const depth = (dragDepthByBlock.get(block.id) || 0) + 1;
    dragDepthByBlock.set(block.id, depth);
    dropZone.classList.add("is-dragging");
  });
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });
  dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    const depth = Math.max(0, (dragDepthByBlock.get(block.id) || 0) - 1);
    dragDepthByBlock.set(block.id, depth);
    if (depth === 0) dropZone.classList.remove("is-dragging");
  });
  dropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    dragDepthByBlock.set(block.id, 0);
    dropZone.classList.remove("is-dragging");
    if (!state.busy) await addFiles(block.id, event.dataTransfer.files);
  });

  const photosPanel = node.querySelector("[data-photos]");
  const hasImages = block.images.length > 0;
  photosPanel.hidden = !hasImages;
  node.querySelector("[data-photo-count]").textContent = String(block.images.length);
  const clearButton = node.querySelector("[data-clear]");
  clearButton.disabled = state.busy;
  clearButton.addEventListener("click", () => clearBlock(block.id));
  renderPhotoListInto(node.querySelector("[data-photo-list]"), block);

  return node;
}

function renderBlocks() {
  const fragment = document.createDocumentFragment();
  state.blocks.forEach((block, index) => {
    fragment.append(buildBlockCard(block, index));
  });
  elements.blocks.replaceChildren(fragment);
  enhanceSelects(elements.blocks);
  elements.blocksCount.textContent = `${state.blocks.length} laporan`;
}


function buildPreviewTable(block) {
  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";

  const table = document.createElement("table");
  table.className = "report-table";
  table.dataset.columns = String(state.columns);
  table.setAttribute("aria-label", "Pratinjau tabel laporan");

  const colgroup = document.createElement("colgroup");
  for (let index = 0; index < state.columns; index += 1) {
    const col = document.createElement("col");
    col.style.width = `${100 / state.columns}%`;
    colgroup.append(col);
  }

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const titleCell = document.createElement("th");
  titleCell.colSpan = state.columns;
  titleCell.textContent = formatReportTitle(block.reportType, block.date);
  headRow.append(titleCell);
  thead.append(headRow);

  const tbody = document.createElement("tbody");
  groupIntoRows(block.images, state.columns).forEach((row, rowIndex) => {
    const tableRow = document.createElement("tr");
    row.forEach((image, columnIndex) => {
      const cell = document.createElement("td");
      if (image) {
        const picture = document.createElement("img");
        picture.src = image.dataUrl;
        picture.alt = `Foto laporan ${rowIndex * state.columns + columnIndex + 1}`;
        cell.append(picture);
      } else {
        cell.className = "empty-cell";
        cell.setAttribute("aria-label", "Sel kosong");
      }
      tableRow.append(cell);
    });
    tbody.append(tableRow);
  });

  table.append(colgroup, thead, tbody);
  wrapper.append(table);
  return wrapper;
}

function renderPreview() {
  elements.columnBadge.textContent = `${state.columns} kolom`;
  const blocksWithImages = state.blocks.filter((block) => block.images.length > 0);
  const hasAnyImages = blocksWithImages.length > 0;

  elements.emptyPreview.hidden = hasAnyImages;
  elements.previewBlocks.hidden = !hasAnyImages;

  if (!hasAnyImages) {
    elements.previewBlocks.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();
  blocksWithImages.forEach((block) => {
    fragment.append(buildPreviewTable(block));
  });
  elements.previewBlocks.replaceChildren(fragment);
}

function render() {
  const ready = canExportAll(state);
  elements.downloadWord.disabled = !ready;
  elements.downloadExcel.disabled = !ready;
  elements.addBlock.disabled = state.busy;

  renderBlocks();
  renderPreview();
}

async function runExport(format) {
  if (!canExportAll(state)) return;

  const label = format === "word" ? "Word" : "Excel";
  setBusy(true, `Membuat file ${label}…`);
  try {
    const report = {
      columns: state.columns,
      blocks: state.blocks.map((block) => ({
        date: block.date,
        images: block.images,
        reportType: block.reportType,
      })),
    };
    if (format === "word") {
      const { downloadWordReport } = await import("./export-word.js");
      await downloadWordReport(report);
    } else {
      const { downloadExcelReport } = await import("./export-excel.js");
      await downloadExcelReport(report);
    }
    setStatus(`File ${label} berhasil dibuat dan mulai diunduh.`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`File ${label} gagal dibuat. Silakan coba lagi.`, "error");
  } finally {
    setBusy(false);
  }
}

elements.columnCount.value = String(state.columns);
enhanceSelects();

elements.columnCount.addEventListener("change", (event) => {
  state.columns = normalizeColumnCount(event.currentTarget.value);
  event.currentTarget.value = String(state.columns);
  render();
  setStatus(`Tabel diubah menjadi ${state.columns} kolom.`, "success");
});

elements.addBlock.addEventListener("click", addNewBlock);
elements.downloadWord.addEventListener("click", () => runExport("word"));
elements.downloadExcel.addEventListener("click", () => runExport("excel"));

window.addEventListener("beforeunload", () => {
  state.blocks.forEach((block) =>
    block.images.forEach((image) => URL.revokeObjectURL(image.dataUrl)),
  );
});

render();


