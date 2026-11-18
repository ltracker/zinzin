// Autocomplétion accessible (motif ARIA « combobox » + « listbox »).
// Clavier : ↓/↑ pour parcourir, Entrée pour choisir, Échap pour fermer.

let uid = 0;

/**
 * @param {HTMLInputElement} input
 * @param {object} o
 * @param {(text: string) => Array<{label: string, value: any}>} o.source
 * @param {(item: {label: string, value: any}) => void} o.onSelect  appelé au choix d'une suggestion
 */
export function attachAutocomplete(input, { source, onSelect }) {
  const id = `ac-${++uid}`;
  const list = document.createElement('ul');
  list.id = id;
  list.className = 'ac-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  input.after(list);
  input.parentElement.classList.add('ac-wrap');

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', id);
  input.setAttribute('autocomplete', 'off');

  let items = [];
  let active = -1;

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function highlight(i) {
    active = i;
    [...list.children].forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
    if (i >= 0) {
      input.setAttribute('aria-activedescendant', `${id}-${i}`);
      list.children[i].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }

  function render() {
    items = source(input.value);
    list.replaceChildren(...items.map((it, i) => {
      const li = document.createElement('li');
      li.id = `${id}-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.textContent = it.label;
      li.addEventListener('mousedown', (e) => { e.preventDefault(); choose(i); });
      return li;
    }));
    const open = items.length > 0 && input.value.trim() !== '';
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    highlight(-1);
  }

  function choose(i) {
    const it = items[i];
    if (!it) return;
    input.value = it.label;
    close();
    onSelect?.(it);
  }

  input.addEventListener('input', render);
  input.addEventListener('focus', () => { if (input.value) render(); });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (list.hidden) render();
      if (items.length) highlight((active + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) highlight(active <= 0 ? items.length - 1 : active - 1);
    } else if (e.key === 'Enter' && !list.hidden && active >= 0) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      close();
    }
  });

  return { close, refresh: render };
}
