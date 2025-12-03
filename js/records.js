document.addEventListener("DOMContentLoaded", () => {
    loadRecords();

    // Live Search
    document.getElementById("searchInput").addEventListener("keyup", (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll("#tableBody tr");
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(term) ? "" : "none";
        });
    });
});

let allData = [];

function loadRecords() {
    const tbody = document.getElementById("tableBody");
    const emptyMsg = document.getElementById("emptyMsg");
    tbody.innerHTML = "";

    // 1. Get Data
    allData = JSON.parse(localStorage.getItem("registrants")) || [];

    if(allData.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }
    emptyMsg.style.display = "none";

    // 2. Render Rows (Newest first)
    allData.slice().reverse().forEach(p => {
        const row = document.createElement("tr");
        const dateStr = new Date(p.date).toLocaleString();
        const fullName = `${p.firstName} ${p.middleName} ${p.lastName}`;

        row.innerHTML = `
            <td data-label="Name"><strong>${sanitize(fullName)}</strong></td>
            <td data-label="Dept">${sanitize(p.dept)}</td>
            <td data-label="Section">${sanitize(p.section)}</td>
            <td data-label="Date">${dateStr}</td>
            <td data-label="Signature"><img src="${p.signature}" class="sig-img"></td>
            <td data-label="Action">
                <button onclick="deleteRow('${p.id}')" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Security: Prevent XSS
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Delete One
function deleteRow(id) {
    if(confirm("Delete this record?")) {
        allData = allData.filter(d => d.id !== id);
        localStorage.setItem("registrants", JSON.stringify(allData));
        loadRecords();
    }
}

// Delete All
function deleteAll() {
    if(confirm("Delete ALL records? This cannot be undone.")) {
        localStorage.removeItem("registrants");
        loadRecords();
    }
}

// Export to Excel (CSV)
function exportCSV() {
    if(allData.length === 0) return alert("No data to export");
    
    let csv = "First Name,Middle Name,Last Name,Dept,Section,Date\n";
    allData.forEach(p => {
        const row = [p.firstName, p.middleName, p.lastName, p.dept, p.section, p.date].map(i => `"${i}"`).join(",");
        csv += row + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "employees.csv";
    link.click();
}
