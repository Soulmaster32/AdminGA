document.addEventListener("DOMContentLoaded", () => {
    loadRecords();
});

function loadRecords() {
    const tableBody = document.getElementById("tableBody");
    const emptyMsg = document.getElementById("emptyMsg");
    
    // Clear current list
    tableBody.innerHTML = "";

    // 1. Get Data from Local Storage
    const registrants = JSON.parse(localStorage.getItem("registrants")) || [];

    // 2. Check if empty
    if (registrants.length === 0) {
        emptyMsg.style.display = "block";
        return;
    } else {
        emptyMsg.style.display = "none";
    }

    // 3. Loop through data and create rows
    // We reverse() so the newest entries appear at the top
    registrants.slice().reverse().forEach((person, index) => {
        
        // Format the date nicely
        const dateObj = new Date(person.date);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Construct Full Name
        const fullName = `${person.firstName} ${person.middleName ? person.middleName + ' ' : ''}${person.lastName}`;

        // Create Row
        const row = document.createElement("tr");

        row.innerHTML = `
            <td data-label="Name"><strong>${fullName}</strong></td>
            <td data-label="Dept">${person.dept}</td>
            <td data-label="Section">${person.section}</td>
            <td data-label="Date">${dateStr}</td>
            <td data-label="Signature">
                <img src="${person.signature}" class="sig-img" alt="Sig">
            </td>
            <td data-label="Action">
                <button onclick="deleteRecord('${person.id}')" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">✕ Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// --- DELETE FUNCTION ---
function deleteRecord(id) {
    if(!confirm("Are you sure you want to delete this record?")) return;

    let registrants = JSON.parse(localStorage.getItem("registrants")) || [];
    
    // Filter out the one with the matching ID
    registrants = registrants.filter(person => person.id !== id);
    
    // Save back to storage
    localStorage.setItem("registrants", JSON.stringify(registrants));
    
    // Reload table
    loadRecords();
}

// --- DELETE ALL FUNCTION ---
function deleteAll() {
    if(!confirm("WARNING: This will delete ALL records. Continue?")) return;
    
    localStorage.removeItem("registrants");
    loadRecords();
}
