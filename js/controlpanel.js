/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V2.0 PRO)
   Features: Full CRUD, Search, View, Real-time Sync
================================================================ */

(function () {
    'use strict';

    const SUPABASE_URL = 'https://doycdipvtyflshhsxqqx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk';

    let sb = null;
    let currentUser = null;
    let inventoryData =[];
    let inquiriesData =[];
    let realtimeChannel = null;
    let editingId = null; // Track if we are editing or adding new

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
            #ep-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 10000; display: none; font-family: 'Montserrat', sans-serif; color: #eee; overflow-y: auto; }
            .ep-container { max-width: 1100px; margin: 40px auto; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            .ep-header { padding: 20px; background: #111; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
            .ep-nav { display: flex; background: #111; border-bottom: 1px solid #222; }
            .ep-nav-btn { padding: 15px 25px; border: none; background: none; color: #777; cursor: pointer; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
            .ep-nav-btn.active { color: var(--p); border-bottom: 2px solid var(--p); }
            .ep-content { padding: 30px; }
            
            /* Inputs */
            .ep-input { width: 100%; padding: 12px; background: #1a1a1d; border: 1px solid #333; color: #fff; border-radius: 6px; margin-bottom: 15px; }
            .ep-input:focus { border-color: var(--p); outline: none; }
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            
            /* Buttons */
            .ep-btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 0.7rem; }
            .ep-btn-p { background: var(--p); color: #fff; }
            .ep-btn-p:hover { background: #d63026; }
            .ep-btn-sec { background: #333; color: #fff; }
            .ep-btn-sec:hover { background: #444; }
            
            /* Tables */
            .ep-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .ep-table th { text-align: left; padding: 12px; background: #111; color: var(--p); font-size: 0.7rem; text-transform: uppercase; }
            .ep-table td { padding: 12px; border-bottom: 1px solid #222; font-size: 0.85rem; vertical-align: middle; }
            .ep-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; }
            .status-live { background: rgba(37,211,102,0.1); color: #25d366; }
            
            /* Actions Group */
            .ep-actions { display: flex; gap: 5px; }
            
            /* Toasts */
            #ep-toast-container { position: fixed; top: 20px; right: 20px; z-index: 12000; display: flex; flex-direction: column; gap: 10px; }
            .ep-toast { background: #25d366; color: #fff; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-weight: 600; font-family: sans-serif; font-size: 0.85rem; animation: slideIn 0.3s forwards; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="ep-toast-container"></div>
            
            <div id="ep-overlay">
                <div class="ep-container">
                    <div class="ep-header">
                        <div style="font-weight: 800; font-size: 1.2rem; letter-spacing: 2px;">ELITE <span style="color:var(--p)">ROUTE</span> ADMIN</div>
                        <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-overlay').style.display='none'">Close Panel</button>
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
                            <!-- INVENTORY TAB -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <h3>Vehicle Catalog</h3>
                                    <button class="ep-btn ep-btn-p" onclick="window.openCarForm()">+ Add New Vehicle</button>
                                </div>
                                <input type="text" id="inv-search" class="ep-input" placeholder="Search by make, name or category..." onkeyup="window.filterInventory()">
                                <table class="ep-table">
                                    <thead>
                                        <tr><th>ID</th><th>Vehicle</th><th>Price</th><th>Category</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody id="inv-list"></tbody>
                                </table>
                            </div>

                            <!-- LEADS TAB -->
                            <div id="tab-leads" class="ep-tab-content" style="display: none;">
                                <h3>Active Sales Inquiries</h3>
                                <input type="text" id="leads-search" class="ep-input" placeholder="Search by customer name or email..." onkeyup="window.filterLeads()">
                                <table class="ep-table">
                                    <thead>
                                        <tr><th>Date</th><th>Customer</th><th>Vehicle</th><th>Port</th><th>Action</th></tr>
                                    </thead>
                                    <tbody id="leads-list"></tbody>
                                </table>
                            </div>

                             <!-- QUOTES TAB -->
                             <div id="tab-quotes" class="ep-tab-content" style="display: none;">
                                <h3>General Quote Requests</h3>
                                <table class="ep-table">
                                    <thead>
                                        <tr><th>Date</th><th>Customer</th><th>Interest</th><th>Budget</th><th>Action</th></tr>
                                    </thead>
                                    <tbody id="quotes-list"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CAR EDIT/ADD MODAL -->
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
                        <div><label>Sold Text</label><input name="sold" class="ep-input" placeholder="e.g. 15 Exported"></div>
                        <div style="grid-column: span 2;"><label>Main Image URL</label><input name="img" class="ep-input" placeholder="https://..."></div>
                        <div style="grid-column: span 2;">
                            <button type="submit" class="ep-btn ep-btn-p">Save Vehicle</button>
                            <button type="button" class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-car-modal').style.display='none'">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- CAR VIEW DETAILS MODAL -->
            <div id="ep-view-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:11000; padding:40px; overflow-y:auto;">
                <div style="max-width: 600px; margin: 0 auto; background: #111; padding: 30px; border-radius: 10px; border: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 id="view-title" style="color: var(--p);">Vehicle Details</h2>
                        <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-view-modal').style.display='none'">Close</button>
                    </div>
                    <div id="view-content" style="color: #ccc; line-height: 1.8;"></div>
                </div>
            </div>
        `);
    }

    // Export Global function to open the Admin Panel (attach to a hidden link or button on your site)
    window.openAdminPanel = () => {
        document.getElementById('ep-overlay').style.display = 'block';
    };

    // Show floating notifications
    window.showToast = (message) => {
        const container = document.getElementById('ep-toast-container');
        const toast = document.createElement('div');
        toast.className = 'ep-toast';
        toast.innerHTML = `<i class="fas fa-bell"></i> ${message}`;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 5000);
    };

    // 2. CORE LOGIC
    async function init() {
        injectStyles();
        injectHTML();
        setupEventListeners();
        checkSession();
    }

    function setupEventListeners() {
        // Login
        document.getElementById('ep-login-btn').onclick = login;

        // Logout
        document.getElementById('ep-logout').onclick = logout;

        // Tab Switching
        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.style.display = 'none');
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).style.display = 'block';
                loadData();
            };
        });

        // Car Form Submission (Create/Update)
        document.getElementById('car-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const carObj = Object.fromEntries(formData.entries());

            if (editingId) {
                // Update Existing
                const { error } = await sb.from('inventory').update(carObj).eq('id', editingId);
                if (error) alert(error.message);
                else window.showToast('Vehicle Updated Successfully!');
            } else {
                // Add New
                const { error } = await sb.from('inventory').insert([carObj]);
                if (error) alert(error.message);
                else window.showToast('Vehicle Added Successfully!');
            }
            
            document.getElementById('ep-car-modal').style.display = 'none';
            loadData();
        };
    }

    // 3. AUTHENTICATION & REALTIME
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
        if(realtimeChannel) {
            sb.removeChannel(realtimeChannel);
        }
        document.getElementById('ep-login-form').style.display = 'block';
        document.getElementById('ep-main-panel').style.display = 'none';
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
        setupRealtimeSubscriptions();
    }

    // Subscribe to new leads and quotes as they arrive from customers
    function setupRealtimeSubscriptions() {
        if(realtimeChannel) return; // Prevent duplicate listeners

        realtimeChannel = sb.channel('admin-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, payload => {
                window.showToast('🔔 New Customer Inquiry Received!');
                loadData(); // Refresh tables instantly
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quotes' }, payload => {
                window.showToast('🔔 New Quote Request Received!');
                loadData();
            })
            .subscribe();
    }

    // 4. DATA OPERATIONS
    async function loadData() {
        // Fetch Inventory
        const { data: inv } = await sb.from('inventory').select('*').order('id', { ascending: false });
        inventoryData = inv ||[];
        renderInventory(inventoryData);

        // Fetch Inquiries
        const { data: inq } = await sb.from('inquiries').select('*').order('created_at', { ascending: false });
        inquiriesData = inq ||[];
        renderLeads(inquiriesData);

        // Fetch Quotes
        const { data: qts } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
        renderQuotes(qts ||[]);
    }

    // --- RENDERERS ---

    function renderInventory(data) {
        const container = document.getElementById('inv-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td><strong>${item.make}</strong> ${item.name}</td>
                <td>${item.price || 'N/A'}</td>
                <td><span class="ep-status status-live">${item.cat}</span></td>
                <td>
                    <div class="ep-actions">
                        <button class="ep-btn ep-btn-sec" style="font-size: 0.6rem; padding: 6px 10px;" onclick="window.viewCar(${item.id})">View</button>
                        <button class="ep-btn ep-btn-sec" style="font-size: 0.6rem; padding: 6px 10px;" onclick="window.editCar(${item.id})">Edit</button>
                        <button class="ep-btn ep-btn-sec" style="color:#ff4444; font-size: 0.6rem; padding: 6px 10px;" onclick="window.deleteCar(${item.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderLeads(data) {
        const container = document.getElementById('leads-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td><strong>${item.name}</strong><br><small>${item.email}</small></td>
                <td>${item.car_title || 'N/A'}</td>
                <td>${item.destination || 'N/A'}</td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="alert('Message from ${item.name}:\\n\\n${item.notes || 'No additional message provided.'}')">Read Message</button>
                </td>
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
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="alert('Quote Info from ${item.name}:\\n\\n${item.message || 'No additional message provided.'}')">Read Details</button>
                </td>
            </tr>
        `).join('');
    }

    // --- SEARCH / FILTER ---

    window.filterInventory = () => {
        const query = document.getElementById('inv-search').value.toLowerCase();
        const filtered = inventoryData.filter(i => 
            (i.make && i.make.toLowerCase().includes(query)) || 
            (i.name && i.name.toLowerCase().includes(query)) || 
            (i.cat && i.cat.toLowerCase().includes(query))
        );
        renderInventory(filtered);
    };

    window.filterLeads = () => {
        const query = document.getElementById('leads-search').value.toLowerCase();
        const filtered = inquiriesData.filter(i => 
            (i.name && i.name.toLowerCase().includes(query)) || 
            (i.email && i.email.toLowerCase().includes(query))
        );
        renderLeads(filtered);
    };

    // --- CRUD ACTIONS ---

    // 1. ADD
    window.openCarForm = () => {
        editingId = null;
        document.getElementById('car-form').reset();
        document.getElementById('modal-title').innerText = "Add New Vehicle";
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    // 2. EDIT
    window.editCar = (id) => {
        editingId = id;
        const car = inventoryData.find(c => c.id === id);
        if (!car) return;

        const form = document.getElementById('car-form');
        document.getElementById('modal-title').innerText = "Update Vehicle (ID: " + id + ")";
        
        // Populate form
        for (let key in car) {
            if (form.elements[key]) form.elements[key].value = car[key];
        }
        
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    // 3. DELETE
    window.deleteCar = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this vehicle?")) return;
        const { error } = await sb.from('inventory').delete().eq('id', id);
        
        if (error) alert(error.message);
        else window.showToast("Vehicle Deleted Successfully!");
        
        loadData();
    };

    // 4. VIEW DETAILS
    window.viewCar = (id) => {
        const car = inventoryData.find(c => c.id === id);
        if (!car) return;

        document.getElementById('view-title').innerText = `${car.make} ${car.name}`;
        
        const contentHTML = `
            ${car.img ? `<img src="${car.img}" alt="Vehicle" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px; margin-bottom:15px; border: 1px solid #333;"/>` : '<div style="padding: 20px; background: #222; text-align:center; border-radius: 8px; margin-bottom: 15px;">No Image Provided</div>'}
            <div class="ep-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
                <p><strong>Database ID:</strong> ${car.id}</p>
                <p><strong>Price:</strong> ${car.price || 'N/A'}</p>
                <p><strong>Category:</strong> <span class="ep-status status-live">${car.cat || 'N/A'}</span></p>
                <p><strong>Badge:</strong> ${car.badge || 'None'}</p>
                <p><strong>Sold Info:</strong> ${car.sold || 'None'}</p>
            </div>
        `;
        
        document.getElementById('view-content').innerHTML = contentHTML;
        document.getElementById('ep-view-modal').style.display = 'block';
    };

})();
