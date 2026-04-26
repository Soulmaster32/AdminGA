/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V3.0 PRO)
   Features: Full CRUD, Advanced Live Sync, Form Hijacking, Dynamic Renders
================================================================ */

(function () {
    'use strict';

    const SUPABASE_URL = 'https://doycdipvtyflshhsxqqx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk';

    let sb = null;
    let currentUser = null;
    let inventoryData = [];
    let inquiriesData =[];
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
            #ep-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(10px); z-index: 11000; display: none; font-family: 'Montserrat', sans-serif; color: #eee; overflow-y: auto; }
            .ep-container { max-width: 1150px; margin: 40px auto; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
            .ep-header { padding: 20px 30px; background: #111; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
            .ep-nav { display: flex; background: #111; border-bottom: 1px solid #222; }
            .ep-nav-btn { padding: 15px 25px; border: none; background: none; color: #777; cursor: pointer; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; transition: 0.3s; }
            .ep-nav-btn:hover { color: #fff; }
            .ep-nav-btn.active { color: var(--p); border-bottom: 2px solid var(--p); background: rgba(255,59,48,0.05); }
            .ep-content { padding: 30px; }
            
            /* Inputs */
            .ep-input { width: 100%; padding: 12px; background: #1a1a1d; border: 1px solid #333; color: #fff; border-radius: 6px; margin-bottom: 15px; font-family: inherit; font-size:0.85rem;}
            .ep-input:focus { border-color: var(--p); outline: none; }
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; }
            
            /* Buttons */
            .ep-btn { padding: 10px 20px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 0.75rem; letter-spacing:1px; }
            .ep-btn-p { background: var(--p); color: #fff; }
            .ep-btn-p:hover { background: #d63026; box-shadow: 0 4px 15px rgba(255,59,48,0.4); }
            .ep-btn-sec { background: #333; color: #fff; border: 1px solid #444; }
            .ep-btn-sec:hover { background: #444; border-color: #666; }
            
            /* Tables */
            .ep-table { width: 100%; border-collapse: collapse; margin-top: 20px; background: var(--card); border-radius: 8px; overflow: hidden; }
            .ep-table th { text-align: left; padding: 15px; background: #111; color: var(--p); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; }
            .ep-table td { padding: 15px; border-bottom: 1px solid #222; font-size: 0.85rem; vertical-align: middle; }
            .ep-table tr:hover td { background: rgba(255,255,255,0.02); }
            .ep-status { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
            .status-live { background: rgba(37,211,102,0.1); color: #25d366; border: 1px solid rgba(37,211,102,0.2); }

            /* Floating Admin Trigger */
            #ep-admin-trigger { 
                position: fixed; bottom: 20px; left: 20px; width: 55px; height: 55px; 
                border-radius: 50%; background: linear-gradient(135deg, var(--p), #c0392b); 
                color: white; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; 
                z-index: 10000; box-shadow: 0 4px 20px rgba(255,59,48,0.5); 
                display: flex; align-items: center; justify-content: center; 
                font-size: 1.3rem; transition: 0.3s; 
            }
            #ep-admin-trigger:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(255,59,48,0.7); }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <button id="ep-admin-trigger" title="Elite Admin Panel"><i class="fas fa-user-shield"></i></button>
            <div id="ep-overlay">
                <div class="ep-container">
                    <div class="ep-header">
                        <div style="font-weight: 800; font-size: 1.2rem; letter-spacing: 2px;">ELITE <span style="color:var(--p)">ROUTE</span> ADMIN</div>
                        <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-overlay').style.display='none'"><i class="fas fa-times"></i> Close</button>
                    </div>

                    <div id="ep-login-form" style="padding: 60px 40px; max-width: 420px; margin: 40px auto; text-align: center; background: var(--card); border: 1px solid var(--border); border-radius: 10px;">
                        <i class="fas fa-lock" style="font-size: 2.5rem; color: var(--p); margin-bottom: 20px;"></i>
                        <h2 style="margin-bottom: 25px; font-weight: 700;">Secure Login</h2>
                        <input type="email" id="ep-email" class="ep-input" placeholder="Admin Email">
                        <input type="password" id="ep-pass" class="ep-input" placeholder="Password">
                        <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width: 100%; margin-top: 10px;">Access Panel</button>
                    </div>

                    <div id="ep-main-panel" style="display: none;">
                        <div class="ep-nav">
                            <button class="ep-nav-btn active" data-tab="tab-inventory"><i class="fas fa-car"></i> Inventory</button>
                            <button class="ep-nav-btn" data-tab="tab-leads"><i class="fas fa-envelope-open-text"></i> Sales Inquiries</button>
                            <button class="ep-nav-btn" data-tab="tab-quotes"><i class="fas fa-file-invoice-dollar"></i> General Quotes</button>
                            <button class="ep-nav-btn" id="ep-logout" style="margin-left: auto; color: #ff4444;"><i class="fas fa-sign-out-alt"></i> Logout</button>
                        </div>

                        <div class="ep-content">
                            <!-- INVENTORY TAB -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <div>
                                        <h3 style="margin-bottom: 5px;">Vehicle Catalog</h3>
                                        <small style="color: #888;">Live-synced with the frontend showroom</small>
                                    </div>
                                    <button class="ep-btn ep-btn-p" onclick="window.openCarForm()"><i class="fas fa-plus"></i> Add New Vehicle</button>
                                </div>
                                <input type="text" id="inv-search" class="ep-input" placeholder="Search by make, name or category..." onkeyup="window.filterInventory()">
                                <table class="ep-table">
                                    <thead>
                                        <tr><th>ID</th><th>Vehicle</th><th>Price</th><th>Category</th><th>Badge</th><th>Actions</th></tr>
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

            <!-- CAR EDIT MODAL (IMPROVED CRUD) -->
            <div id="ep-car-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:12000; padding:40px; overflow-y:auto;">
                <div style="max-width: 900px; margin: 0 auto; background: var(--bg); padding: 35px; border-radius: 10px; border: 1px solid var(--p);">
                    <h2 id="modal-title" style="margin-bottom: 5px;">Add Vehicle</h2>
                    <small style="color: #888; display:block; margin-bottom:20px;">Ensure new columns (tags, old_price, engine, power, drive, imgs) exist in Supabase for full functionality.</small>
                    <form id="car-form" class="ep-grid">
                        <div><label style="font-size:0.75rem; color:#aaa;">Make</label><input name="make" class="ep-input" required placeholder="e.g. Mercedes-Benz"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Model Name</label><input name="name" class="ep-input" required placeholder="e.g. G63 AMG"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Price</label><input name="price" class="ep-input" placeholder="e.g. $215,000"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Old Price</label><input name="old_price" class="ep-input" placeholder="e.g. $230,000"></div>
                        
                        <div><label style="font-size:0.75rem; color:#aaa;">Category</label>
                            <select name="cat" class="ep-input">
                                <option value="luxury">Luxury</option>
                                <option value="suv">SUV</option>
                                <option value="exotic">Exotic</option>
                                <option value="fleet">Fleet</option>
                            </select>
                        </div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Badge</label><input name="badge" class="ep-input" placeholder="e.g. HOT, ARMOR"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Sold Text</label><input name="sold" class="ep-input" placeholder="e.g. 15 Exported"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Tags (Comma separated)</label><input name="tags" class="ep-input" placeholder="e.g. V8, LHD, AWD"></div>
                        
                        <div><label style="font-size:0.75rem; color:#aaa;">Engine Spec</label><input name="engine" class="ep-input" placeholder="e.g. 4.0L BiTurbo V8"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Power Spec</label><input name="power" class="ep-input" placeholder="e.g. 577 HP"></div>
                        <div><label style="font-size:0.75rem; color:#aaa;">Drive Type</label><input name="drive" class="ep-input" placeholder="e.g. AWD / 4MATIC"></div>
                        
                        <div style="grid-column: span 3;"><label style="font-size:0.75rem; color:#aaa;">Main Image URL</label><input name="img" class="ep-input" placeholder="https://..." required></div>
                        <div style="grid-column: span 3;"><label style="font-size:0.75rem; color:#aaa;">Gallery URLs (Comma separated)</label><input name="imgs" class="ep-input" placeholder="https://img1, https://img2"></div>
                        
                        <div style="grid-column: span 3; border-top: 1px solid #333; padding-top: 20px; text-align: right;">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-car-modal').style.display='none'" style="margin-right: 10px;">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Vehicle</button>
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
        
        // Wait for DOM to finish loading to hook into the page's forms seamlessly
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hookFrontendForms);
        } else {
            hookFrontendForms();
        }

        checkSession();
    }

    // 3. SECRETY HIJACK FRONTEND FORMS 
    // This allows index2.html's original design/toasts to run while secretly feeding Supabase!
    function hookFrontendForms() {
        // A. Inquiry Modal Form
        const inqForm = document.getElementById('inqForm');
        if (inqForm) {
            inqForm.addEventListener('submit', async () => {
                const inputs = inqForm.querySelectorAll('input, select, textarea');
                const payload = {
                    name: inputs[0]?.value || 'N/A',
                    email: inputs[1]?.value || 'N/A',
                    phone: inputs[2]?.value || '',
                    destination: inputs[3]?.value || '',
                    notes: inputs[4]?.value || '',
                    car_title: document.getElementById('inqTitle')?.innerText || 'Specific Vehicle Inquiry'
                };
                await sb.from('inquiries').insert([payload]);
                loadData(); // Sync admin panel in background
            });
        }

        // B. General Quote Modal Form
        const quoteForm = document.getElementById('quoteForm');
        if (quoteForm) {
            quoteForm.addEventListener('submit', async () => {
                const inputs = quoteForm.querySelectorAll('input, select, textarea');
                const payload = {
                    name: inputs[0]?.value || 'N/A',
                    email: inputs[1]?.value || 'N/A',
                    vehicle_interest: inputs[2]?.value || '',
                    destination: inputs[3]?.value || '',
                    budget: inputs[4]?.value || '',
                    message: inputs[5]?.value || ''
                };
                await sb.from('quotes').insert([payload]);
                loadData(); // Sync admin panel in background
            });
        }

        // C. Contact Section Form (Footer/Contact Area)
        const contactForm = document.querySelector('#contact form');
        if (contactForm) {
            contactForm.addEventListener('submit', async () => {
                const inputs = contactForm.querySelectorAll('input, select, textarea');
                const payload = {
                    name: inputs[0]?.value || 'N/A',
                    email: inputs[1]?.value || 'N/A',
                    destination: inputs[2]?.value || '',
                    notes: inputs[3]?.value || '', // Storing specific requirements in notes
                    car_title: 'Contact Section General Inquiry'
                };
                await sb.from('inquiries').insert([payload]);
                loadData(); // Sync admin panel in background
            });
        }
    }

    function setupEventListeners() {
        // Trigger Panel
        document.getElementById('ep-admin-trigger').onclick = () => {
            document.getElementById('ep-overlay').style.display = 'block';
        };

        // Login / Logout
        document.getElementById('ep-login-btn').onclick = login;
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

            // Warning: If backend doesn't have the new extended columns yet, it will alert.
            if (editingId) {
                const { error } = await sb.from('inventory').update(carObj).eq('id', editingId);
                if (error) alert("Update Error (Ensure extended columns exist in Supabase!): \n" + error.message);
            } else {
                const { error } = await sb.from('inventory').insert([carObj]);
                if (error) alert("Insert Error (Ensure extended columns exist in Supabase!): \n" + error.message);
            }
            
            document.getElementById('ep-car-modal').style.display = 'none';
            loadData(); // This auto-fetches data and updates index2.html!
        };
    }




// 4. AUTHENTICATION
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

    // 5. DATA OPERATIONS & FRONTEND SYNCING
    async function loadData() {
        // Fetch Inventory
        const { data: inv } = await sb.from('inventory').select('*').order('id', { ascending: false });
        if (inv) {
            inventoryData = inv;
            renderInventory(inventoryData);
            syncFrontendInventory(); // Force index2.html to dynamically refresh!
        }

        // Fetch Inquiries
        const { data: inq } = await sb.from('inquiries').select('*').order('created_at', { ascending: false });
        inquiriesData = inq ||[];
        renderLeads(inquiriesData);

        // Fetch Quotes
        const { data: qts } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
        renderQuotes(qts ||[]);
    }

    function syncFrontendInventory() {
        // Check if index2.html's global `products` array and render function are available
        if (typeof products !== 'undefined' && Array.isArray(products) && typeof window.renderProducts === 'function') {
            
            // Map Database structure to index2.html's required structure
            const newProducts = inventoryData.map(item => {
                return {
                    id: item.id,
                    make: item.make || 'Unknown',
                    name: item.name || 'Vehicle Model',
                    badge: item.badge || '',
                    bc: item.cat === 'suv' ? '' : (item.badge === 'HOT' ? 'hot' : item.cat),
                    price: item.price || 'On Request',
                    old: item.old_price || '',
                    sold: item.sold || '0 Exported',
                    img: item.img || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
                    imgs: item.imgs ? item.imgs.split(',').map(url => url.trim()) : [item.img],
                    tags: item.tags ? item.tags.split(',').map(t => t.trim()) :['Premium', 'LHD'],
                    cat: item.cat || 'luxury',
                    specs: {
                        Engine: item.engine || 'N/A',
                        Power: item.power || 'N/A',
                        Drive: item.drive || 'AWD / 4WD',
                        Transmission: 'Automatic'
                    },
                    export: {
                        Shipping: 'RoRo / Container',
                        "Lead Time": '4–8 Weeks',
                        Origin: 'UAE / Global',
                        Warranty: 'Available'
                    }
                };
            });

            // Mutate the original `const products` array safely
            products.length = 0; 
            products.push(...newProducts);

            // Re-render the grid maintaining the current active filter
            const activeFilter = window.activeFilter || 'all';
            window.renderProducts(activeFilter);
        }
    }

    // --- RENDERERS ---

    function renderInventory(data) {
        const container = document.getElementById('inv-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td>#${item.id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${item.img}" style="width:50px; height:35px; object-fit:cover; border-radius:4px; border:1px solid #333;">
                        <div>
                            <strong style="color:#fff;">${item.make}</strong><br>
                            <small style="color:#aaa;">${item.name}</small>
                        </div>
                    </div>
                </td>
                <td style="color:var(--p); font-weight:700;">${item.price || 'N/A'}</td>
                <td><span class="ep-status status-live">${item.cat || 'N/A'}</span></td>
                <td>${item.badge || '—'}</td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="window.editCar(${item.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="ep-btn ep-btn-sec" style="color:#ff4444; border-color:rgba(255,68,68,0.3);" onclick="window.deleteCar(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderLeads(data) {
        const container = document.getElementById('leads-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#aaa;">${new Date(item.created_at).toLocaleDateString()}</td>
                <td><strong style="color:#fff;">${item.name}</strong><br><small style="color:var(--p);">${item.email}</small><br><small style="color:#777;">${item.phone || 'No Phone'}</small></td>
                <td>${item.car_title || 'General'}</td>
                <td>${item.destination || 'Not Specified'}</td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="alert('Message / Requirements:\\n\\n${(item.notes || 'No message attached.').replace(/'/g, "\\'")}')"><i class="fas fa-eye"></i> View Notes</button>
                </td>
            </tr>
        `).join('');
    }

    function renderQuotes(data) {
        const container = document.getElementById('quotes-list');
        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#aaa;">${new Date(item.created_at).toLocaleDateString()}</td>
                <td><strong style="color:#fff;">${item.name}</strong><br><small style="color:var(--p);">${item.email}</small></td>
                <td>${item.vehicle_interest || 'General'}</td>
                <td><span style="color:#25d366;">${item.budget || '—'}</span></td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="alert('Client Message:\\n\\n${(item.message || 'No message.').replace(/'/g, "\\'")}')"><i class="fas fa-eye"></i> View</button>
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
        
        // Populate form dynamically
        for (let key in car) {
            if (form.elements[key]) form.elements[key].value = car[key];
        }
        
        document.getElementById('ep-car-modal').style.display = 'block';
    };

    window.deleteCar = async (id) => {
        if (!confirm("Warning: Are you sure you want to completely remove this vehicle?")) return;
        const { error } = await sb.from('inventory').delete().eq('id', id);
        if (error) alert("Deletion Failed: " + error.message);
        loadData(); // Resyncs and automatically wipes the car from index2.html
    };

})();

       

   












   

    
