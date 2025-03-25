import { loadCSS } from './aem.js';

const SECTION_SELECTOR = '.section';
const BLOCK_SELECTOR = '[data-block-name]';

const EDITABLES = [
  { selector: 'h1', nodeName: 'H1', label: 'Heading 1'},
  { selector: 'h2', nodeName: 'H2', label: 'Heading 2'},
  { selector: 'p', nodeName: 'P', label: 'Paragraph'},
  { selector: 'img', nodeName: 'IMG', label: 'Image'},
];
const EDITABLE_SELECTORS = EDITABLES.map((edit) => edit.selector).join(', ');

const label = document.createElement('div');
label.className = 'nx-label';

const overlay = document.createElement('div');
overlay.className = 'nx-overlay';

const editor = document.createElement('div');
editor.className = 'nx-editor';
overlay.append(editor, label);

document.body.append(overlay);

function handleEditable(editable) {
  const childEdits = editable.querySelectorAll(EDITABLE_SELECTORS);
  if (childEdits.length > 0) return;
  editable.dataset.edit = true;
  editable.addEventListener('click', (e) => {
    // If it's already editable, do nothing
    const isEditable = e.target.getAttribute('contenteditable');
    if (isEditable) return;

    // Turn off all other editables
    const prevEditables = document.body.querySelectorAll('[contenteditable]');
    prevEditables.forEach((prev) => { prev.removeAttribute('contenteditable'); });

    // Set the editable attr and set focus
    editable.setAttribute('contenteditable', true);
    setTimeout(() => { editable.focus(); }, 100);
  });
}

function getLabel(el) {
  if (el.dataset.blockName) return el.dataset.blockName;
  if (el.classList.contains('section')) return 'Section';
  console.log(el.nodeName);
  return EDITABLES.find((editable) => {
    console.log(editable.nodeName);
    return editable.nodeName === el.nodeName;
  })?.label;
}

function getTree(el) {
  const tree = [getLabel(el)];
  let traverse = el;
  while (traverse) {
    traverse = traverse.parentElement.closest('[data-edit]');
    if (!traverse) break;
    tree.push(getLabel(traverse));
  }
  return tree;
}

function setTree(tree) {
  const list = document.createElement('ul');
  tree.forEach((label) => {
    list.insertAdjacentHTML('beforeend', `<li>${label}</li>`);
  });
  label.append(list);
}

function handleSection(section) {
  section.addEventListener('mouseover', (e) => {

    // Attempt to resolve the editable
    const el = e.target.dataset.edit ? e.target : e.target.closest('[data-edit]');

    if (!el.dataset.edit) return;

    label.innerHTML = '';
    const tree = getTree(el);
    setTree(tree);

    const rect = el.getBoundingClientRect();

    const { scrollTop, scrollLeft } = document.documentElement;
    const top = (scrollTop + rect.top) - 6;
    const left = (scrollLeft + rect.left) - 6;

    // Position relative to the document
    editor.style = `
      left: ${left}px;
      top: ${top}px;
      width: ${rect.width}px;
      height: ${rect.height}px`;
    editor.classList.add('is-visible');
  });

  section.addEventListener('mouseout', (e) => {
    editor.style = '';
    label.innerHTML = '';
    editor.classList.remove('is-visible');
  });
}

(async function loadEdit() {
  await loadCSS('/styles/context.css');
  const els = document.body.querySelectorAll(`${SECTION_SELECTOR}, ${BLOCK_SELECTOR}, ${EDITABLE_SELECTORS}`);
  els.forEach((el) => {
    el.dataset.edit = true;
    handleSection(el);
  });

  const editables = document.body.querySelectorAll(EDITABLE_SELECTORS);
  editables.forEach((editable) => { handleEditable(editable); });
}());