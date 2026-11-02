// common.js - small helper functions used by both pages

// Read the reminders list from Local Storage.
// If nothing is saved yet (or the data is broken), return an empty list.
function loadReminders() {
  const text = localStorage.getItem("reminders");
  if (text === null) {
    return [];
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return [];
  }
}

// Save the reminders list to Local Storage (as text).
function saveReminders(list) {
  localStorage.setItem("reminders", JSON.stringify(list));
}

// Show a message inside an element. Red if it is an error, green if not.
function showMessage(elementId, text, isError) {
  const box = document.getElementById(elementId);
  box.textContent = text;
  if (isError) {
    box.className = "message error";
  } else {
    box.className = "message success";
  }
}
