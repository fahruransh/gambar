import "./styles.css";
import { isSupportedImage, normalizeImageFile } from "./image-utils.js";
import {
  formatIndonesianDate,
  groupIntoRows,
  normalizeColumnCount,
} from "./report-utils.js";
import { canExport, moveItem, removeItemById } from "./report-state.js";

const elements = {
  clearReport: document.querySelector("#clear-report"),
  columnBadge: document.querySelector("#column-badge"),
  columnCount: document.querySelector("#column-count"),
  downloadExcel: document.querySelector("#download-excel"),
  downloadWord: document.querySelector("#download-word"),
  dropZone: document.querySelector("#drop-zone"),
  emptyPreview: document.querySelector("#empty-preview"),
  photoCount: document.querySelector("#photo-count"),
  photoInput: document.querySelector("#photo-input"),
  photoList: document.querySelector("#photo-list"),
  photoPanel: document.querySelector("#photo-panel"),
  reportBody: document.querySelector("#report-body"),
  reportColumns: document.querySelector("#report-columns"),
  reportDate: document.querySelector("#report-date"),
  reportTable: document.querySelector("#report-table"),
  reportTitleCell: document.querySelector("#report-title-cell"),
  statusMessage: document.querySelector("#status-message"),
  tableScroll: document.querySelector("#table-scroll"),
};

const state = {
  date: getTodayIso(),
  images: [],
  columns: 4,
  busy: false,
};

let dragDepth = 0;

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
  elements.photoInput.disabled = busy;
  elements.reportDate.disabled = busy;
  elements.columnCount.disabled = busy;
  elements.dropZone.classList.toggle("is-busy", busy);
  if (message) setStatus(message, busy ? "working" : "neutral");
  render();
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

function moveImage(id, offset) {
  state.images = moveItem(state.images, id, offset);
  render();
  setStatus("Urutan foto diperbarui.", "success");
}

function removeImage(id) {
  const selected = state.images.find((image) => image.id === id);
  if (selected) URL.revokeObjectURL(selected.dataUrl);
  state.images = removeItemById(state.images, id);
  render();
  setStatus("Foto dihapus dari laporan.", "success");
}

function renderPhotoList() {
  const fragment = document.createDocumentFragment();

  state.images.forEach((image, index) => {
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
        () => moveImage(image.id, -1),
        index === 0,
      ),
      createActionButton(
        `Pindahkan ${image.name} ke kanan`,
        "→",
        () => moveImage(image.id, 1),
        index === state.images.length - 1,
      ),
      createActionButton(
        `Hapus ${image.name}`,
        "×",
        () => removeImage(image.id),
        false,
        true,
      ),
    );

    card.append(preview, number, info, actions);
    fragment.append(card);
  });

  elements.photoList.replaceChildren(fragment);
}

function renderPreview() {
  elements.reportTitleCell.textContent = formatIndonesianDate(state.date);
  elements.reportTitleCell.colSpan = state.columns;
  elements.columnBadge.textContent = `${state.columns} kolom`;
  elements.reportTable.dataset.columns = String(state.columns);

  const columnFragment = document.createDocumentFragment();
  for (let index = 0; index < state.columns; index += 1) {
    const column = document.createElement("col");
    column.style.width = `${100 / state.columns}%`;
    columnFragment.append(column);
  }
  elements.reportColumns.replaceChildren(columnFragment);

  const fragment = document.createDocumentFragment();

  groupIntoRows(state.images, state.columns).forEach((row, rowIndex) => {
    const tableRow = document.createElement("tr");
    row.forEach((image, columnIndex) => {
      const cell = document.createElement("td");
      if (image) {
        const picture = document.createElement("img");
        picture.src = image.dataUrl;
        picture.alt = `Foto sampah ${rowIndex * state.columns + columnIndex + 1}`;
        cell.append(picture);
      } else {
        cell.className = "empty-cell";
        cell.setAttribute("aria-label", "Sel kosong");
      }
      tableRow.append(cell);
    });
    fragment.append(tableRow);
  });

  elements.reportBody.replaceChildren(fragment);
}

function render() {
  const hasImages = state.images.length > 0;
  const ready = canExport(state);

  elements.photoCount.textContent = String(state.images.length);
  elements.photoPanel.hidden = !hasImages;
  elements.emptyPreview.hidden = hasImages;
  elements.tableScroll.hidden = !hasImages;
  elements.downloadWord.disabled = !ready;
  elements.downloadExcel.disabled = !ready;
  elements.clearReport.disabled = state.busy;

  renderPhotoList();
  renderPreview();
}

async function addFiles(fileList) {
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

  state.images.push(...completed);
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

function clearReport() {
  if (!state.images.length) return;
  if (!window.confirm("Hapus semua foto dari laporan ini?")) return;

  state.images.forEach((image) => URL.revokeObjectURL(image.dataUrl));
  state.images = [];
  elements.photoInput.value = "";
  render();
  setStatus("Semua foto telah dihapus. Tanggal laporan tetap tersimpan.", "success");
}

async function runExport(format) {
  if (!canExport(state)) return;

  const label = format === "word" ? "Word" : "Excel";
  setBusy(true, `Membuat file ${label}…`);
  try {
    const report = { date: state.date, images: state.images, columns: state.columns };
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

elements.reportDate.value = state.date;
elements.columnCount.value = String(state.columns);
elements.reportDate.addEventListener("change", (event) => {
  state.date = event.currentTarget.value;
  render();
  setStatus(
    state.date ? `Tanggal diubah menjadi ${formatIndonesianDate(state.date)}.` : "Pilih tanggal laporan.",
    state.date ? "success" : "warning",
  );
});

elements.columnCount.addEventListener("change", (event) => {
  state.columns = normalizeColumnCount(event.currentTarget.value);
  event.currentTarget.value = String(state.columns);
  render();
  setStatus(`Tabel diubah menjadi ${state.columns} kolom.`, "success");
});

elements.photoInput.addEventListener("change", async (event) => {
  await addFiles(event.currentTarget.files);
  event.currentTarget.value = "";
});

elements.clearReport.addEventListener("click", clearReport);
elements.downloadWord.addEventListener("click", () => runExport("word"));
elements.downloadExcel.addEventListener("click", () => runExport("excel"));

elements.dropZone.addEventListener("dragenter", (event) => {
  event.preventDefault();
  dragDepth += 1;
  elements.dropZone.classList.add("is-dragging");
});

elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});

elements.dropZone.addEventListener("dragleave", (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) elements.dropZone.classList.remove("is-dragging");
});

elements.dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dragDepth = 0;
  elements.dropZone.classList.remove("is-dragging");
  if (!state.busy) await addFiles(event.dataTransfer.files);
});

window.addEventListener("beforeunload", () => {
  state.images.forEach((image) => URL.revokeObjectURL(image.dataUrl));
});

render();
