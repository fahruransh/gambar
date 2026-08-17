/**
 * Progressive-enhancement custom dropdown.
 *
 * Keeps the original <select> in the DOM as the single source of truth (so
 * form state, existing change listeners, and tests stay untouched) but hides
 * it visually and renders an accessible button + listbox that we can fully
 * style. Selecting an option updates the native select and dispatches a
 * "change" event so the rest of the app reacts exactly as before.
 */

const CHEVRON_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6 9 6 6 6-6" />
  </svg>`;

const CHECK_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>`;

let idCounter = 0;

function enhanceSelect(select) {
  if (select.dataset.enhanced === "true") return;
  select.dataset.enhanced = "true";

  const wrapper = document.createElement("div");
  wrapper.className = "select";
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.classList.add("select__native");
  select.setAttribute("tabindex", "-1");
  select.setAttribute("aria-hidden", "true");

  idCounter += 1;
  const listId = `select-list-${idCounter}`;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "select__trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", listId);

  const valueLabel = document.createElement("span");
  valueLabel.className = "select__value";

  const chevron = document.createElement("span");
  chevron.className = "select__chevron";
  chevron.innerHTML = CHEVRON_SVG;

  trigger.append(valueLabel, chevron);

  const list = document.createElement("ul");
  list.className = "select__list";
  list.id = listId;
  list.setAttribute("role", "listbox");
  list.tabIndex = -1;
  list.hidden = true;

  const options = [...select.options];
  const optionEls = options.map((option, index) => {
    const item = document.createElement("li");
    item.className = "select__option";
    item.setAttribute("role", "option");
    item.dataset.value = option.value;
    item.id = `${listId}-opt-${index}`;

    const text = document.createElement("span");
    text.textContent = option.textContent;

    const check = document.createElement("span");
    check.className = "select__check";
    check.innerHTML = CHECK_SVG;

    item.append(text, check);
    item.addEventListener("click", () => {
      commit(option.value);
      close();
      trigger.focus();
    });
    return item;
  });
  list.append(...optionEls);

  wrapper.append(trigger, list);

  let activeIndex = Math.max(0, select.selectedIndex);

  function syncFromSelect() {
    const selected = options[select.selectedIndex] || options[0];
    valueLabel.textContent = selected ? selected.textContent : "";
    optionEls.forEach((el, index) => {
      const isSelected = index === select.selectedIndex;
      el.setAttribute("aria-selected", String(isSelected));
      el.classList.toggle("is-selected", isSelected);
    });
  }

  function setActive(index) {
    activeIndex = (index + optionEls.length) % optionEls.length;
    optionEls.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
    const activeEl = optionEls[activeIndex];
    if (activeEl) {
      list.setAttribute("aria-activedescendant", activeEl.id);
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }

  function open() {
    if (!list.hidden || select.disabled) return;
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    wrapper.classList.add("is-open");
    setActive(select.selectedIndex >= 0 ? select.selectedIndex : 0);
    list.focus();
    document.addEventListener("pointerdown", onOutsidePointer, true);
  }

  function close() {
    if (list.hidden) return;
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    wrapper.classList.remove("is-open");
    list.removeAttribute("aria-activedescendant");
    optionEls.forEach((el) => el.classList.remove("is-active"));
    document.removeEventListener("pointerdown", onOutsidePointer, true);
  }

  function toggle() {
    if (list.hidden) open();
    else close();
  }

  function commit(value) {
    if (select.disabled) return;
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    syncFromSelect();
  }

  function onOutsidePointer(event) {
    if (!wrapper.contains(event.target)) close();
  }

  trigger.addEventListener("click", () => {
    if (select.disabled) return;
    toggle();
  });

  trigger.addEventListener("keydown", (event) => {
    if (select.disabled) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });

  list.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(optionEls.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(options[activeIndex].value);
        close();
        trigger.focus();
        break;
      case "Escape":
        event.preventDefault();
        close();
        trigger.focus();
        break;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  });

  const observer = new MutationObserver(() => {
    trigger.disabled = select.disabled;
    wrapper.classList.toggle("is-disabled", select.disabled);
    if (select.disabled) close();
  });
  observer.observe(select, { attributes: true, attributeFilter: ["disabled"] });
  trigger.disabled = select.disabled;

  select.addEventListener("change", syncFromSelect);

  syncFromSelect();
}

export function enhanceSelects(root = document) {
  root.querySelectorAll("select[data-enhance]").forEach(enhanceSelect);
}

