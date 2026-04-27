/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V2.0 PRO)
   Features: Full CRUD, Search, View, Real-time Sync with Supabase
================================================================ */

(function () {
    'use strict';

    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = 'https://doycdipvtyflshhsxqqx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk';

    let sb = null;
    let currentUser = null;
    let inventoryData =[];
    let inquiriesData = [];
    let quotesData =[];
    let editingId = null; 

    // Initialize Supabase Dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    };
    document.head.appendChild(script);

    // ==========================================
    // 1. UI INJECTION (Styles & HTML)
    // ==========================================
    function injectStyles() {
        const css = `
            :root { --ep-p: #ff3b30; --ep-bg: #0a0a0c; --ep-card: #151518; --ep-border: rgba(255,59,48,0.2); }
            #ep-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); z-index: 10000; display: none; font-family: 'Montserrat', sans-serif; color: #eee; overflow-y: auto; }
            .ep-container { max-width: 1100px; margin: 40px auto; background: var(--ep-bg); border: 1px solid var(--ep-border); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
            .ep-header { padding: 20px 30px; background: #111; border-bottom: 1px solid var(--ep-border); display: flex; justify-content: space-between; align-items: center; }
            .ep-nav { display: flex; background: #111; border-bottom: 1px solid #222; }
            .ep-nav-btn { padding: 16px 30px; border: none; background: none; color: #777; cursor: pointer; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; transition: 0.3s; }
            .ep-nav-btn:hover { color: #fff; }
            .ep-nav-btn.active { color: var(--ep-p); border-bottom: 2px solid var(--ep-p); background: rgba(255,59,48,0.05); }
            .ep-content { padding: 30px; min-height: 500px; }
            
            .ep-input { width: 100%; padding: 12px 16px; background: #1a1a1d; border: 1px solid #333; color: #fff; border-radius: 6px; margin-bottom: 15px; font-family: inherit; font-size: 0.85rem; transition: 0.3s; }
            .ep-input:focus { border-color: var(--ep-p); outline: none; box-shadow: 0 0 0 3px rgba(255,59,48,0.1); }
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            
            .ep-btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 8px; }
            .ep-btn-p { background: var(--ep-p); color: #fff; }
            .ep-btn-p:hover { background: #d63026; transform: translateY(-2px); }
            .ep-btn-sec { background: #2a2a2d; color: #fff; border: 1px solid #444; }
            .ep-btn-sec:hover { background: #3a3a3d; border-color: #666; }
            
            .ep-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.85rem; }
            .ep-table th { text-align: left; padding: 14px; background: #151518; color: var(--ep-p); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; }
            .ep-table td { padding: 14px; border-bottom: 1px solid #222; vertical-align: middle; }
            .ep-table tr:hover td { background: rgba(255,255,255,0.02); }
            .ep-status { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .status-live { background: rgba(37,211,102,0.1); color: #25d366; border: 1px solid rgba(37,211,102,0.2); }

            #ep-admin-trigger { position: fixed; bottom: 25px; right: 25px; width: 55px; height: 55px; border-radius: 50%; background: var(--ep-p); color: white; border: none; cursor: pointer; z-index: 9999; box-shadow: 0 4px 20px rgba(255,59,48,0.5); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; transition: 0.3s; }
            #ep-admin-trigger:hover { transform: scale(1.1); background: #d63026; }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <!-- Floating Admin Button -->
            <button id="ep-admin-trigger" title="Open Admin Panel"><i class="fas fa-user-shield"></i></button>
            
            <!-- Main Overlay -->
            <div id="ep-overlay">
                <div class="ep-container">
                    
                    <!-- Header -->
                    <div class="ep-header">
                        <div style="font-weight: 800; font-size: 1.3rem; letter-spacing: 3px;">ELITE <span style="color:var(--ep-p)">ROUTE</span> <span style="font-weight:400; color:#777; font-size:1rem;">| ADMIN SUITE</span></div>
                        <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-overlay').style.display='none'"><i class="fas fa-times"></i> Close</button>
                    </div>

                    <!-- Login Form -->
                    <div id="ep-login-form" style="padding: 80px 20px; max-width: 400px; margin: 0 auto; text-align: center;">
                        <div style="font-size: 3rem; color: var(--ep-p); margin-bottom: 20px;"><i class="fas fa-lock"></i></div>
                        <h2 style="margin-bottom: 30px; font-weight: 700; letter-spacing: 1px;">Secure Access</h2>
                        <input type="email" id="ep-email" class="ep-input" placeholder="Admin Email (e.g. admin@eliteroute.com)">
                        <input type="password" id="ep-pass" class="ep-input" placeholder="Password">
                        <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width: 100%; justify-content: center; padding: 14px; font-size: 0.8rem;">Authenticate <i class="fas fa-arrow-right"></i></button>
                    </div>

                    <!-- Admin Panel Dashboard -->
                    <div id="ep-main-panel" style="display: none;">
                        <div class="ep-nav">
                            <button class="ep-nav-btn active" data-tab="tab-inventory"><i class="fas fa-car"></i> Inventory</button>
                            <button class="ep-nav-btn" data-tab="tab-leads"><i class="fas fa-inbox"></i> Inquiries</button>
                            <button class="ep-nav-btn" data-tab="tab-quotes"><i class="fas fa-file-invoice-dollar"></i> Quotes</button>
                            <button class="ep-nav-btn" id="ep-logout" style="margin-left: auto; color: #ff4444;"><i class="fas fa-sign-out-alt"></i> Logout</button>
                        </div>

                        <div class="ep-content">
                            <!-- INVENTORY TAB -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                                    <h3 style="font-weight: 700; letter-spacing: 1px;">Vehicle Catalog</h3>
                                    <button class="ep-btn ep-btn-p" onclick="window.openCarForm()"><i class="fas fa-plus"></i> Add New Vehicle</button>
                                </div>
                                <div style="position: relative;">
                                    <i class="fas fa-search" style="position: absolute; left: 15px; top: 15px; color: #777;"></i>
                                    <input type="text" id="inv-search" class="ep-input" style="padding-left: 40px;" placeholder="Search inventory by make, model, or category..." onkeyup="window.filterInventory()">
                                </div>
                                <div style="overflow-x: auto;">
                                    <table class="ep-table">
                                        <thead><tr><th>ID</th><th>Vehicle Details</th><th>Price</th><th>Category</th><th>Badge</th><th>Actions</th></tr></thead>
                                        <tbody id="inv-list"></tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- INQUIRIES TAB -->
                            <div id="tab-leads" class="ep-tab-content" style="display: none;">
                                <h3 style="margin-bottom: 20px; font-weight: 700; letter-spacing: 1px;">Active Sales Inquiries</h3>
                                <div style="overflow-x: auto;">
                                    <table class="ep-table">
                                        <thead><tr><th>Date Recv</th><th>Client Info</th><th>Vehicle of Interest</th><th>Destination</th><th>Details</th></tr></thead>
                                        <tbody id="leads-list"></tbody>
                                    </table>
                                </div>
                            </div>

                             <!-- QUOTES TAB -->
                             <div id="tab-quotes" class="ep-tab-content" style="display: none;">
                                <h3 style="margin-bottom: 20px; font-weight: 700; letter-spacing: 1px;">General Quote Requests</h3>
                                <div style="overflow-x: auto;">
                                    <table class="ep-table">
                                        <thead><tr><th>Date Recv</th><th>Client Info</th><th>Requirements</th><th>Budget</th><th>Message</th></tr></thead>
                                        <tbody id="quotes-list"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CAR ADD/EDIT MODAL -->
            <div id="ep-car-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); backdrop-filter:blur(5px); z-index:11000; padding:40px; overflow-y:auto;">
                <div style="max-width: 800px; margin: 40px auto; background: #151518; padding: 40px; border-radius: 12px; border: 1px solid var(--ep-p); box-shadow: 0 10px 40px rgba(255,59,48,0.2);">
                    <h2 id="modal-title" style="margin-bottom: 25px; font-weight: 700; letter-spacing: 1px; color: #fff;">Add Vehicle</h2>
                    <form id="car-form" class="ep-grid">
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Make</label>
                            <input name="make" class="ep-input" required placeholder="e.g. Mercedes-Benz">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Model Name</label>
                            <input name="name" class="ep-input" required placeholder="e.g. G63 AMG">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Price</label>
                            <input name="price" class="ep-input" placeholder="e.g. $215,000 or On Request">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Category</label>
                            <select name="cat" class="ep-input">
                                <option value="luxury">Luxury</option>
                                <option value="suv">SUV</option>
                                <option value="exotic">Exotic</option>
                                <option value="fleet">Fleet</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Badge Text</label>
                            <input name="badge" class="ep-input" placeholder="e.g. HOT, LUXURY, ARMORED">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Badge Color Class</label>
                            <select name="bc" class="ep-input">
                                <option value="">Default (Red)</option>
                                <option value="hot">Dark Red (hot)</option>
                                <option value="luxury">Purple (luxury)</option>
                                <option value="fleet">Blue (fleet)</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Sold/Exported Text</label>
                            <input name="sold" class="ep-input" placeholder="e.g. 15 Exported">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Old Price (Strikethrough)</label>
                            <input name="old" class="ep-input" placeholder="e.g. $230K (Optional)">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display:block; font-size:0.7rem; color:#aaa; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Main Image URL</label>
                            <input name="img" class="ep-input" required placeholder="https://images.unsplash.com/photo-...">
                        </div>
                        
                        <div style="grid-column: span 2; border-top: 1px solid #333; margin-top: 10px; padding-top: 25px; display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-car-modal').style.display='none'">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Vehicle</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    // ==========================================
    // 2. INITIALIZATION & LISTENERS
    // ==========================================
    async function init() {
        injectStyles();
        injectHTML();
        setupEventListeners();
        checkSession();

        // Real-time listener for incoming inquiries and quotes
        sb.channel('admin-panel-sync')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, payload => {
              fetchInquiries(); 
              alert(`New Inquiry Received from ${payload.new.name}!`);
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quotes' }, payload => {
              fetchQuotes();
              alert(`New Quote Request Received from ${payload.new.name}!`);
          })
          .subscribe();
    }

    function setupEventListeners() {
        // Open Admin Panel
        document.getElementById('ep-admin-trigger').onclick = () => document.getElementById('ep-overlay').style.display = 'block';
        
        // Auth Listeners
        document.getElementById('ep-login-btn').onclick = login;
        document.getElementById('ep-logout').onclick = logout;

        // Tab Navigation
        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.style.display = 'none');
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).style.display = 'block';
            };
        });

        // Add/Edit Car Form Submission
        document.getElementById('car-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            const formData = new FormData(e.target);
            const carObj = Object.fromEntries(formData.entries());

            // Handle JSONB fields to ensure index2.html doesn't break
            if (!editingId) {
                // Creating new vehicle: Setup empty/default JSON structures
                carObj.imgs = [carObj.img]; 
                carObj.tags =[];           
                carObj.specs = { "Engine": "N/A", "Transmission": "N/A" }; 
                carObj.export = { "Lead Time": "Contact Us", "Shipping": "Available" };         
            } else {
                // Editing existing vehicle: Preserve complex JSON data from database
                const existing = inventoryData.find(c => c.id === editingId);
                carObj.imgs = existing.imgs && existing.imgs.length > 0 ? existing.imgs : [carObj.img];
                carObj.tags = existing.tags ||[];
                carObj.specs = existing.specs || {};
                carObj.export = existing.export || {};
            }

            if (editingId) {
                const { error } = await sb.from('inventory').update(carObj).eq('id', editingId);
                if (error) alert("Error updating: " + error.message);
            } else {
                const { error } = await sb.from('inventory').insert([carObj]);
                if (error) alert("Error saving: " + error.message);
            }
            
            btn.innerHTML = '<i class="fas fa-save"></i> Save Vehicle';
            btn.disabled = false;
            document.getElementById('ep-car-modal').style.display = 'none';
            loadData(); // Re-fetch the table
        };
    }













   





   

    // ==========================================
    // 3. AUTHENTICATION
    // ==========================================
    async function login() {
        const btn = document.getElementById('ep-login-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        
        const email = document.getElementById('ep-email').value;
        const password = document.getElementById('ep-pass').value;
        
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        
        if (error) {
            btn.innerHTML = 'Authenticate <i class="fas fa-arrow-right"></i>';
            return alert("Access Denied: " + error.message);
        }
        
        currentUser = data.user;
        showPanel();
    }

    async function logout() {
        await sb.auth.signOut();
        currentUser = null;
        document.getElementById('ep-login-form').style.display = 'block';
        document.getElementById('ep-main-panel').style.display = 'none';
        document.getElementById('ep-email').value = '';
        document.getElementById('ep-pass').value = '';
        document.getElementById('ep-login-btn').innerHTML = 'Authenticate <i class="fas fa-arrow-right"></i>';
    }

    async function checkSession() {
        const { data } = await sb.auth.getUser();
        if (data.user) { 
            currentUser = data.user; 
            showPanel(); 
        }
    }

    function showPanel() {
        document.getElementById('ep-login-form').style.display = 'none';
        document.getElementById('ep-main-panel').style.display = 'block';
        loadData();
    }

    // ==========================================
    // 4. DATA FETCHING
    // ==========================================
    async function loadData() {
        fetchInventory();
        fetchInquiries();
        fetchQuotes();
    }

    async function fetchInventory() {
        const { data } = await sb.from('inventory').select('*').order('id', { ascending: false });
        inventoryData = data ||[];
        renderInventory(inventoryData);
    }
    
    async function fetchInquiries() {
        const { data } = await sb.from('inquiries').select('*').order('created_at', { ascending: false });
        inquiriesData = data ||[];
        renderLeads(inquiriesData);
    }

    async function fetchQuotes() {
        const { data } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
        quotesData = data ||[];
        renderQuotes(quotesData);
    }

    // ==========================================
    // 5. RENDERING DATA TO DOM
    // ==========================================
    function renderInventory(data) {
        const container = document.getElementById('inv-list');
        if (data.length === 0) {
            container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#777;">No vehicles found in inventory.</td></tr>`;
            return;
        }

        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#777;">#${item.id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${item.img || 'https://via.placeholder.com/150'}" style="width:50px; height:35px; object-fit:cover; border-radius:4px; border:1px solid #333;">
                        <div>
                            <div style="font-size:0.65rem; color:var(--ep-p); text-transform:uppercase; letter-spacing:1px;">${item.make}</div>
                            <div style="font-weight:700;">${item.name}</div>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600; color:#ccc;">${item.price || '-'}</td>
                <td><span class="ep-status status-live">${item.cat}</span></td>
                <td>${item.badge ? `<span style="background:#222; padding:3px 8px; border-radius:3px; font-size:0.65rem;">${item.badge}</span>` : '—'}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="ep-btn ep-btn-sec" onclick="window.editCar(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="ep-btn ep-btn-sec" style="color:#ff4444; border-color:rgba(255,68,68,0.3);" onclick="window.deleteCar(${item.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderLeads(data) {
        const container = document.getElementById('leads-list');
        if (data.length === 0) {
            container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#777;">No inquiries yet.</td></tr>`;
            return;
        }

        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#aaa; font-size:0.8rem;">${new Date(item.created_at).toLocaleString()}</td>
                <td>
                    <div style="font-weight:700; color:#fff;">${item.name}</div>
                    <div style="color:var(--ep-p); font-size:0.75rem;"><i class="fas fa-envelope"></i> ${item.email}</div>
                    ${item.phone ? `<div style="color:#777; font-size:0.75rem;"><i class="fas fa-phone"></i> ${item.phone}</div>` : ''}
                </td>
                <td style="font-weight:600;">${item.car_title || 'N/A'}</td>
                <td style="color:#ccc;">${item.destination || 'N/A'}</td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="window.viewNotes('${escapeHtml(item.notes || 'No notes provided.')}')"><i class="fas fa-eye"></i> View</button>
                </td>
            </tr>
        `).join('');
    }

    function renderQuotes(data) {
        const container = document.getElementById('quotes-list');
        if (data.length === 0) {
            container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#777;">No quote requests yet.</td></tr>`;
            return;
        }

        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#aaa; font-size:0.8rem;">${new Date(item.created_at).toLocaleString()}</td>
                <td>
                    <div style="font-weight:700; color:#fff;">${item.name}</div>
                    <div style="color:var(--ep-p); font-size:0.75rem;"><i class="fas fa-envelope"></i> ${item.email}</div>
                </td>
                <td style="font-weight:600;">${item.vehicle_interest || 'General Inquiry'}</td>
                <td><span style="background:#222; padding:4px 8px; border-radius:4px; font-size:0.75rem; color:#4dbb6a;">${item.budget || '—'}</span></td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="window.viewNotes('${escapeHtml(item.message || 'No message provided.')}')"><i class="fas fa-eye"></i> Read</button>
                </td>
            </tr>
        `).join('');
    }

    // Utility to prevent XSS in alerts
    function escapeHtml(unsafe) {
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, "\\n");
    }

    window.viewNotes = (notes) => {
        // Simple alert for viewing long messages
        alert("MESSAGE DETAILS:\n\n" + notes.replace(/\\n/g, "\n"));
    };

    window.filterInventory = () => {
        const query = document.getElementById('inv-search').value.toLowerCase();
        renderInventory(inventoryData.filter(i => 
            i.make.toLowerCase().includes(query) || 
            i.name.toLowerCase().includes(query) || 
            i.cat.toLowerCase().includes(query)
        ));
    };

    // ==========================================
    // 6. CRUD ACTIONS
    // ==========================================
    window.openCarForm = () => {
        editingId = null;
        document.getElementById('car-form').reset();
        document.getElementById('modal-title').innerText = "Add New Vehicle";
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    window.editCar = (id) => {
        editingId = id;
        const car = inventoryData.find(c => c.id === id);
        const form = document.getElementById('car-form');
        
        document.getElementById('modal-title').innerText = "Edit Vehicle #" + id;
        
        // Populate inputs with existing data
        for (let key in car) {
            if (form.elements[key]) {
                form.elements[key].value = car[key] || '';
            }
        }
        
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    window.deleteCar = async (id) => {
        if (!confirm("⚠️ WARNING: Are you sure you want to delete this vehicle? It will be removed from the live showroom immediately.")) return;
        
        const { error } = await sb.from('inventory').delete().eq('id', id);
        
        if (error) {
            alert("Failed to delete: " + error.message);
        } else {
            // Update local state and re-render
            inventoryData = inventoryData.filter(c => c.id !== id);
            renderInventory(inventoryData);
        }
    };

})();
```
