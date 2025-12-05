/* * RECORDS.JS
 * Features: 
 * - Load Data from Supabase
 * - Render Responsive Table
 * - Real-time Search
 * - CSV Export
 * - Secure Data Handling
 */

// ✅ SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://hbkitssxgajgncavxang.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhia2l0c3N4Z2FqZ25jYXZ4cW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjE0OTksImV4cCI6MjA4MDQzNzQ5OX0.qLoTUj8nqQuE0W-6g5DBdEiRhjDb1KfzBd2zEHPaJbE'; 

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
    
    tableBody.innerHTML = "";

    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('date_registered', { ascending: false });

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

// --- 2. ROW CREATOR ---
function createRow(person, index) {
    const row = document.createElement("tr");
    
    // Staggered Animation
    row.style.animation = `slideInRow 0.4s ease forwards`;
    row.style.animationDelay = `${index * 0.05}s`; 
    row.style.opacity = "0"; 
    
    // Format Date
    const dateObj = new Date(person.date_registered);
    const dateStr = dateObj.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric' 
    }) + ' <small style="color:#999">' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + '</small>';

    row.innerHTML = `
        <td data-label="Full Name">${person.first_name} ${person.middle_name ? person.middle_name + ' ' : ''}${person.last_name}</td>
        <td data-label="Department">${person.dept}</td>
        <td data-label="Date Registered">${dateStr}</td>
        <td data-label="Signature"><img src="${person.signature}" alt="Signature Preview" class="sig-preview"></td>
        <td data-label="Actions"><button class="btn-delete-row" onclick="deleteRecord('${person.id}')">Delete</button></td>
    `;
    return row;
}

// --- 3. SEARCH & FILTER ---
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredData = allData.filter(person => {
                const fullName = `${person.first_name} ${person.middle_name} ${person.last_name}`.toLowerCase();
                const uniqueId = person.unique_id.toLowerCase();
                const dept = person.dept.toLowerCase();
                
                return fullName.includes(query) || uniqueId.includes(query) || dept.includes(query);
            });
            renderFilteredRecords(filteredData);
        });
    }
}

function renderFilteredRecords(data) {
    const tableBody = document.getElementById("tableBody");
    const emptyMsg = document.getElementById("emptyMsg");
    
    tableBody.innerHTML = "";
    if (data.length === 0) {
        if(emptyMsg) {
             emptyMsg.innerHTML = "<div>🔍</div><h3>No results found</h3><p>Try a different name or department.</p>";
             emptyMsg.style.display = "block";
        }
    } else {
        if(emptyMsg) emptyMsg.style.display = "none";
        data.forEach((person, index) => {
            const row = createRow(person, index);
            tableBody.appendChild(row);
        });
    }
}


// --- 4. DELETE RECORD (EXPOSED GLOBALLY) ---
// Note: This function is now exposed globally for use in records.html onclick
window.deleteRecord = async function(id) {
    if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) {
        return;
    }

    const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record: " + error.message);
    } else {
        // Reload records after successful deletion
        loadRecords(); 
    }
}

// --- 5. DELETE ALL RECORDS (EXPOSED GLOBALLY) ---
// Note: This function is now exposed globally for use in records.html onclick
window.deleteAll = async function() {
     if (!confirm("⚠️ WARNING: Are you ABSOLUTELY sure you want to delete ALL records? This action is irreversible.")) {
        return;
    }
    
    const { data, error } = await supabase
        .from('registrations')
        .delete()
        .neq('id', 0); // Deletes all rows where ID is NOT 0 (i.e., everything, assuming ID is positive)

    if (error) {
        console.error("Error deleting all records:", error);
        alert("Failed to clear all records. You may need higher permissions: " + error.message);
    } else {
        alert("All records have been successfully cleared.");
        loadRecords(); 
    }
}


// --- 6. EXPORT TO CSV (EXPOSED GLOBALLY) ---
// Note: This function is now exposed globally for use in records.html onclick
window.exportCSV = function() {
    if (allData.length === 0) {
        alert("No data to export!");
        return;
    }

    const headers = ["ID", "First Name", "Middle Name", "Last Name", "Department", "Date Registered", "Unique ID"];
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h}"`).join(',')); // Ensure headers are quoted

    for (const record of allData) {
        const dateObj = new Date(record.date_registered);
        const dateString = dateObj.toLocaleString(); 

        const row = [
            `"${record.id}"`, 
            `"${record.first_name}"`,
            `"${record.middle_name || ''}"`,
            `"${record.last_name}"`,
            `"${record.dept}"`,
            `"${dateString}"`,
            `"${record.unique_id}"`
        ];
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
