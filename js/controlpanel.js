/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V2.0 PRO)
   Features: Full CRUD, Search, View, Real-time Sync with Supabase
================================================================ */

(function () {
    'use strict';

    const SUPABASE_URL = 'https://doycdipvtyflshhsxqqx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk';

    let sb = null;
    let currentUser = null;
    let inventoryData =[];
    let inquiriesData = [];
    let quotesData =[];
    let editingId = null; 

    // Initialize Supabase
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    };
    document.head.appendChild(script);

    // 1. UI INJECTION (Styles & HTML)
    function injectStyles() {
        const css = `
            :root { --p: #ff3b30; --bg: #0a0a0c; --card: #151518; --border: rgba(255,59,48,0.2); }
            #ep-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: none; font-family: 'Montserrat', sans-serif; color: #eee; overflow-y: auto; }
            .ep-container { max-width: 1100px; margin: 40px auto; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            .ep-header { padding: 20px; background: #111; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
            .ep-nav { display: flex; background: #111; border-bottom: 1px solid #222; }
            .ep-nav-btn { padding: 15px 25px; border: none; background: none; color: #777; cursor: pointer; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
            .ep-nav-btn.active { color: var(--p); border-bottom: 2px solid var(--p); }
            .ep-content { padding: 30px; }
            
            .ep-input { width: 100%; padding: 12px; background: #1a1a1d; border: 1px solid #333; color: #fff; border-radius: 6px; margin-bottom: 15px; }
            .ep-input:focus { border-color: var(--p); outline: none; }
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            
            .ep-btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 0.7rem; }
            .ep-btn-p { background: var(--p); color: #fff; }
            .ep-btn-p:hover { background: #d63026; }
            .ep-btn-sec { background: #333; color: #fff; }
            
            .ep-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .ep-table th { text-align: left; padding: 12px; background: #111; color: var(--p); font-size: 0.7rem; text-transform: uppercase; }
            .ep-table td { padding: 12px; border-bottom: 1px solid #222; font-size: 0.85rem; }
            .ep-status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; }
            .status-live { background: rgba(37,211,102,0.1); color: #25d366; }

            #ep-admin-trigger { position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; border-radius: 50%; background: var(--p); color: white; border: none; cursor: pointer; z-index: 9999; box-shadow: 0 4px 15px rgba(255,59,48,0.4); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <button id="ep-admin-trigger" title="Admin Panel"><i class="fas fa-user-shield"></i></button>
            <div id="ep-overlay">
                <div class="ep-container">
                    <div class="ep-header">
                        <div style="font-weight: 800; font-size: 1.2rem; letter-spacing: 2px;">ELITE <span style="color:var(--p)">ROUTE</span> ADMIN</div>
                        <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-overlay').style.display='none'">Close</button>
                    </div>

                    <div id="ep-login-form" style="padding: 50px; max-width: 400px; margin: 0 auto; text-align: center;">
                        <h2 style="margin-bottom: 20px;">Secure Login</h2>
                        <input type="email" id="ep-email" class="ep-input" placeholder="Admin Email">
                        <input type="password" id="ep-pass" class="ep-input" placeholder="Password">
                        <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width: 100%;">Access Panel</button>
                    </div>

                    <div id="ep-main-panel" style="display: none;">
                        <div class="ep-nav">
                            <button class="ep-nav-btn active" data-tab="tab-inventory">Inventory</button>
                            <button class="ep-nav-btn" data-tab="tab-leads">Inquiries</button>
                            <button class="ep-nav-btn" data-tab="tab-quotes">Quotes</button>
                            <button class="ep-nav-btn" id="ep-logout" style="margin-left: auto; color: #ff4444;">Logout</button>
                        </div>

                        <div class="ep-content">
                            <!-- INVENTORY -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <h3>Vehicle Catalog</h3>
                                    <button class="ep-btn ep-btn-p" onclick="window.openCarForm()">+ Add New Vehicle</button>
                                </div>
                                <input type="text" id="inv-search" class="ep-input" placeholder="Search by make, name or category..." onkeyup="window.filterInventory()">
                                <table class="ep-table">
                                    <thead><tr><th>ID</th><th>Vehicle</th><th>Price</th><th>Category</th><th>Badge</th><th>Actions</th></tr></thead>
                                    <tbody id="inv-list"></tbody>
                                </table>
                            </div>

                            <!-- INQUIRIES -->
                            <div id="tab-leads" class="ep-tab-content" style="display: none;">
                                <h3>Active Sales Inquiries</h3>
                                <table class="ep-table">
                                    <thead><tr><th>Date</th><th>Customer</th><th>Vehicle</th><th>Port</th><th>Notes</th></tr></thead>
                                    <tbody id="leads-list"></tbody>
                                </table>
                            </div>

                             <!-- QUOTES -->
                             <div id="tab-quotes" class="ep-tab-content" style="display: none;">
                                <h3>General Quote Requests</h3>
                                <table class="ep-table">
                                    <thead><tr><th>Date</th><th>Customer</th><th>Interest</th><th>Budget</th><th>Message</th></tr></thead>
                                    <tbody id="quotes-list"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CAR FORM MODAL -->
            <div id="ep-car-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:11000; padding:40px; overflow-y:auto;">
                <div style="max-width: 800px; margin: 0 auto; background: #111; padding: 30px; border-radius: 10px; border: 1px solid var(--p);">
                    <h2 id="modal-title">Add Vehicle</h2>
                    <form id="car-form" class="ep-grid" style="margin-top: 20px;">
                        <div><label>Make</label><input name="make" class="ep-input" required placeholder="e.g. BMW"></div>
                        <div><label>Model Name</label><input name="name" class="ep-input" required placeholder="e.g. X5 M-Sport"></div>
                        <div><label>Price</label><input name="price" class="ep-input" placeholder="e.g. $85,000"></div>
                        <div><label>Category</label>
                            <select name="cat" class="ep-input">
                                <option value="luxury">Luxury</option>
                                <option value="suv">SUV</option>
                                <option value="exotic">Exotic</option>
                                <option value="fleet">Fleet</option>
                            </select>
                        </div>
                        <div><label>Badge</label><input name="badge" class="ep-input" placeholder="e.g. HOT"></div>
                        <div><label>Badge Class</label><input name="bc" class="ep-input" placeholder="e.g. hot or luxury"></div>
                        <div><label>Sold Text</label><input name="sold" class="ep-input" placeholder="e.g. 15 Exported"></div>
                        <div style="grid-column: span 2;"><label>Main Image URL</label><input name="img" class="ep-input" placeholder="https://..."></div>
                        <div style="grid-column: span 2;">
                            <button type="submit" class="ep-btn ep-btn-p">Save Vehicle</button>
                            <button type="button" class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-car-modal').style.display='none'">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    // 2. CORE LOGIC
    async function init() {
        injectStyles();
        injectHTML();
        setupEventListeners();
        checkSession();

        // Subscribe to real-time changes to keep panel updated
        sb.channel('admin-panel-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => fetchInquiries())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => fetchQuotes())
          .subscribe();
    }

    function setupEventListeners() {
        document.getElementById('ep-admin-trigger').onclick = () => document.getElementById('ep-overlay').style.display = 'block';
        document.getElementById('ep-login-btn').onclick = login;
        document.getElementById('ep-logout').onclick = logout;

        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.style.display = 'none');
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).style.display = 'block';
            };
        });

        document.getElementById('car-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const carObj = Object.fromEntries(formData.entries());

            // Prepare defaults for index2.html if it's a new entry to prevent UI breaks
            if (!editingId) {
                carObj.imgs = [carObj.img]; // JSONB array 
                carObj.tags =[];           // JSONB array
                carObj.specs = {};          // JSONB object
                carObj.export = {};         // JSONB object
            } else {
                // Keep the existing JSON values intact on update
                const existing = inventoryData.find(c => c.id === editingId);
                carObj.imgs = existing.imgs || [carObj.img];
                carObj.tags = existing.tags ||[];
                carObj.specs = existing.specs || {};
                carObj.export = existing.export || {};
            }

            if (editingId) {
                const { error } = await sb.from('inventory').update(carObj).eq('id', editingId);
                if (error) alert(error.message);
            } else {
                const { error } = await sb.from('inventory').insert([carObj]);
                if (error) alert(error.message);
            }
            
            document.getElementById('ep-car-modal').style.display = 'none';
            loadData(); // refreshing data updates index2 via realtime auto-trigger
        };
    }

    async function login() {
        const email = document.getElementById('ep-email').value;
        const password = document.getElementById('ep-pass').value;
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return alert("Login Failed: " + error.message);
        currentUser = data.user;
        showPanel();
    }

    async function logout() {
        await sb.auth.signOut();
        currentUser = null;
        document.getElementById('ep-login-form').style.display = 'block';
        document.getElementById('ep-main-panel').style.display = 'none';
    }

    async function checkSession() {
        const { data } = await sb.auth.getUser();
        if (data.user) { currentUser = data.user; showPanel(); }
    }

    function showPanel() {
        document.getElementById('ep-login-form').style.display = 'none';
        document.getElementById('ep-main-panel').style.display = 'block';
        loadData();
    }

    // 4. DATA OPERATIONS
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

    // --- RENDERERS ---

    function renderInventory(data) {
        const container = document.getElementById('inv-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td><strong>${item.make}</strong> ${item.name}</td>
                <td>${item.price || '-'}</td>
                <td><span class="ep-status status-live">${item.cat}</span></td>
                <td>${item.badge || '—'}</td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="window.editCar(${item.id})">Edit</button>
                    <button class="ep-btn ep-btn-sec" style="color:#ff4444" onclick="window.deleteCar(${item.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function renderLeads(data) {
        const container = document.getElementById('leads-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td><strong>${item.name}</strong><br><small>${item.email}<br>${item.phone || ''}</small></td>
                <td>${item.car_title || 'N/A'}</td>
                <td>${item.destination || 'N/A'}</td>
                <td><button class="ep-btn ep-btn-sec" onclick="alert('Message:\\n\\n${(item.notes || 'No message').replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">View</button></td>
            </tr>
        `).join('');
    }

    function renderQuotes(data) {
        const container = document.getElementById('quotes-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td><strong>${item.name}</strong><br><small>${item.email}</small></td>
                <td>${item.vehicle_interest || 'General'}</td>
                <td>${item.budget || '—'}</td>
                <td><button class="ep-btn ep-btn-sec" onclick="alert('Message:\\n\\n${(item.message || 'No message').replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">View</button></td>
            </tr>
        `).join('');
    }

    window.filterInventory = () => {
        const query = document.getElementById('inv-search').value.toLowerCase();
        renderInventory(inventoryData.filter(i => 
            i.make.toLowerCase().includes(query) || i.name.toLowerCase().includes(query) || i.cat.toLowerCase().includes(query)
        ));
    };

    // --- CRUD ACTIONS ---

    window.openCarForm = () => {
        editingId = null;
        document.getElementById('car-form').reset();
        document.getElementById('modal-title').innerText = "Add Vehicle";
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    window.editCar = (id) => {
        editingId = id;
        const car = inventoryData.find(c => c.id === id);
        const form = document.getElementById('car-form');
        document.getElementById('modal-title').innerText = "Edit Vehicle #" + id;
        for (let key in car) if (form.elements[key]) form.elements[key].value = car[key];
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    window.deleteCar = async (id) => {
        if (!confirm("Are you sure you want to remove this vehicle? This will immediately remove it from the live site.")) return;
        const { error } = await sb.from('inventory').delete().eq('id', id);
        if (error) alert(error.message);
        loadData();
    };

})();
