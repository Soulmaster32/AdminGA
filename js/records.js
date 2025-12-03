/* 
 * RECORDS.JS 
 * Features: Load Data, Security (Sanitization), Search, Delete, Export to Excel
 */

document.addEventListener("DOMContentLoaded", () => {
    loadRecords();

    // Attach Search Listener
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterRecords(searchTerm);
        });
    }
});

// Global variable to hold data for filtering
let allRegistrants = [];

// --- 1. LOAD & RENDER DATA ---
function loadRecords() {
    const tableBody = document.getElementById("tableBody");
    const emptyMsg = document.getElementById("emptyMsg");
    
    // Clear current view
    tableBody.innerHTML = "";

    // Fetch from Storage
    allRegistrants = JSON.parse(localStorage.getItem("registrants")) || [];

    // Empty State Check
    if (allRegistrants.length === 0) {
        if(emptyMsg) emptyMsg.style.display = "block";
        return;
    } else {
        if(emptyMsg) emptyMsg.style.display = "none";
    }

    // Render Rows (Reverse to show newest first)
    allRegistrants.slice().reverse().forEach(person => {
        createRow(person, tableBody);
    });
}

// --- 2. HELPER: CREATE ROW (SECURE) ---
function createRow(person, container) {
    const row = document.createElement("tr");
    
    // Format Date
    const dateObj = new Date(person.date);
    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Construct Name
    const fullName = `${person.firstName} ${person.middleName ? person.middleName + ' ' : ''}${person.lastName}`;

    // Create Cells safely using textContent to prevent XSS (Hacking via scripts in inputs)
    
    // 1. Name Cell
    const tdName = document.createElement("td");
    tdName.setAttribute("data-label", "Name");
    tdName.innerHTML = `<strong></strong>`; // We keep strong tag but fill text safely
    tdName.querySelector("strong").textContent = fullName;
    row.appendChild(tdName);

    // 2. Dept Cell
    const tdDept = document.createElement("td");
    tdDept.setAttribute("data-label", "Dept");
    tdDept.textContent = person.dept;
    row.appendChild(tdDept);

    // 3. Section Cell
    const tdSec = document.createElement("td");
    tdSec.setAttribute("data-label", "Section");
    tdSec.textContent = person.section;
    row.appendChild(tdSec);

    // 4. Date Cell
    const tdDate = document.createElement("td");
    tdDate.setAttribute("data-label", "Date");
    tdDate.textContent = dateStr;
    row.appendChild(tdDate);

    // 5. Signature Cell (Image)
    const tdSig = document.createElement("td");
    tdSig.setAttribute("data-label", "Signature");
    const img = document.createElement("img");
    img.src = person.signature;
    img.className = "sig-img";
    img.alt = "Signature";
    tdSig.appendChild(img);
    row.appendChild(tdSig);

    // 6. Action Cell
    const tdAction = document.createElement("td");
    tdAction.setAttribute("data-label", "Action");
    
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕ Delete";
    delBtn.style.cssText = "color: #ff6b6b; background:none; border:none; cursor:pointer; font-weight:600;";
    delBtn.onclick = () => deleteRecord(person.id);
    
    tdAction.appendChild(delBtn);
    row.appendChild(tdAction);

    // Add to table
    container.appendChild(row);
}

// --- 3. SEARCH FUNCTIONALITY ---
function filterRecords(term) {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = ""; // Clear current

    const filtered = allRegistrants.filter(person => {
        const fullName = `${person.firstName} ${person.middleName} ${person.lastName}`.toLowerCase();
        const dept = person.dept.toLowerCase();
        // Check if name or dept matches search term
        return fullName.includes(term) || dept.includes(term);
    });

    // Re-render filtered list (Reverse to keep newest top)
    filtered.slice().reverse().forEach(person => {
        createRow(person, tableBody);
    });
}

// --- 4. EXPORT TO EXCEL (CSV) ---
function exportToExcel() {
    if (allRegistrants.length === 0) {
        alert("No records to export!");
        return;
    }

    // 1. Define Headers
    let csvContent = "First Name,Middle Name,Last Name,Department,Section,Date Registered,Signature Status\n";

    // 2. Loop Data
    allRegistrants.forEach(person => {
        // Handle dates
        const cleanDate = new Date(person.date).toLocaleString().replace(/,/g, ""); 
        
        // Sanitize strings (replace commas with spaces to avoid breaking CSV columns)
        const f = person.firstName.replace(/,/g, " ");
        const m = person.middleName.replace(/,/g, " ");
        const l = person.lastName.replace(/,/g, " ");
        const d = person.dept.replace(/,/g, " ");
        const s = person.section.replace(/,/g, " ");

        // Build Row
        // Note: We do NOT export the base64 signature string because it's too large for Excel cells.
        // We just mark it as "Signed".
        const row = `${f},${m},${l},${d},${s},${cleanDate},Signed`;
        
        csvContent += row + "\n";
    });

    // 3. Create Download Link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // 4. Trigger Download
    link.setAttribute("href", url);
    link.setAttribute("download", "employee_records.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 5. DELETE SINGLE RECORD ---
function deleteRecord(id) {
    if(!confirm("Are you sure you want to delete this record?")) return;

    // Remove from array
    allRegistrants = allRegistrants.filter(person => person.id !== id);
    
    // Save to LocalStorage
    localStorage.setItem("registrants", JSON.stringify(allRegistrants));
    
    // Refresh Table
    loadRecords();
}

// --- 6. DELETE ALL RECORDS ---
function deleteAll() {
    if(!confirm("WARNING: This will delete ALL records permanently. Continue?")) return;
    
    localStorage.removeItem("registrants");
    allRegistrants = [];
    loadRecords();
}
