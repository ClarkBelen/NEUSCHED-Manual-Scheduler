// Central initialization function
function initializeApp() {
  // Initialize APP object
  APP.init();

  // Get schedule data from URL and populate form
  const scheduleData = getScheduleDataFromURL();
  if (scheduleData) {
    populateAndSubmitForm(scheduleData);
  }
}

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
      // Split the schedule string into individual entries
      const scheduleEntries = data.schedule.split(',');
  
      // Extract days from the first entry (assuming all entries have the same time)
      const days = scheduleEntries.map(entry => entry.trim().split(' ')[0]).join(', ');
  
      // Extract the time from the first entry (assuming all entries have the same time)
      const [_, time] = scheduleEntries[0].trim().split(' ');
      const [startTime, endTime] = time.split('-');
  
      // Prepare the data for the table row
      const rowData = {
        sCode: data.subjectCode,
        sName: data.subjectName,
        schedDay: days, // Use the extracted days joined as a string
        startTime: convertTo24HourFormat(startTime),
        endTime: convertTo24HourFormat(endTime),
        description: data.subjectName + ' Class',
        location: data.sectionRoom,
        isPrivate: 'TRUE'
      };
  
      // Convert rowData to FormData for consistency with manual input
      const formData = new FormData();
      Object.keys(rowData).forEach(key => formData.append(key, rowData[key]));
  
      // Cache the data in APP.data
      APP.cacheData(formData);
  
      // Build the row in the table
      APP.buildRow(formData);
    });
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

    document.querySelector('table tbody').addEventListener('click', (ev) => {
      const rowIndex = +ev.target.closest('tr').getAttribute('data-row');
      if (ev.target.classList.contains('btn-info')||ev.target.classList.contains('glyphicon-edit')) {
        if (APP.isEditing) {
          alert("You are currently editing a schedule row. Please save it first!");
          document.getElementById('sCode').focus();
          return; // Prevent form submission
        }else{
          APP.editRow(rowIndex);
          row = rowIndex;
        }
      } else if (ev.target.classList.contains('btn-danger')||ev.target.classList.contains('glyphicon-trash')) {
        if (APP.isEditing) {
          alert("You are currently editing a schedule row. Please save it first!");
          document.getElementById('sCode').focus();
          return; // Prevent form submission
        }else{
          APP.deleteRow(rowIndex);
          
        }      
      }
    });

    document.querySelector('#btnCancel').addEventListener('click', APP.clearInputField);

  },
  clearInputField() {
    if(APP.isEditing){
        APP.isEditing = false; // Reset the flag
        document.querySelector(`tbody tr[data-row="${row}"]`).classList.remove('bg-info');
        document.getElementById('manual-form').reset();
    }else{
        document.getElementById('manual-form').reset();
    }

      setTimeout(function() {
        document.getElementById('sCode').focus();
    }, 0); // 0 milliseconds delay
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
  // Updated cacheData function
  cacheData(formdata, rowIndex) {
    // Create a structured object that includes the form data and the row index
    const data = {
      index: rowIndex,
      values: Array.from(formdata.values())
    };
  
    // If rowIndex is provided, update the existing data; otherwise, add new data
    if (rowIndex !== undefined) {
      APP.data[rowIndex] = data;
    } else {
      APP.data.push(data);
    }
  
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
    const data = APP.data[rowIndex].values;
   
    row.classList.add('bg-info');

    // Populate the form with the row data
    document.getElementById('sCode').value = data[0];
    document.getElementById('sName').value = data[1];
   
  // Handle checkboxes for days
    const days = data[2].split(',').map(day => day.trim()); // Split and trim the days string
    document.querySelectorAll('#schedDays input[type="checkbox"]').forEach(checkbox => {
        const dayLabel = checkbox.nextElementSibling.textContent.trim();
        checkbox.checked = days.includes(dayLabel); // Check if the day is in the days array
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
     APP.data[rowIndex].values = Array.from(formdata.values());
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

        // Update the data-row attributes of all rows that come after the deleted row
    document.querySelectorAll('tbody tr').forEach((tr, index) => {
      tr.setAttribute('data-row', index);
    });

    console.table(APP.data);
   },   
};

// Consolidate DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', initializeApp);
