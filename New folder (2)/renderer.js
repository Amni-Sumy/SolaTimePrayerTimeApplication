
document.addEventListener('DOMContentLoaded', () => {
  const itemInput = document.getElementById('itemInput');
  const addButton = document.getElementById('addButton');
  const itemList = document.getElementById('itemList');

  let items = [];

  function renderItems() {
    itemList.innerHTML = '';
    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item + ' ';

      const updateButton = document.createElement('button');
      updateButton.textContent = 'Update';
      updateButton.onclick = () => updateItem(index);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => deleteItem(index);

      li.appendChild(updateButton);
      li.appendChild(deleteButton);
      itemList.appendChild(li);
    });
  }

  function addItem() {
    const newItem = itemInput.value.trim();
    if (newItem) {
      items.push(newItem);
      itemInput.value = '';
      renderItems();
    }
  }

  // 👇 Replaces prompt(), works inside Electron
  function updateItem(index) {
    const li = itemList.children[index];
    const currentText = items[index];

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.onclick = () => {
      const updatedItem = input.value.trim();
      if (updatedItem) {
        items[index] = updatedItem;
        renderItems();
      }
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = renderItems;

    li.innerHTML = '';
    li.appendChild(input);
    li.appendChild(saveButton);
    li.appendChild(cancelButton);
  }

  function deleteItem(index) {
    items.splice(index, 1);
    renderItems();
  }

  addButton.addEventListener('click', addItem);
});