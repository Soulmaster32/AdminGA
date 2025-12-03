/* 
 * RECORDS.JS
 * Features: 
 * - Load Data from LocalStorage
 * - Render Responsive Table
 * - Staggered Animations (Waterfall effect)
 * - Real-time Search
 * - CSV Export
 * - Secure Data Handling
 */

document.addEventListener("DOMContentLoaded", () => {
    loadRecords();
    setupSearch();
});

// Global variable to store data
let allData = [];

// --- 1. LOAD & RENDER ---
function loadRecords() {
    const tableBody = document.getElementById("tableBody");
    const emptyMsg = document.getElementById("emptyMsg");
    
    // Clear current content
    tableBody.innerHTML = "";

    // Fetch from LocalStorage
    allData = JSON.parse(localStorage.getItem("registrants")) || [];

    // Handle Empty State
    if (allData.length === 0) {
        if(emptyMsg) emptyMsg.style.display = "block";
        return;
    } else {
        if(emptyMsg) emptyMsg.style.display = "none";
    }

    // Render Rows (Newest first)
    // We add a slight delay to each row for a cool visual effect
    allData.slice().reverse().forEach((person, index) => {
        const row = createRow(person, index);
        tableBody.appendChild(row);
    });
}

// --- 2. ROW CREATOR (With Animation) ---
function createRow(person, index) {
    const row = document.createElement("tr");
    
    // Staggered Animation: Slide in rows one by one
    row.style.animation = `slideInRow 0.4s ease forwards`;
    row.style.animationDelay = `${index * 0.05}s`; // 50ms delay per row
    row.style.opacity = "0"; // Start hidden for animation
    
    // Format Date
    const dateObj = new Date(person.date);
    const dateStr = dateObj.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric' 
    }) + ' <small style="color:#999">' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + '</small>';
    
    // Full Name
    const fullName = `${person.firstName} ${person.middleName ? person.middleName + ' ' : ''}${person.lastName}`;

    // Construct HTML (Safe innerHTML)
    row.innerHTML = `
        <td data-label="Full Name">
            <strong style="color:var(--primary)">${escapeHtml(fullName)}</strong>
        </td>
        <td data-label="Department">
            <span style="background:#eff3f8; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:500;">
                ${escapeHtml(person.dept)}
            </span>
        </td>
        <td data-label="Section">${escapeHtml(person.section)}</td>
        <td data-label="Date Registered">${dateStr}</td>
        <td data-label="Signature">
            <img src="${person.signature}" class="sig-preview" alt="Signature">
        </td>
        <td data-label="Actions">
            <button onclick="deleteRecord('${person.id}')" class="btn-delete-row">
                ✕ Delete
            </button>
        </td>
    `;

    return row;
}

// --- 3. SECURITY HELPER (XSS Protection) ---
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- 4. SEARCH FUNCTIONALITY ---
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if(!searchInput) return;

    searchInput.addEventListener("keyup", (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll("#tableBody tr");
        let hasVisible = false;

        rows.forEach(row => {
            // Get text from the row (Name, Dept, Section)
            const text = row.innerText.toLowerCase();
            
            if(text.includes(term)) {
                row.style.display = "";
                hasVisible = true;
            } else {
                row.style.display = "none";
            }
        });

        // Toggle empty message if search hides everything
        const emptyMsg = document.getElementById("emptyMsg");
        if(emptyMsg) {
             emptyMsg.style.display = hasVisible ? "none" : "block";
             if(!hasVisible) emptyMsg.querySelector('h3').innerText = "No matching records";
        }
    });
}

// --- 5. EXPORT TO CSV ---
function exportCSV() {
    if (allData.length === 0) {
        alert("No records to export.");
        return;
    }

    // CSV Header
    let csvContent = "First Name,Middle Name,Last Name,Department,Section,Date Registered,Signature Status\n";

    allData.forEach(p => {
        // Wrap fields in quotes to handle commas within names
        const f = `"${p.firstName}"`;
        const m = `"${p.middleName}"`;
        const l = `"${p.lastName}"`;
        const d = `"${p.dept}"`;
        const s = `"${p.section}"`;
        const date = `"${new Date(p.date).toLocaleString()}"`;

        csvContent += `${f},${m},${l},${d},${s},${date},"Signed"\n`;
    });

    // Create Download Link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Employees_${new Date().toISOString().slice(0,10)}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 6. DELETE LOGIC ---
function deleteRecord(id) {
    // Confirmation
    if(!confirm("Are you sure you want to permanently delete this record?")) return;

    // Filter out the ID
    allData = allData.filter(person => person.id !== id);
    
    // Update Storage
    localStorage.setItem("registrants", JSON.stringify(allData));
    
    // Re-render Table
    loadRecords();
}

function deleteAll() {
    if(allData.length === 0) return;
    
    if(!confirm("⚠️ WARNING: This will wipe ALL data. This cannot be undone.\n\nAre you sure?")) return;
    
    localStorage.removeItem("registrants");
    allData = [];
    loadRecords();
}

// Add CSS animation for rows programmatically
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideInRow {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
