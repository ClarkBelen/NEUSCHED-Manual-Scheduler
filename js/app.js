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

let row;
const APP = {
  data: [],
  init() {
    APP.addListeners();
  },
  addListeners() {
    const form = document.querySelector('#collect form');
    form.addEventListener('submit', APP.saveData);

    document.querySelector('#btnCancel').addEventListener('click', APP.clearInputField);

    document.querySelector('table tbody').addEventListener('click', (ev) => {
      const rowIndex = ev.target.closest('tr').getAttribute('data-row');
      row = rowIndex;
      if (APP.isEditing && (ev.target.id === 'edit' || ev.target.id === 'delete')) {
        alert("You are currently editing a schedule row. Please save it first!");
        document.getElementById('sCode').focus();
        return; // Prevent form submission
      } else {
        if (ev.target.classList.contains('btn-info')||ev.target.classList.contains('glyphicon-edit')) {
          APP.editRow(rowIndex);
        } else if (ev.target.classList.contains('btn-danger')||ev.target.classList.contains('glyphicon-trash')) {
          APP.deleteRow(rowIndex);
        }
      }  
    });

    document
      .getElementById('btnExport')
      .addEventListener('click', APP.exportData);
  },
  clearInputField() {
    if(APP.isEditing){
        APP.isEditing = false; // Reset the flag
        document.querySelector(`tbody tr[data-row="${row}"]`).classList.remove('bg-info');
        document.getElementById('manual-form').reset();
    }else{
        document.getElementById('manual-form').reset();
    }
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
    console.log(checkboxes.values());

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
        .map(checkbox => checkbox.nextElementSibling.textContent.trim())
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
    //focus on first field
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
    tr.innerHTML += `<td><span class="glyphicon glyphicon-edit btn btn-info btn-sm" style="margin:2px;" id="edit" data-toggle="tooltip" data-placement="top" title="Edit"></span>
    <span class="glyphicon glyphicon-trash btn btn-danger btn-sm" id="delete" data-toggle="tooltip" data-placement="top" title="Delete"></span></td>`;
    tbody.append(tr);
    },
  
  editRow(rowIndex) {
    APP.isEditing = true; // Set the flag to indicate an edit operation
    APP.editingRowIndex = rowIndex; // Store the row index being edited
    const row = document.querySelector(`tbody tr[data-row="${rowIndex}"]`);
    const data = APP.data[rowIndex];
   
    row.classList.add('bg-info');

    // Populate the form with the row data
    document.getElementById('sCode').value = data[0];
    document.getElementById('sName').value = data[1];
   
    // Handle checkboxes
    const days = data[2].split(','); // Assuming the days are stored as a comma-separated string
    document.querySelectorAll('#schedDays input[type="checkbox"]').forEach(checkbox => {
       checkbox.checked = days.includes(checkbox.nextElementSibling.textContent.trim());
    });
   
    // Handle other inputs similarly
    document.getElementById('startTime').value = data[3];
    document.getElementById('endTime').value = data[4];
    document.getElementById('description').value = data[5];
    document.getElementById('location').value = data[6];
   
    // Set the private event radio button

    if(data[7] === 'TRUE'){
      document.getElementById('privateYes').checked = true;
    }else{
      document.getElementById('privateNo').checked = true;
    }
    document.getElementById('sCode').focus();
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
     row.innerHTML +=  `<td><span class="glyphicon glyphicon-edit btn btn-info btn-sm" style="margin:2px;" id="edit" data-toggle="tooltip" data-placement="top" title="Edit"></span>
     <span class="glyphicon glyphicon-trash btn btn-danger btn-sm" id="delete" data-toggle="tooltip" data-placement="top" title="Delete"></span></td>`;

     document.querySelector(`tbody tr[data-row="${rowIndex}"]`).classList.remove('bg-info');
  },
  deleteRow(rowIndex) {
    const tbody = document.querySelector('#display > table > tbody');
    const row = document.querySelector(`tbody tr[data-row="${rowIndex}"]`);
    tbody.removeChild(row);
    APP.data.splice(rowIndex, 1); // Remove the row data from APP.data
   },   
};

document.addEventListener('DOMContentLoaded', APP.init);

// Example function to get URL parameters
function getUrlParameter(name) {
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Get the data string from the URL parameters
const dataString = getUrlParameter('data');
// Assuming dataString is a valid JSON string representing the parsed schedule data
try {
  const parsedData = JSON.parse(dataString);

  // Clear the current table content
  const tbody = document.querySelector('#display > table > tbody');
  tbody.innerHTML = '';

  // Populate the table with the parsed data
  parsedData.forEach(item => {
    const tr = document.createElement('tr');
    Object.keys(item).forEach(key => {
      const td = document.createElement('td');
      td.innerText = item[key];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
} catch (error) {
  console.error('Error parsing data:', error);
}
