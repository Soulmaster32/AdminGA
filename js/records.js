/* * RECORDS.JS
 * Features: 
 * - Load Data from Supabase
 * - Render Responsive Table
 * - Real-time Search
 * - CSV Export
 * - Secure Data Handling
 */

// SUPABASE CLIENT INITIALIZATION
const SUPABASE_URL = 'https://hbkitssxgajgncavxang.supabase.co'; // Your project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhia2l0c3N4Z2FqZ25jYXZ4cW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjE0OTksImV4cCI6MjA4MDQzNzQ5OX0.qLoTUj8nqQuE0W-6g5DBdEiRhjDb1KfzBd2zEHPaJbE'; // Your anon public key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variable to store data
let allData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadRecords();
    setupSearch();
});


// --- 1. LOAD & RENDER (Supabase Integration) ---
async function loadRecords() {
    const tableBody = document.getElementById("tableBody");
    const emptyMsg = document.getElementById("emptyMsg");
    
    // Clear current content
    tableBody.innerHTML = "";

    // Fetch from Supabase
    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('date_registered', { ascending: false }); // Sort newest first

    if (error) {
        console.error("Error loading records from Supabase:", error);
        if (emptyMsg) {
             emptyMsg.innerHTML = "<div>⚠️</div><h3>Error loading data</h3><p>Check the console for details.</p>";
             emptyMsg.style.display = "block";
        }
        return;
    }
    
    allData = data || [];

    // Handle Empty State
    if (allData.length === 0) {
        if(emptyMsg) emptyMsg.style.display = "block";
        return;
    } else {
        if(emptyMsg) emptyMsg.style.display = "none";
    }

    // Render Rows 
    allData.forEach((person, index) => {
        const row = createRow(person, index);
        tableBody.appendChild(row);
    });
}

// --- 2. ROW CREATOR (Updated property names) ---
function createRow(person, index) {
    const row = document.createElement("tr");
    
    // Staggered Animation
    row.style.animation = `slideInRow 0.4s ease forwards`;
    row.style.animationDelay = `${index * 0.05}s`; 
    row.style.opacity = "0"; 
    
    // Format Date (Using date_registered from SQL)
    const dateObj = new Date(person.date_registered);
    const dateStr = dateObj.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric' 
    }) + ' <small style="color:#999">' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + '</small>';
    
    // Full Name (Using SQL property names)
    const fullName = `${person.first_name} ${person.middle_name ? person.middle_name + ' ' : ''}${person.last_name}`;

    // Construct HTML 
    row.innerHTML = `
        <td data-label="Full Name">
            <strong style="color:var(--primary)">${escapeHtml(fullName)}</strong>
        </td>
        <td data-label="Department">
            <span style="background:#eff3f8; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:500;">
                ${escapeHtml(person.dept)}
            </span>
        </td>
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

// --- 3. SECURITY HELPER (No changes) ---
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- 4. SEARCH FUNCTIONALITY (No changes needed) ---
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if(!searchInput) return;

    searchInput.addEventListener("keyup", (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll("#tableBody tr");
        let hasVisible = false;

        rows.forEach(row => {
            const text = row.innerText.toLowerCase(); 
            
            if(text.includes(term)) {
                row.style.display = "";
                hasVisible = true;
            } else {
                row.style.display = "none";
            }
        });

        const emptyMsg = document.getElementById("emptyMsg");
        if(emptyMsg) {
             emptyMsg.style.display = hasVisible ? "none" : "block";
             if(!hasVisible) emptyMsg.querySelector('h3').innerText = "No matching records";
        }
    });
}

// --- 5. EXPORT TO CSV (Updated property names) ---
function exportCSV() {
    if (allData.length === 0) {
        alert("No records to export.");
        return;
    }

    // CSV Header 
    let csvContent = "First Name,Middle Name,Last Name,Department,Date Registered,Signature Status\n";

    allData.forEach(p => {
        const f = `"${p.first_name}"`;
        const m = `"${p.middle_name || ''}"`; // Use || '' to handle null/undefined
        const l = `"${p.last_name}"`;
        const d = `"${p.dept}"`;
        const date = `"${new Date(p.date_registered).toLocaleString()}"`;

        csvContent += `${f},${m},${l},${d},${date},"Signed"\n`;
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

// --- 6. DELETE LOGIC (Supabase Integration) ---
async function deleteRecord(id) {
    // Confirmation
    if(!confirm("Are you sure you want to permanently delete this record?")) return;

    // Delete from Supabase using the database-generated ID
    const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id); // Use 'id' which is the primary key in the SQL table

    if (error) {
        console.error("Error deleting record:", error);
        alert("Deletion failed due to a database error.");
        return;
    }
    
    // Re-render Table
    loadRecords();
}

async function deleteAll() {
    if(allData.length === 0) return;
    
    if(!confirm("⚠️ WARNING: This will wipe ALL data. This cannot be undone.\n\nAre you sure?")) return;
    
    // Delete ALL rows (safe way: delete where id is not 0, since BIGINT starts at 1)
    const { error } = await supabase
        .from('registrations')
        .delete()
        .neq('id', 0); 
    
    if (error) {
        console.error("Error deleting all records:", error);
        alert("Failed to clear all data due to a database error.");
        return;
    }

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

// Expose functions globally for HTML onclick to work
window.exportCSV = exportCSV;
window.deleteRecord = deleteRecord;
window.deleteAll = deleteAll;
