function convertTo12HourFormat(time) {
  let [hours, minutes] = time.split(':');
  let period = 'AM';

  if (hours === '00') {
      hours = '12';
  } else if (hours === '12') {
      period = 'PM';
  } else if (hours > '12') {
      hours = String(Number(hours) - 12);
      period = 'PM';
  }

  return `${hours}:${minutes} ${period}`;
}
const APP = {
  data: [],
  init() {
    APP.addListeners();
  },
  addListeners() {
    const form = document.querySelector('#collect form');
    form.addEventListener('submit', APP.saveData);

    document.querySelector('#btnCancel').addEventListener('click', APP.clearInputField);

    // document
    //   .querySelector('table tbody')
    //   .addEventListener('dblclick', APP.editCell);

    document.querySelector('table tbody').addEventListener('click', (ev) => {
      const rowIndex = +ev.target.closest('tr').getAttribute('data-row');
      if (APP.isEditing) {
        alert("You are editing a row. Please save it first!");
        return; // Prevent form submission
      } else {
        if (ev.target.classList.contains('edit-btn')) {
          APP.editRow(rowIndex);
        } else if (ev.target.classList.contains('delete-btn')) {
          APP.deleteRow(rowIndex);
        }
      }  
    });

    document
      .getElementById('btnExport')
      .addEventListener('click', APP.exportData);
  },
  clearInputField() {
    document.getElementById('manual-form').reset();
  },
  saveData(ev) {
    ev.preventDefault();
    const form = ev.target;
    const formdata = new FormData(form);

    //Check if subject name is empty
    const subject = document.querySelector("#sName").value.trim();
    if(subject===""){
       alert('Subject name cannot be empty. Please enter subject name.');
       return;
    }

    // Check if at least one checkbox is checked
    const checkboxes = document.querySelectorAll('#schedDays input[type="checkbox"]');
    const isChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    if (!isChecked) {
        alert('Please select at least one schedule day.');
        return;
    }
    // Extract start and end times
    const startTime = formdata.get('startTime');
    const endTime = formdata.get('endTime');

    if (startTime > endTime) {
      alert("Start time cannot be greater than end time!");
      document.getElementById('startTime').focus();
      return; // Prevent form submission
  }

    // Extract the value of the checked days
    const checkedDays = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.nextSibling.textContent.trim())
        .join(',');

    // Update the formdata with the checked days
    formdata.set('schedDay', checkedDays);

    if (APP.isEditing) {
      // Update existing row
      APP.updateRow(formdata, APP.editingRowIndex);
      APP.isEditing = false; // Reset the flag
    } else {
      // Add new row
      APP.cacheData(formdata);
      const rowIndex = document.querySelectorAll('tbody tr').length - 1;
      APP.buildRow(formdata, rowIndex);
    }

    //clear the form
    form.reset();
    //focus on first name
    document.getElementById('sCode').focus();
  },
  cacheData(formdata) {
    //extract the data from the FormData object and update APP.data
    APP.data.push(Array.from(formdata.values()));
    console.table(APP.data);
  },
  buildRow(formdata) {
    const tbody = document.querySelector('#display > table > tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = '';
    tr.setAttribute('data-row', document.querySelectorAll('tbody tr').length);
    let col = 0;
    //loop through the FormData object entries and build a row with
    for (let entry of formdata.entries()) {
      if (entry[0] === 'startTime' || entry[0] === 'endTime') {
        entry[1] = convertTo12HourFormat(entry[1]);
    }
    tr.innerHTML += `<td data-col="${col}" data-name="${entry[0]}">${entry[1]}</td>`;
    col++;
    }
     // Add edit and delete buttons
    tr.innerHTML += `<td><button class="edit-btn"><span class="glyphicon glyphicon-edit"></span></button></td><td><button class="delete-btn"><span class="glyphicon glyphicon-trash"></span></button></td>`;
    tbody.append(tr);
    },
  
  editRow(rowIndex) {
    APP.isEditing = true; // Set the flag to indicate an edit operation
    APP.editingRowIndex = rowIndex; // Store the row index being edited
    const row = document.querySelector(`tbody tr[data-row="${rowIndex}"]`);
    const data = APP.data[rowIndex];
   
    row.classList.add('info');

    // Populate the form with the row data
    document.getElementById('sCode').value = data[0];
    document.getElementById('sName').value = data[1];
   
    // Handle checkboxes
    const days = data[2].split(','); // Assuming the days are stored as a comma-separated string
    document.querySelectorAll('#schedDays input[type="checkbox"]').forEach(checkbox => {
       checkbox.checked = days.includes(checkbox.nextSibling.textContent.trim());
    });
   
    // Handle other inputs similarly
    document.getElementById('startTime').value = data[3];
    document.getElementById('endTime').value = data[4];
    document.getElementById('description').value = data[5];
    document.getElementById('location').value = data[6];
   
    // Set the private event radio button
    const isPrivate = data[7] === 'true';
    document.getElementById('privateYes').checked = isPrivate;
    document.getElementById('privateNo').checked = !isPrivate;
  
  },
  updateRow(formdata, rowIndex) {
     // Update the existing row in APP.data
     APP.data[rowIndex] = Array.from(formdata.values());
     // Update the row in the table
     const row = document.querySelector(`tbody tr[data-row="${rowIndex}"]`);
     row.innerHTML = ''; // Clear the row
     let col = 0;
     for (let entry of formdata.entries()) {
      if (entry[0] === 'startTime' || entry[0] === 'endTime') {
        entry[1] = convertTo12HourFormat(entry[1]);
    }
    row.innerHTML += `<td data-col="${col}" data-name="${entry[0]}">${entry[1]}</td>`;
    col++;
     }
     // Add edit and delete buttons
     row.innerHTML += `<td><button class="edit-btn"><span class="glyphicon glyphicon-edit"></span></button></td><td><button class="delete-btn"><span class="glyphicon glyphicon-trash"></span></button></td>`;

     document.querySelector(`tbody tr[data-row="${rowIndex}"]`).classList.remove('info');
  },
  deleteRow(rowIndex) {
    const tbody = document.querySelector('#display > table > tbody');
    const row = document.querySelector(`tbody tr[data-row="${rowIndex}"]`);
    tbody.removeChild(row);
    APP.data.splice(rowIndex, 1); // Remove the row data from APP.data
   },   
};

document.addEventListener('DOMContentLoaded', APP.init);
