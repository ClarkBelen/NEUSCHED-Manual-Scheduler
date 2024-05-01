function getScheduleDataFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('data');
  if (encodedData) {
     return JSON.parse(atob(encodedData));
  }
  return null;
 }

 function populateAndSubmitForm(scheduleData) {
  // Assuming scheduleData is an array of objects
  scheduleData.forEach(data => {
     // Prepare the data for the table row
    const rowData = {
      subjectCode: data.subjectCode,
      subjectName: data.subjectName,
      schedDay: data.schedule.split(' ')[0], // Assuming 'schedule' is in the format 'Day StartTime-EndTime'
      startTime: convertTo24HourFormat(data.schedule.split(' ')[1].split('-')[0]),
      endTime: convertTo24HourFormat(data.schedule.split(' ')[1].split('-')[1]),
      description: data.subjectName + ' Class',
      location: data.sectionRoom,
      private: 'TRUE'
    };

     // Add the row to the table using the new function
     addScheduleRow(rowData);
  });
 }
 function addScheduleRow(scheduleData) {
  let table = document.querySelector('#display > table > tbody');
  let row = table.insertRow(-1); // Adding at the end
 
  // Correctly assign data to columns
  row.insertCell(0).textContent = scheduleData.subjectCode;
  row.insertCell(1).textContent = scheduleData.subjectName;
  row.insertCell(2).textContent = scheduleData.schedDay;
  row.insertCell(3).textContent = scheduleData.startTime;
  row.insertCell(4).textContent = scheduleData.endTime;
  row.insertCell(5).textContent = scheduleData.subjectName + ' Class'; // Description column should be empty
  row.insertCell(6).textContent = scheduleData.location;
  row.insertCell(7).textContent = scheduleData.private;
 
  // Add edit and delete buttons to the last column
  let actionCell = row.insertCell(-1);
  actionCell.innerHTML = `<span class="glyphicon glyphicon-edit btn btn-info btn-sm" style="margin:2px;" id="edit" data-toggle="tooltip" data-placement="top" title="Edit"></span>
  <span class="glyphicon glyphicon-trash btn btn-danger btn-sm" id="delete" data-toggle="tooltip" data-placement="top" title="Delete"></span>`;
 }
 
 
 // Convert time to 24-hour format if necessary
 function convertTo24HourFormat(time) {
    // Regular expression to match time formats
    // This regex matches:
    // - HH:MM AM/PM
    // - HH:MM:SS AM/PM
    // - HH:MM
    // - HH:MM:SS
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?(AM|PM)?$/i;
   
    // Check if the time matches the expected format
    const match = time.match(timeRegex);
    if (!match) {
       console.error('Invalid time format');
       return time; // Return the original time if it doesn't match
    }
   
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const seconds = match[3] || '00';
    const period = match[4] || '';
   
    // Convert hours to 24-hour format if period is specified
    if (period) {
       if (period.toUpperCase() === 'PM' && hours < 12) {
         hours += 12;
       } else if (period.toUpperCase() === 'AM' && hours === 12) {
         hours = 0;
       }
    }
   
    // Ensure hours are two digits
    hours = String(hours).padStart(2, '0');
   
    // Return the time in 24-hour format
    return `${hours}:${minutes}:${seconds}`;
   }
   
 
 // Call this function when the page loads
 document.addEventListener('DOMContentLoaded', () => {
  const scheduleData = getScheduleDataFromURL();
  if (scheduleData) {
     populateAndSubmitForm(scheduleData);
  }
 });

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
