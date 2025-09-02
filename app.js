(() => {
  const nameEl = document.getElementById('name');
  const dateEl = document.getElementById('exp');
  const addBtn = document.getElementById('addBtn');
  const list = document.getElementById('list');
  const emptyMsg = document.getElementById('emptyMsg');
  const tpl = document.getElementById('itemTemplate');

  /** @typedef {{id:string, name:string, date:string}} Item */
  /** @type {Item[]} */
  let items = [];

  // --- Persistence ---
  const STORAGE_KEY = 'syokukan.items.v1';
  function load(){
    try { items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { items = []; }
  }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

  // --- Utils ---
  const todayStart = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
  function diffInDays(dateStr){
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    const ms = d - todayStart();
    return Math.round(ms / (1000*60*60*24));
  }
  function sortItems(){ items.sort((a,b) => new Date(a.date) - new Date(b.date)); }

  function validateInputs(){
    const nameOk = nameEl.value.trim().length > 0;
    const dateOk = !!dateEl.value;
    addBtn.disabled = !(nameOk && dateOk);
  }

  function setRowStatus(row, dateStr){
    row.classList.remove('warn','danger');
    const days = diffInDays(dateStr);
    if (days < 0){ row.classList.add('danger'); row.title = 'Expired'; }
    else if (days <= 2){ row.classList.add('warn'); row.title = 'Expiring soon'; }
    else { row.title = ''; }
  }

  function render(){
    list.innerHTML = '';
    sortItems();
    if(items.length === 0){ emptyMsg.hidden = false; return; }
    emptyMsg.hidden = true;
    for(const it of items){
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.id = it.id;
      node.querySelector('.name').textContent = it.name;
      node.querySelector('.date').textContent = it.date;
      setRowStatus(node, it.date);
      // actions
      node.querySelector('.delete').addEventListener('click', () => remove(it.id));
      node.querySelector('.edit').addEventListener('click', () => beginEdit(node, it));
      list.appendChild(node);
    }
  }

  function add(){
    const name = nameEl.value.trim();
    const date = dateEl.value;
    if(!name || !date) return;
    items.push({ id: crypto.randomUUID(), name, date });
    save();
    nameEl.value = '';
    dateEl.value = '';
    validateInputs();
    render();
    nameEl.focus();
  }

  function remove(id){
    items = items.filter(x => x.id !== id);
    save();
    render();
  }

  function beginEdit(row, it){
    // Replace name/date display with inputs
    const nameCell = row.querySelector('.name');
    const dateCell = row.querySelector('.date');
    const actions = row.querySelector('.actions');

    const wrap = document.createElement('div');
    wrap.className = 'edit-wrap';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = it.name;
    nameInput.autocomplete = 'off';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = it.date;
    wrap.append(nameInput, dateInput);

    nameCell.replaceWith(wrap);
    dateCell.textContent = '';

    actions.innerHTML = '';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.textContent = 'Save';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = 'Cancel';
    actions.append(cancelBtn, saveBtn);

    const commit = () => {
      const newName = nameInput.value.trim();
      const newDate = dateInput.value;
      if(!newName || !newDate) return;
      it.name = newName; it.date = newDate;
      save();
      render();
    };

    saveBtn.addEventListener('click', commit);
    cancelBtn.addEventListener('click', render);
    nameInput.addEventListener('keydown', e => { if(e.key==='Enter') commit(); });
    dateInput.addEventListener('keydown', e => { if(e.key==='Enter') commit(); });
    nameInput.focus();
  }

  // --- Events ---
  addBtn.addEventListener('click', add);
  nameEl.addEventListener('keydown', e => { if(e.key==='Enter') add(); });
  dateEl.addEventListener('keydown', e => { if(e.key==='Enter') add(); });
  nameEl.addEventListener('input', validateInputs);
  dateEl.addEventListener('input', validateInputs);

  // periodic refresh to keep highlight accurate (e.g., midnight rollover)
  setInterval(() => { if(items.length) render(); }, 60*1000);

  // init
  load();
  render();
  validateInputs();

  // iOS Safari repaint workaround for date input initial short height
  window.addEventListener('load', () => {
  const exp = document.getElementById('exp');
  if (!exp) return;
  // Toggle display to force a layout pass
  exp.style.display = 'none';
  // Force reflow
  void exp.offsetHeight;
  exp.style.display = '';
});

})();
