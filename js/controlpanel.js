/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V2.1 PRO)
   Features: Full CRUD, Search, Real-time Sync, Toast Notifications,
             Improved UX, Image Preview, Notes Modal, Stats Dashboard
================================================================ */

(function () {
    'use strict';

    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = 'https://doycdipvtyflshhsxqqx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk';

    let sb = null;
    let currentUser = null;
    let inventoryData = [];
    let inquiriesData = [];
    let quotesData = [];
    let editingId = null;

    // Dynamically load Supabase then initialize
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
            :root {
                --ep-p: #ff3b30;
                --ep-bg: #0a0a0c;
                --ep-card: #151518;
                --ep-border: rgba(255,59,48,0.2);
            }

            /* ---- Overlay ---- */
            #ep-overlay {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.92);
                backdrop-filter: blur(12px);
                z-index: 10000; display: none;
                font-family: 'Montserrat', sans-serif;
                color: #eee; overflow-y: auto;
            }
            .ep-container {
                max-width: 1140px; margin: 36px auto;
                background: var(--ep-bg);
                border: 1px solid var(--ep-border);
                border-radius: 14px; overflow: hidden;
                box-shadow: 0 24px 60px rgba(0,0,0,0.85);
            }
            .ep-header {
                padding: 20px 30px;
                background: #111;
                border-bottom: 1px solid var(--ep-border);
                display: flex; justify-content: space-between; align-items: center;
            }

            /* ---- Nav tabs ---- */
            .ep-nav {
                display: flex; background: #111;
                border-bottom: 1px solid #222;
                flex-wrap: wrap;
            }
            .ep-nav-btn {
                padding: 16px 26px; border: none;
                background: none; color: #777; cursor: pointer;
                font-weight: 600; text-transform: uppercase;
                font-size: 0.72rem; letter-spacing: 1px; transition: 0.3s;
            }
            .ep-nav-btn:hover { color: #fff; }
            .ep-nav-btn.active {
                color: var(--ep-p);
                border-bottom: 2px solid var(--ep-p);
                background: rgba(255,59,48,0.05);
            }
            .ep-content { padding: 30px; min-height: 480px; }

            /* ---- Inputs ---- */
            .ep-input {
                width: 100%; padding: 11px 15px;
                background: #1a1a1d; border: 1px solid #333;
                color: #fff; border-radius: 6px; margin-bottom: 14px;
                font-family: inherit; font-size: 0.85rem; transition: 0.3s;
                appearance: none;
            }
            .ep-input:focus { border-color: var(--ep-p); outline: none; box-shadow: 0 0 0 3px rgba(255,59,48,0.12); }
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }

            /* ---- Buttons ---- */
            .ep-btn {
                padding: 9px 18px; border-radius: 6px; border: none;
                font-weight: 700; cursor: pointer; transition: 0.3s;
                text-transform: uppercase; font-size: 0.7rem;
                letter-spacing: 1px; display: inline-flex;
                align-items: center; gap: 7px;
            }
            .ep-btn-p { background: var(--ep-p); color: #fff; }
            .ep-btn-p:hover { background: #d63026; transform: translateY(-1px); }
            .ep-btn-p:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
            .ep-btn-sec { background: #2a2a2d; color: #ccc; border: 1px solid #3a3a3d; }
            .ep-btn-sec:hover { background: #3a3a3d; border-color: #555; color: #fff; }
            .ep-btn-danger { background: rgba(255,68,68,0.1); color: #ff5555; border: 1px solid rgba(255,68,68,0.3); }
            .ep-btn-danger:hover { background: rgba(255,68,68,0.2); }

            /* ---- Tables ---- */
            .ep-table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 0.84rem; }
            .ep-table th {
                text-align: left; padding: 13px 14px;
                background: #151518; color: var(--ep-p);
                font-size: 0.68rem; text-transform: uppercase;
                letter-spacing: 1px; border-bottom: 1px solid #333;
            }
            .ep-table td { padding: 13px 14px; border-bottom: 1px solid #1e1e21; vertical-align: middle; }
            .ep-table tr:last-child td { border-bottom: none; }
            .ep-table tr:hover td { background: rgba(255,255,255,0.02); }
            .ep-empty { text-align: center; padding: 50px 20px; color: #555; font-size: 0.85rem; }

            /* ---- Status pills ---- */
            .ep-status {
                display: inline-block; padding: 3px 9px;
                border-radius: 4px; font-size: 0.63rem;
                font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            }
            .status-live { background: rgba(37,211,102,0.1); color: #25d366; border: 1px solid rgba(37,211,102,0.2); }
            .status-suv   { background: rgba(80,130,255,0.12); color: #7aabff; border: 1px solid rgba(80,130,255,0.2); }
            .status-exotic { background: rgba(200,100,255,0.12); color: #d07aff; border: 1px solid rgba(200,100,255,0.2); }
            .status-fleet  { background: rgba(255,180,50,0.12); color: #f5b842; border: 1px solid rgba(255,180,50,0.2); }

            /* ---- Admin FAB ---- */
            #ep-admin-trigger {
                position: fixed; bottom: 25px; right: 25px;
                width: 54px; height: 54px; border-radius: 50%;
                background: var(--ep-p); color: white; border: none;
                cursor: pointer; z-index: 9999;
                box-shadow: 0 4px 20px rgba(255,59,48,0.55);
                display: flex; align-items: center; justify-content: center;
                font-size: 1.25rem; transition: 0.3s;
            }
            #ep-admin-trigger:hover { transform: scale(1.1) rotate(10deg); background: #d63026; }

            /* ---- Stats cards ---- */
            .ep-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 26px; }
            .ep-stat-card {
                background: #151518; border: 1px solid #252528;
                border-radius: 8px; padding: 18px 20px;
                display: flex; align-items: center; gap: 14px;
            }
            .ep-stat-icon {
                width: 42px; height: 42px; border-radius: 8px;
                background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2);
                display: flex; align-items: center; justify-content: center;
                font-size: 1.1rem; color: var(--ep-p); flex-shrink: 0;
            }
            .ep-stat-num { font-size: 1.6rem; font-weight: 700; line-height: 1; color: #fff; }
            .ep-stat-lbl { font-size: 0.65rem; color: #777; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

            /* ---- Toast ---- */
            #ep-toast {
                position: fixed; bottom: 30px; left: 50%;
                transform: translateX(-50%) translateY(12px);
                background: #1a2e1e; border: 1px solid #3a7a4a;
                border-radius: 7px; padding: 12px 22px;
                display: flex; align-items: center; gap: 9px;
                font-size: 0.84rem; color: #7de095;
                z-index: 99999; opacity: 0; transition: all 0.35s;
                pointer-events: none; white-space: nowrap;
                box-shadow: 0 8px 28px rgba(0,0,0,0.6);
            }
            #ep-toast.ep-show { opacity: 1; transform: translateX(-50%) translateY(0); }
            #ep-toast.ep-error { background: #2e1a1a; border-color: #7a3a3a; color: #e07070; }

            /* ---- Notes modal ---- */
            #ep-notes-modal {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.88); backdrop-filter: blur(6px);
                z-index: 12000; display: none;
                align-items: center; justify-content: center; padding: 20px;
            }
            #ep-notes-modal.open { display: flex; }
            .ep-notes-box {
                background: #151518; border: 1px solid var(--ep-border);
                border-radius: 12px; padding: 32px; max-width: 540px;
                width: 100%; position: relative;
                box-shadow: 0 12px 40px rgba(0,0,0,0.7);
            }
            .ep-notes-box h4 {
                font-size: 0.7rem; letter-spacing: 3px;
                text-transform: uppercase; color: var(--ep-p);
                margin-bottom: 16px;
            }
            .ep-notes-text {
                background: #0d0d0f; border: 1px solid #2a2a2d;
                border-radius: 6px; padding: 16px;
                font-size: 0.88rem; color: #ccc; line-height: 1.75;
                white-space: pre-wrap; max-height: 300px; overflow-y: auto;
                margin-bottom: 18px;
            }

            /* ---- Car form modal ---- */
            #ep-car-modal {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.95); backdrop-filter: blur(6px);
                z-index: 11000; display: none;
                padding: 30px; overflow-y: auto;
            }
            .ep-car-box {
                max-width: 820px; margin: 30px auto;
                background: #151518; padding: 36px;
                border-radius: 12px;
                border: 1px solid var(--ep-p);
                box-shadow: 0 10px 40px rgba(255,59,48,0.18);
            }

            /* ---- Image preview ---- */
            #ep-img-preview {
                width: 100%; height: 140px; object-fit: cover;
                border-radius: 6px; border: 1px solid #333;
                background: #111; display: none;
                margin-bottom: 10px;
            }
            #ep-img-preview.visible { display: block; }

            /* ---- Label helper ---- */
            .ep-label {
                display: block; font-size: 0.68rem; color: #888;
                margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;
            }

            /* ---- Search row ---- */
            .ep-search-wrap { position: relative; margin-bottom: 18px; }
            .ep-search-wrap i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #555; font-size: 0.82rem; }
            .ep-search-wrap .ep-input { padding-left: 38px; margin-bottom: 0; }

            /* Responsive tweaks */
            @media (max-width: 600px) {
                .ep-container { margin: 10px; border-radius: 10px; }
                .ep-content { padding: 18px; }
                .ep-car-box { padding: 20px; }
                .ep-grid { grid-template-columns: 1fr; }
            }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <!-- Toast -->
            <div id="ep-toast"><i class="ep-ti fas fa-check-circle"></i><span id="ep-toast-msg"></span></div>

            <!-- Floating Admin Button -->
            <button id="ep-admin-trigger" title="Open Admin Panel"><i class="fas fa-user-shield"></i></button>

            <!-- Main Overlay -->
            <div id="ep-overlay">
                <div class="ep-container">
                    <div class="ep-header">
                        <div style="font-weight:800;font-size:1.25rem;letter-spacing:3px;">
                            ELITE <span style="color:var(--ep-p)">ROUTE</span>
                            <span style="font-weight:400;color:#555;font-size:0.9rem;"> | ADMIN SUITE</span>
                        </div>
                        <button class="ep-btn ep-btn-sec" id="ep-overlay-close"><i class="fas fa-times"></i> Close</button>
                    </div>

                    <!-- Login Form -->
                    <div id="ep-login-form" style="padding:70px 20px;max-width:420px;margin:0 auto;text-align:center;">
                        <div style="font-size:2.8rem;color:var(--ep-p);margin-bottom:18px;"><i class="fas fa-lock"></i></div>
                        <h2 style="margin-bottom:6px;font-weight:700;letter-spacing:1px;">Secure Access</h2>
                        <p style="font-size:0.8rem;color:#666;margin-bottom:28px;">Elite Route Admin Panel</p>
                        <label class="ep-label">Admin Email</label>
                        <input type="email" id="ep-email" class="ep-input" placeholder="admin@eliteroute.com">
                        <label class="ep-label">Password</label>
                        <input type="password" id="ep-pass" class="ep-input" placeholder="••••••••">
                        <!-- FIX: Login error message shown inline -->
                        <div id="ep-login-error" style="color:#ff5555;font-size:0.78rem;margin-bottom:12px;display:none;"></div>
                        <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width:100%;justify-content:center;padding:13px;font-size:0.8rem;">
                            Authenticate <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    <!-- Admin Dashboard -->
                    <div id="ep-main-panel" style="display:none;">
                        <div class="ep-nav">
                            <button class="ep-nav-btn active" data-tab="tab-inventory"><i class="fas fa-car"></i> Inventory</button>
                            <button class="ep-nav-btn" data-tab="tab-leads"><i class="fas fa-inbox"></i> Inquiries</button>
                            <button class="ep-nav-btn" data-tab="tab-quotes"><i class="fas fa-file-invoice-dollar"></i> Quotes</button>
                            <button class="ep-nav-btn" id="ep-logout" style="margin-left:auto;color:#ff5555;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>

                        <div class="ep-content">

                            <!-- INVENTORY TAB -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div id="ep-stats" class="ep-stats"></div>
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
                                    <h3 style="font-weight:700;letter-spacing:1px;">Vehicle Catalog</h3>
                                    <button class="ep-btn ep-btn-p" onclick="window.openCarForm()"><i class="fas fa-plus"></i> Add New Vehicle</button>
                                </div>
                                <div class="ep-search-wrap">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="inv-search" class="ep-input" placeholder="Search by make, model or category…" oninput="window.filterInventory()">
                                </div>
                                <div style="overflow-x:auto;">
                                    <table class="ep-table">
                                        <thead><tr><th>#</th><th>Vehicle</th><th>Price</th><th>Category</th><th>Badge</th><th>Actions</th></tr></thead>
                                        <tbody id="inv-list"></tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- INQUIRIES TAB -->
                            <div id="tab-leads" class="ep-tab-content" style="display:none;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
                                    <h3 style="font-weight:700;letter-spacing:1px;">Active Sales Inquiries</h3>
                                    <span id="leads-count" style="font-size:0.75rem;color:#777;"></span>
                                </div>
                                <div style="overflow-x:auto;">
                                    <table class="ep-table">
                                        <thead><tr><th>Date</th><th>Client</th><th>Vehicle</th><th>Destination</th><th>Notes</th></tr></thead>
                                        <tbody id="leads-list"></tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- QUOTES TAB -->
                            <div id="tab-quotes" class="ep-tab-content" style="display:none;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
                                    <h3 style="font-weight:700;letter-spacing:1px;">General Quote Requests</h3>
                                    <span id="quotes-count" style="font-size:0.75rem;color:#777;"></span>
                                </div>
                                <div style="overflow-x:auto;">
                                    <table class="ep-table">
                                        <thead><tr><th>Date</th><th>Client</th><th>Requirements</th><th>Budget</th><th>Message</th></tr></thead>
                                        <tbody id="quotes-list"></tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <!-- Notes Modal (replaces alert()) -->
            <div id="ep-notes-modal">
                <div class="ep-notes-box">
                    <h4 id="ep-notes-title">Message Details</h4>
                    <div id="ep-notes-text" class="ep-notes-text"></div>
                    <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-notes-modal').classList.remove('open')">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>

            <!-- Car Add / Edit Modal -->
            <div id="ep-car-modal">
                <div class="ep-car-box">
                    <h2 id="ep-modal-title" style="margin-bottom:22px;font-weight:700;letter-spacing:1px;color:#fff;">Add Vehicle</h2>
                    <form id="car-form" class="ep-grid">
                        <div>
                            <label class="ep-label">Make *</label>
                            <input name="make" class="ep-input" required placeholder="e.g. Mercedes-Benz">
                        </div>
                        <div>
                            <label class="ep-label">Model Name *</label>
                            <input name="name" class="ep-input" required placeholder="e.g. G63 AMG">
                        </div>
                        <div>
                            <label class="ep-label">Price</label>
                            <input name="price" class="ep-input" placeholder="e.g. $215,000 or On Request">
                        </div>
                        <div>
                            <label class="ep-label">Old Price (strikethrough)</label>
                            <input name="old" class="ep-input" placeholder="e.g. $230K (Optional)">
                        </div>
                        <div>
                            <label class="ep-label">Category</label>
                            <select name="cat" class="ep-input">
                                <option value="luxury">Luxury</option>
                                <option value="suv">SUV</option>
                                <option value="exotic">Exotic</option>
                                <option value="fleet">Fleet</option>
                            </select>
                        </div>
                        <div>
                            <label class="ep-label">Badge Text</label>
                            <input name="badge" class="ep-input" placeholder="e.g. HOT, LUXURY, ARMORED">
                        </div>
                        <div>
                            <label class="ep-label">Badge Color Style</label>
                            <select name="bc" class="ep-input">
                                <option value="">Default (Red)</option>
                                <option value="hot">Dark Red (hot)</option>
                                <option value="luxury">Purple (luxury)</option>
                                <option value="fleet">Blue (fleet)</option>
                            </select>
                        </div>
                        <div>
                            <label class="ep-label">Units Exported / Status</label>
                            <input name="sold" class="ep-input" placeholder="e.g. 15 Exported">
                        </div>
                        <div style="grid-column:span 2;">
                            <label class="ep-label">Main Image URL *</label>
                            <!-- FIX: Image preview on URL input -->
                            <input name="img" id="ep-img-url" class="ep-input" required placeholder="https://images.unsplash.com/…">
                            <img id="ep-img-preview" src="" alt="Image Preview">
                        </div>
                        <div style="grid-column:span 2;border-top:1px solid #222;padding-top:20px;display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap;">
                            <button type="button" class="ep-btn ep-btn-sec" id="ep-car-modal-cancel"><i class="fas fa-times"></i> Cancel</button>
                            <button type="submit" id="ep-save-btn" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Vehicle</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    // ==========================================
    // 2. INITIALIZATION & EVENT LISTENERS
    // ==========================================
    async function init() {
        injectStyles();
        injectHTML();
        setupEventListeners();
        await checkSession();

        // Real-time: new inquiry or quote → toast notification, not alert
        sb.channel('admin-panel-sync')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, payload => {
                fetchInquiries();
                showAdminToast(`📩 New inquiry from ${payload.new.name || 'a client'}!`);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quotes' }, payload => {
                fetchQuotes();
                showAdminToast(`📋 New quote request from ${payload.new.name || 'a client'}!`);
            })
            .subscribe();
    }

    function setupEventListeners() {
        // Open / close overlay
        document.getElementById('ep-admin-trigger').onclick = () => {
            document.getElementById('ep-overlay').style.display = 'block';
        };
        document.getElementById('ep-overlay-close').onclick = () => {
            document.getElementById('ep-overlay').style.display = 'none';
        };

        // FIX: Close overlay when pressing Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.getElementById('ep-overlay').style.display = 'none';
                document.getElementById('ep-car-modal').style.display = 'none';
                document.getElementById('ep-notes-modal').classList.remove('open');
            }
        });

        // Login / logout
        document.getElementById('ep-login-btn').onclick = login;
        // FIX: Allow Enter key to submit login
        document.getElementById('ep-pass').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
        document.getElementById('ep-logout').onclick = logout;

        // Tab navigation
        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.style.display = 'none');
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).style.display = 'block';
            };
        });

        // Car form: cancel button
        document.getElementById('ep-car-modal-cancel').onclick = () => {
            document.getElementById('ep-car-modal').style.display = 'none';
        };

        // FIX: Image URL preview
        document.getElementById('ep-img-url').addEventListener('input', function () {
            const preview = document.getElementById('ep-img-preview');
            const url = this.value.trim();
            if (url) {
                preview.src = url;
                preview.classList.add('visible');
                preview.onerror = () => { preview.classList.remove('visible'); };
            } else {
                preview.classList.remove('visible');
            }
        });

        // Car form submit (add/edit)
        document.getElementById('car-form').onsubmit = async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('ep-save-btn');
            const origHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;

            const formData = new FormData(e.target);
            const carObj = Object.fromEntries(formData.entries());

            if (!editingId) {
                // New vehicle: set default JSON structures
                carObj.imgs = [carObj.img];
                carObj.tags = [];
                carObj.specs = { Engine: 'N/A', Transmission: 'N/A' };
                carObj.export = { 'Lead Time': 'Contact Us', Shipping: 'Available' };
            } else {
                // Edit: preserve existing JSON data from the database record
                const existing = inventoryData.find(c => c.id === editingId);
                if (existing) {
                    // Only update img array if img URL changed
                    if (existing.img !== carObj.img) {
                        carObj.imgs = [carObj.img, ...(existing.imgs || []).filter(u => u !== existing.img)];
                    } else {
                        carObj.imgs = existing.imgs && existing.imgs.length > 0 ? existing.imgs : [carObj.img];
                    }
                    carObj.tags = existing.tags || [];
                    carObj.specs = existing.specs || {};
                    carObj.export = existing.export || {};
                }
            }

            let error;
            if (editingId) {
                ({ error } = await sb.from('inventory').update(carObj).eq('id', editingId));
            } else {
                ({ error } = await sb.from('inventory').insert([carObj]));
            }

            saveBtn.innerHTML = origHTML;
            saveBtn.disabled = false;
            document.getElementById('ep-car-modal').style.display = 'none';

            if (error) {
                showAdminToast('Error saving vehicle: ' + error.message, true);
            } else {
                showAdminToast(editingId ? 'Vehicle updated successfully!' : 'New vehicle added to inventory!');
                loadData();
            }
        };
    }

    // ==========================================
    // 3. AUTHENTICATION
    // ==========================================
    async function login() {
        const btn = document.getElementById('ep-login-btn');
        const errEl = document.getElementById('ep-login-error');
        errEl.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        btn.disabled = true;

        const email = document.getElementById('ep-email').value.trim();
        const password = document.getElementById('ep-pass').value;

        if (!email || !password) {
            errEl.textContent = 'Please enter email and password.';
            errEl.style.display = 'block';
            btn.innerHTML = 'Authenticate <i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
            return;
        }

        const { data, error } = await sb.auth.signInWithPassword({ email, password });

        // FIX: Always reset button after attempt
        btn.innerHTML = 'Authenticate <i class="fas fa-arrow-right"></i>';
        btn.disabled = false;

        if (error) {
            errEl.textContent = 'Access Denied: ' + error.message;
            errEl.style.display = 'block';
            return;
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
        document.getElementById('ep-login-error').style.display = 'none';
    }

    async function checkSession() {
        const { data } = await sb.auth.getUser();
        if (data && data.user) {
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
        await Promise.all([fetchInventory(), fetchInquiries(), fetchQuotes()]);
        renderStats();
    }

    async function fetchInventory() {
        const { data } = await sb.from('inventory').select('*').order('id', { ascending: false });
        inventoryData = data || [];
        renderInventory(inventoryData);
    }

    async function fetchInquiries() {
        const { data } = await sb.from('inquiries').select('*').order('created_at', { ascending: false });
        inquiriesData = data || [];
        renderLeads(inquiriesData);
    }

    async function fetchQuotes() {
        const { data } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
        quotesData = data || [];
        renderQuotes(quotesData);
    }

    // ==========================================
    // 5. STATS DASHBOARD
    // ==========================================
    function renderStats() {
        const container = document.getElementById('ep-stats');
        if (!container) return;

        const catCounts = inventoryData.reduce((acc, c) => { acc[c.cat] = (acc[c.cat] || 0) + 1; return acc; }, {});
        const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

        container.innerHTML = `
            <div class="ep-stat-card">
                <div class="ep-stat-icon"><i class="fas fa-car"></i></div>
                <div><div class="ep-stat-num">${inventoryData.length}</div><div class="ep-stat-lbl">Total Vehicles</div></div>
            </div>
            <div class="ep-stat-card">
                <div class="ep-stat-icon"><i class="fas fa-inbox"></i></div>
                <div><div class="ep-stat-num">${inquiriesData.length}</div><div class="ep-stat-lbl">Inquiries</div></div>
            </div>
            <div class="ep-stat-card">
                <div class="ep-stat-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                <div><div class="ep-stat-num">${quotesData.length}</div><div class="ep-stat-lbl">Quote Requests</div></div>
            </div>
            <div class="ep-stat-card">
                <div class="ep-stat-icon"><i class="fas fa-star"></i></div>
                <div><div class="ep-stat-num" style="font-size:1rem;text-transform:capitalize;">${topCat ? topCat[0] : '—'}</div><div class="ep-stat-lbl">Top Category</div></div>
            </div>
        `;
    }

    // ==========================================
    // 6. RENDERING
    // ==========================================
    function categoryStatus(cat) {
        const map = { luxury: 'status-live', suv: 'status-suv', exotic: 'status-exotic', fleet: 'status-fleet' };
        return map[cat] || 'status-live';
    }

    function renderInventory(data) {
        const container = document.getElementById('inv-list');
        if (!data || data.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="ep-empty"><i class="fas fa-car-side" style="font-size:2rem;color:#333;display:block;margin-bottom:10px;"></i>No vehicles in inventory.</td></tr>`;
            return;
        }
        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#555;font-size:0.78rem;">#${item.id}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <img src="${item.img || ''}" style="width:52px;height:36px;object-fit:cover;border-radius:5px;border:1px solid #2a2a2d;flex-shrink:0;" onerror="this.src='https://via.placeholder.com/80x56?text=No+Img'">
                        <div>
                            <div style="font-size:0.62rem;color:var(--ep-p);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">${item.make}</div>
                            <div style="font-weight:700;font-size:0.88rem;">${item.name}</div>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600;color:#ccc;">${item.price || '—'}</td>
                <td><span class="ep-status ${categoryStatus(item.cat)}">${item.cat}</span></td>
                <td>${item.badge ? `<span style="background:#1e1e21;padding:3px 8px;border-radius:3px;font-size:0.62rem;border:1px solid #2a2a2d;">${item.badge}</span>` : '<span style="color:#444;">—</span>'}</td>
                <td>
                    <div style="display:flex;gap:7px;">
                        <button class="ep-btn ep-btn-sec" onclick="window.editCar(${item.id})" title="Edit Vehicle"><i class="fas fa-edit"></i></button>
                        <button class="ep-btn ep-btn-danger" onclick="window.deleteCar(${item.id})" title="Delete Vehicle"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderLeads(data) {
        const container = document.getElementById('leads-list');
        const countEl = document.getElementById('leads-count');
        if (countEl) countEl.textContent = `${data.length} total`;

        if (!data || data.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="ep-empty">No inquiries yet.</td></tr>`;
            return;
        }
        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#888;font-size:0.78rem;white-space:nowrap;">${formatDate(item.created_at)}</td>
                <td>
                    <div style="font-weight:700;color:#fff;margin-bottom:2px;">${escapeHtml(item.name || '—')}</div>
                    <div style="color:var(--ep-p);font-size:0.73rem;"><i class="fas fa-envelope"></i> ${escapeHtml(item.email || '')}</div>
                    ${item.phone ? `<div style="color:#777;font-size:0.73rem;"><i class="fas fa-phone"></i> ${escapeHtml(item.phone)}</div>` : ''}
                </td>
                <td style="font-weight:600;font-size:0.85rem;">${escapeHtml(item.car_title || 'N/A')}</td>
                <td style="color:#bbb;font-size:0.85rem;">${escapeHtml(item.destination || 'N/A')}</td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="window.viewNotes('${safeEscapeForAttr(item.notes || 'No notes provided.')}', 'Inquiry Notes')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function renderQuotes(data) {
        const container = document.getElementById('quotes-list');
        const countEl = document.getElementById('quotes-count');
        if (countEl) countEl.textContent = `${data.length} total`;

        if (!data || data.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="ep-empty">No quote requests yet.</td></tr>`;
            return;
        }
        container.innerHTML = data.map(item => `
            <tr>
                <td style="color:#888;font-size:0.78rem;white-space:nowrap;">${formatDate(item.created_at)}</td>
                <td>
                    <div style="font-weight:700;color:#fff;margin-bottom:2px;">${escapeHtml(item.name || '—')}</div>
                    <div style="color:var(--ep-p);font-size:0.73rem;"><i class="fas fa-envelope"></i> ${escapeHtml(item.email || '')}</div>
                </td>
                <td style="font-weight:600;font-size:0.85rem;">${escapeHtml(item.vehicle_interest || 'General Inquiry')}</td>
                <td><span style="background:#1e1e21;padding:4px 9px;border-radius:4px;font-size:0.72rem;color:#4dbb6a;border:1px solid #2a2a2d;">${escapeHtml(item.budget || '—')}</span></td>
                <td>
                    <button class="ep-btn ep-btn-sec" onclick="window.viewNotes('${safeEscapeForAttr(item.message || 'No message provided.')}', 'Quote Message')">
                        <i class="fas fa-eye"></i> Read
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ==========================================
    // 7. UTILITIES
    // ==========================================
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // FIX: For embedding in onclick attrs we need different escaping
    function safeEscapeForAttr(str) {
        return encodeURIComponent(String(str));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    }

    // FIX: Toast replaces alert() for all admin notifications
    function showAdminToast(msg, isError = false) {
        const toast = document.getElementById('ep-toast');
        const icon = toast.querySelector('.ep-ti');
        const msgEl = document.getElementById('ep-toast-msg');
        if (!toast) return;

        if (isError) {
            toast.classList.add('ep-error');
            icon.className = 'ep-ti fas fa-exclamation-circle';
        } else {
            toast.classList.remove('ep-error');
            icon.className = 'ep-ti fas fa-check-circle';
        }
        msgEl.textContent = msg;
        toast.classList.add('ep-show');
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => toast.classList.remove('ep-show'), 4000);
    }

    // FIX: Notes modal replaces alert() for viewing long text
    window.viewNotes = (encodedNotes, title = 'Message Details') => {
        const notesText = decodeURIComponent(encodedNotes);
        document.getElementById('ep-notes-title').textContent = title;
        document.getElementById('ep-notes-text').textContent = notesText;
        document.getElementById('ep-notes-modal').classList.add('open');
    };

    window.filterInventory = () => {
        const query = (document.getElementById('inv-search').value || '').toLowerCase().trim();
        if (!query) {
            renderInventory(inventoryData);
            return;
        }
        renderInventory(inventoryData.filter(i =>
            (i.make || '').toLowerCase().includes(query) ||
            (i.name || '').toLowerCase().includes(query) ||
            (i.cat || '').toLowerCase().includes(query) ||
            (i.badge || '').toLowerCase().includes(query)
        ));
    };

    // ==========================================
    // 8. CRUD ACTIONS
    // ==========================================
    window.openCarForm = () => {
        editingId = null;
        document.getElementById('car-form').reset();
        document.getElementById('ep-img-preview').classList.remove('visible');
        document.getElementById('ep-modal-title').textContent = 'Add New Vehicle';
        document.getElementById('ep-car-modal').style.display = 'block';
        document.getElementById('ep-save-btn').innerHTML = '<i class="fas fa-save"></i> Save Vehicle';
    };

    window.editCar = (id) => {
        editingId = id;
        const car = inventoryData.find(c => c.id === id);
        if (!car) return;

        const form = document.getElementById('car-form');
        document.getElementById('ep-modal-title').textContent = `Edit Vehicle — ${car.make} ${car.name}`;

        // FIX: Populate all simple string fields safely
        const fields = ['make', 'name', 'price', 'old', 'cat', 'badge', 'bc', 'sold', 'img'];
        fields.forEach(key => {
            if (form.elements[key] !== undefined) {
                form.elements[key].value = car[key] || '';
            }
        });

        // Show image preview
        const preview = document.getElementById('ep-img-preview');
        if (car.img) {
            preview.src = car.img;
            preview.classList.add('visible');
        } else {
            preview.classList.remove('visible');
        }

        document.getElementById('ep-car-modal').style.display = 'block';
    };

    window.deleteCar = async (id) => {
        const car = inventoryData.find(c => c.id === id);
        const name = car ? `${car.make} ${car.name}` : `#${id}`;
        if (!confirm(`⚠️ Delete "${name}" from the live showroom?\n\nThis cannot be undone.`)) return;

        const { error } = await sb.from('inventory').delete().eq('id', id);

        if (error) {
            showAdminToast('Delete failed: ' + error.message, true);
        } else {
            inventoryData = inventoryData.filter(c => c.id !== id);
            renderInventory(inventoryData);
            renderStats();
            showAdminToast(`"${name}" removed from inventory.`);
        }
    };

})();
