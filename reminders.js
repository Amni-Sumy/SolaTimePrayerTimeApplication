// reminders.js - Page 2 (My Reminders)
//
// This page does CRUD using Local Storage:
//   Create = add a new reminder with the form
//   Read   = show the list of reminders
//   Update = edit a reminder, or tick it as done
//   Delete = remove a reminder

// ---------- Page elements ----------
const form = document.getElementById("reminderForm");
const formTitle = document.getElementById("formTitle");
const titleInput = document.getElementById("titleInput");
const prayerSelect = document.getElementById("prayerSelect");
const noteInput = document.getElementById("noteInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const countText = document.getElementById("countText");
const reminderList = document.getElementById("reminderList");

// All reminders (loaded from Local Storage when the page opens)
let reminders = loadReminders();

// If this is null we are adding a new reminder.
// If it has an id, we are editing that reminder.
let editingId = null;


// =====================================================
// READ: show the list
// =====================================================
function showList() {
  reminderList.innerHTML = "";

  // Show how many reminders there are
  let doneCount = 0;
  for (const r of reminders) {
    if (r.done) {
      doneCount++;
    }
  }
  countText.textContent = reminders.length + " reminder(s), " + doneCount + " done";

  // Empty state
  if (reminders.length === 0) {
    reminderList.innerHTML = "<p>No reminders yet. Add one above, or open the Prayer Times page to get suggestions.</p>";
    return;
  }

  for (const r of reminders) {
    const li = document.createElement("li");
    li.className = "reminder";
    if (r.done) {
      li.className = "reminder done";
    }

    // Checkbox = mark as done (UPDATE)
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = r.done;
    checkbox.addEventListener("change", function () {
      toggleDone(r.id);
    });

    // Text part
    const info = document.createElement("div");
    info.className = "info";
    const title = document.createElement("strong");
    title.className = "title";
    title.textContent = r.title;
    if (r.source === "suggestion") {
      title.textContent = r.title + " (Suggestion)";
    }
    const detail = document.createElement("div");
    detail.textContent = "Time: " + r.prayer + (r.note ? " | " + r.note : "");
    if (r.source === "suggestion") {
      detail.textContent = "Time: " + r.prayer + " | Suggested on " + r.date + " | " + r.note;
    }
    info.appendChild(title);
    info.appendChild(detail);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      startEdit(r.id);
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      deleteReminder(r.id);
    });

    li.appendChild(checkbox);
    li.appendChild(info);
    // Suggestions can only be ticked as done. The user's own reminders can also be edited and deleted.
    if (r.source !== "suggestion") {
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
    }
    reminderList.appendChild(li);
  }
}


// =====================================================
// CREATE and UPDATE: when the form is submitted
// =====================================================
form.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the page from reloading

  const title = titleInput.value.trim();
  const prayer = prayerSelect.value;
  const note = noteInput.value.trim();

  // ----- Check the input (invalid input) -----
  if (title === "") {
    showMessage("formMessage", "Please enter the activity.", true);
    return;
  }
  if (title.length < 3) {
    showMessage("formMessage", "The activity is too short (minimum 3 characters).", true);
    return;
  }

  // Do not allow the same title + prayer time twice
  for (const r of reminders) {
    if (r.id !== editingId && r.title.toLowerCase() === title.toLowerCase() && r.prayer === prayer) {
      showMessage("formMessage", "This reminder already exists.", true);
      return;
    }
  }

  if (editingId === null) {
    // CREATE a new reminder
    reminders.push({
      id: Date.now(),      // a unique number
      title: title,
      prayer: prayer,
      note: note,
      done: false
    });
    showMessage("formMessage", "Reminder added.", false);
  } else {
    // UPDATE the reminder that is being edited
    for (const r of reminders) {
      if (r.id === editingId) {
        r.title = title;
        r.prayer = prayer;
        r.note = note;
      }
    }
    showMessage("formMessage", "Reminder updated.", false);
    resetForm(false);
  }

  saveReminders(reminders);
  form.reset();
  showList();
});


// =====================================================
// UPDATE: edit and tick as done
// =====================================================

// Put the reminder's data into the form so the user can change it
function startEdit(id) {
  for (const r of reminders) {
    if (r.id === id) {
      titleInput.value = r.title;
      prayerSelect.value = r.prayer;
      noteInput.value = r.note;
    }
  }
  editingId = id;
  formTitle.textContent = "Edit Reminder";
  saveBtn.textContent = "Save Changes";
  cancelBtn.className = "";      // show the cancel button
  window.scrollTo(0, 0);
}

// Go back to "Add" mode
function resetForm(clearMessage) {
  editingId = null;
  formTitle.textContent = "Add Reminder";
  saveBtn.textContent = "Add Reminder";
  cancelBtn.className = "hidden";
  if (clearMessage) {
    showMessage("formMessage", "", false);
    document.getElementById("formMessage").className = "message";
  }
}

cancelBtn.addEventListener("click", function () {
  form.reset();
  resetForm(true);
});

// Tick / untick "done"
function toggleDone(id) {
  for (const r of reminders) {
    if (r.id === id) {
      r.done = !r.done;
    }
  }
  saveReminders(reminders);
  showList();

  // Feedback for the user
  for (const r of reminders) {
    if (r.id === id) {
      if (r.done) {
        showMessage("listMessage", '"' + r.title + '" marked as done.', false);
      } else {
        showMessage("listMessage", '"' + r.title + '" marked as not done.', false);
      }
    }
  }
}


// =====================================================
// DELETE
// =====================================================
function deleteReminder(id) {
  // Ask the user first, so it is not deleted by mistake
  const sure = confirm("Delete this reminder?");
  if (sure === false) {
    return;
  }

  // Keep every reminder except the one with this id
  const remaining = [];
  for (const r of reminders) {
    if (r.id !== id) {
      remaining.push(r);
    }
  }
  reminders = remaining;
  saveReminders(reminders);

  // If we were editing the deleted reminder, reset the form
  if (editingId === id) {
    form.reset();
    resetForm(true);
  }
  showList();
  showMessage("listMessage", "Reminder deleted.", false);
}


// Start: show the list when the page opens
showList();
