/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V4.0 PRO)
   Features: Full CRUD, Image Compression, Dynamic Specs Builder,
             Sister Companies, Footer Links, Premium UI/UX, Drag/Drop Multiple.
================================================================ */

(function () {
    'use strict';

    let sb = null;
    let inventoryData = [], inquiriesData = [], quotesData =[], servicesData =[];
    let footerLinksData =[], sisterCompaniesData =[];
    let editingId = null;

    // Initialize Admin Setup
    function initAdmin() {
        injectStyles();
        injectHTML();
        
        setupImageUpload('img_file', 'img_url', 'img_hidden', 'img_preview', false);
        setupImageUpload('imgs_files', 'imgs_url', 'imgs_hidden', 'imgs_preview', true);

        // Bind to the sleek footer link (if available) or floating button
        const adminTrigger = document.getElementById('admin-access-link');
        if(adminTrigger) {
            adminTrigger.onclick = (e) => {
                e.preventDefault();
                document.getElementById('ep-overlay').style.display = 'block';
                setTimeout(() => document.getElementById('ep-overlay').classList.add('ep-show'), 10);
            };
        } else {
            // Fallback floating button if the link isn't used
            const fallbackTrigger = document.getElementById('ep-admin-trigger');
            if(fallbackTrigger) {
                fallbackTrigger.onclick = () => {
                    document.getElementById('ep-overlay').style.display = 'block';
                    setTimeout(() => document.getElementById('ep-overlay').classList.add('ep-show'), 10);
                };
            }
        }

        document.getElementById('ep-login-btn').onclick = async (e) => {
            const btn = e.target.closest('button'); const origTxt = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...'; btn.disabled = true;
            const { data, error } = await sb.auth.signInWithPassword({ email: document.getElementById('ep-email').value, password: document.getElementById('ep-pass').value });
            btn.innerHTML = origTxt; btn.disabled = false;
            
            if (error) return showAdminToast("Login Failed: " + error.message, 'error');
            showAdminToast("Welcome back, Admin.", 'success');
            showPanel();
        };

        document.getElementById('ep-logout').onclick = async () => { 
            await sb.auth.signOut(); 
            document.getElementById('ep-login-form').style.display = 'block'; 
            document.getElementById('ep-main-panel').style.display = 'none'; 
            showAdminToast("Logged out successfully.", 'success');
        };

        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.style.display = 'none');
                btn.classList.add('active'); document.getElementById(btn.dataset.tab).style.display = 'block';
            };
        });

        // Form Submissions routing through generic handler
        document.getElementById('car-form').onsubmit = (e) => handleFormSubmit(e, 'inventory', (fd) => {
            const obj = Object.fromEntries(fd.entries());
            obj.img = document.getElementById('img_hidden').value;
            try { obj.imgs = JSON.parse(document.getElementById('imgs_hidden').value); } catch(err) { obj.imgs =[]; }
            obj.tags = obj.tags_raw ? obj.tags_raw.split(',').map(s=>s.trim()).filter(Boolean) :[];
            obj.specs = extractKV('specs-container'); 
            obj.export = extractKV('export-container');
            delete obj.tags_raw; delete obj.imgs_raw;
            return obj;
        });

        document.getElementById('service-form').onsubmit = (e) => handleFormSubmit(e, 'services', fd => Object.fromEntries(fd.entries()));
        document.getElementById('sister-form').onsubmit = (e) => handleFormSubmit(e, 'sister_companies', fd => Object.fromEntries(fd.entries()));
        document.getElementById('footer-link-form').onsubmit = (e) => handleFormSubmit(e, 'footer_links', fd => Object.fromEntries(fd.entries()));

        // Settings Submit
        document.getElementById('settings-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button'); const origTxt = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
            
            const val = { address: document.getElementById('set-address').value, phone: document.getElementById('set-phone').value, email: document.getElementById('set-email').value, map_iframe: document.getElementById('set-map').value };
            const { error } = await sb.from('site_settings').update({value: val}).eq('key', 'contact_info'); 
            
            btn.innerHTML = origTxt; btn.disabled = false;
            if(error) showAdminToast(error.message, 'error'); else showAdminToast('Global Settings Saved!', 'success');
        };

        // Check Session Status immediately
        sb.auth.getUser().then(({ data }) => { if (data.user) showPanel(); });
    }

    // Ensure Supabase is loaded before initializing
    function checkSupabase() {
        if (window.supabase) {
            sb = window.supabase.createClient(
                'https://doycdipvtyflshhsxqqx.supabase.co', 
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk'
            );
            initAdmin();
        } else {
            setTimeout(checkSupabase, 100);
        }
    }

    // Dynamically load Supabase script if not already present
    if (typeof window.supabase === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = checkSupabase;
        document.head.appendChild(script);
    } else {
        checkSupabase();
    }

    function injectStyles() {
        const css = `
            :root { --ep-primary: #ff3b30; --ep-primary-grad: linear-gradient(135deg, #ff3b30, #d63026); --ep-bg: #0a0a0c; --ep-card: #151518; --ep-border: rgba(255,255,255,0.08); --ep-ease: cubic-bezier(0.34, 1.56, 0.64, 1); }
            #ep-overlay { position: fixed; inset: 0; background: rgba(5,5,8,0.92); backdrop-filter: blur(20px); z-index: 10000; display: none; font-family: 'Montserrat', sans-serif; color: #fff; opacity: 0; transition: opacity 0.4s var(--ep-ease); }
            #ep-overlay.ep-show { display: block; opacity: 1; }
            
            .ep-container { max-width: 1400px; height: 94vh; margin: 3vh auto; background: var(--ep-bg); border: 1px solid var(--ep-border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.05); transform: translateY(20px); transition: transform 0.4s var(--ep-ease); }
            #ep-overlay.ep-show .ep-container { transform: translateY(0); }
            
            .ep-header { padding: 25px 35px; background: #0f0f13; border-bottom: 1px solid var(--ep-border); display: flex; justify-content: space-between; align-items: center; }
            .ep-nav { display: flex; background: var(--ep-card); border-bottom: 1px solid var(--ep-border); overflow-x: auto; scrollbar-width: none; }
            .ep-nav::-webkit-scrollbar { display: none; }
            .ep-nav-btn { flex: 1; padding: 20px 15px; border: none; background: none; color: #888; cursor: pointer; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1.5px; transition: 0.3s; white-space: nowrap; position: relative; }
            .ep-nav-btn::after { content:''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: var(--ep-primary); transform: scaleX(0); transition: transform 0.3s var(--ep-ease); transform-origin: center; }
            .ep-nav-btn.active { color: #fff; background: rgba(255,59,48,0.05); }
            .ep-nav-btn.active::after, .ep-nav-btn:hover::after { transform: scaleX(1); }
            .ep-nav-btn:hover { color: #fff; }
            .ep-content { flex: 1; padding: 40px; overflow-y: auto; scroll-behavior: smooth; }
            .ep-content::-webkit-scrollbar { width: 8px; }
            .ep-content::-webkit-scrollbar-track { background: var(--ep-bg); }
            .ep-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .ep-content::-webkit-scrollbar-thumb:hover { background: var(--ep-primary); }
            
            .ep-input, .ep-textarea, .ep-select { width: 100%; padding: 14px 18px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; font-family: inherit; font-size: 0.9rem; transition: 0.4s var(--ep-ease); outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
            .ep-textarea { resize: vertical; min-height: 120px; }
            .ep-input:focus, .ep-textarea:focus, .ep-select:focus { border-color: var(--ep-primary); box-shadow: 0 0 0 4px rgba(255,59,48,0.15), inset 0 2px 4px rgba(0,0,0,0.2); background: rgba(0,0,0,0.8); }
            .ep-select option { background: var(--ep-card); }
            
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
            .ep-btn { padding: 14px 28px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; transition: 0.4s var(--ep-ease); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1.5px; display: inline-flex; align-items: center; gap: 10px; justify-content: center; position: relative; overflow: hidden; }
            .ep-btn:disabled { opacity: 0.7; cursor: not-allowed; }
            .ep-btn-p { background: var(--ep-primary-grad); color: #fff; box-shadow: 0 4px 15px rgba(255,59,48,0.3); }
            .ep-btn-p:hover:not(:disabled) { box-shadow: 0 8px 25px rgba(255,59,48,0.5); transform: translateY(-2px); }
            .ep-btn-sec { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); }
            .ep-btn-sec:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
            .ep-btn-sm { padding: 10px 18px; font-size: 0.7rem; border-radius: 6px; }
            
            .ep-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; background: var(--ep-card); border-radius: 12px; overflow: hidden; border: 1px solid var(--ep-border); }
            .ep-table th { text-align: left; padding: 20px; background: rgba(0,0,0,0.4); color: var(--ep-primary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid var(--ep-border); }
            .ep-table td { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.9rem; vertical-align: middle; transition: background 0.3s; }
            .ep-table tr:last-child td { border-bottom: none; }
            .ep-table tr:hover td { background: rgba(255,255,255,0.02); }
            
            .ep-status { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            .status-replied { background: rgba(37,211,102,0.1); color: #25d366; border: 1px solid rgba(37,211,102,0.2); }
            .status-new { background: rgba(255,193,7,0.1); color: #ffc107; border: 1px solid rgba(255,193,7,0.2); }
            
            /* Admin Floating Trigger (Fallback if no specific link is used) */
            #ep-admin-trigger { position: fixed; bottom: 30px; left: 30px; width: 60px; height: 60px; border-radius: 50%; background: var(--ep-primary-grad); color: white; border: none; cursor: pointer; z-index: 9999; box-shadow: 0 10px 30px rgba(255,59,48,0.5); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; transition: 0.4s var(--ep-ease); }
            #ep-admin-trigger:hover { transform: scale(1.15) rotate(10deg); box-shadow: 0 15px 40px rgba(255,59,48,0.7); }
            
            /* Advanced Modal */
            .ep-modal-wrapper { display: flex; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:11000; padding:40px; overflow-y:auto; backdrop-filter: blur(15px); opacity: 0; visibility: hidden; transition: all 0.5s var(--ep-ease); align-items: center; justify-content: center; }
            .ep-modal-wrapper.open { opacity: 1; visibility: visible; }
            .modal-inner { width: 100%; max-width: 1000px; display: flex; flex-direction: column; background: #121215; border-radius: 16px; border: 1px solid var(--ep-border); box-shadow: 0 40px 100px rgba(0,0,0,0.9); position: relative; transform: scale(0.9) translateY(40px); transition: 0.6s var(--ep-ease); }
            .ep-modal-wrapper.open .modal-inner { transform: scale(1) translateY(0); }
            
            .modal-header { padding: 35px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .modal-header h2 { margin: 0; font-weight: 900; font-size: 1.8rem; letter-spacing: 1px; color: #fff; }
            .modal-body-scroll { padding: 40px; overflow-y: auto; flex: 1; }
            .modal-body-scroll::-webkit-scrollbar { width: 6px; }
            .modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
            .modal-body-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .modal-footer { padding: 25px 40px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 15px; background: #0a0a0c; border-radius: 0 0 16px 16px; }
            
            .ep-label { display: block; font-size: 0.75rem; color: var(--ep-primary); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; font-weight: 800; }
            
            .ep-section { background: rgba(255,255,255,0.02); border: 1px solid var(--ep-border); border-radius: 12px; padding: 30px; margin-bottom: 30px; transition: 0.3s; }
            .ep-section:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.15); }
            .ep-sec-title { font-size: 1rem; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; display: flex; align-items: center; gap: 10px; }
            .ep-sec-title i { color: var(--ep-primary); font-size: 1.2rem; }
            .kv-row { display: flex; gap: 15px; margin-bottom: 15px; align-items: center; }
            
            .close-modal-btn { position: absolute; top: -20px; right: -20px; z-index: 100; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: 0.4s var(--ep-ease); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.6); backdrop-filter: blur(10px); font-size: 1.2rem; }
            .close-modal-btn:hover { background: var(--ep-primary); border-color: var(--ep-primary); transform: scale(1.15) rotate(90deg); box-shadow: 0 0 20px rgba(255,59,48,0.5); }

            .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            @media(max-width: 900px) { .split-grid { grid-template-columns: 1fr; } }
            
            .file-drop-area { border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 40px 20px; text-align: center; background: rgba(0,0,0,0.3); transition: 0.4s var(--ep-ease); cursor: pointer; position: relative; display:flex; flex-direction:column; align-items:center; justify-content:center;}
            .file-drop-area:hover, .file-drop-area.drag-over { border-color: var(--ep-primary); background: rgba(255,59,48,0.05); transform: translateY(-2px); }
            .file-drop-area input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width:100%; height:100%; }
            .img-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 12px; margin-top: 20px; }
            .img-thumb-wrap { position: relative; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); height: 90px; transition: 0.3s; }
            .img-thumb-wrap:hover { border-color: var(--ep-primary); transform: scale(1.05); }
            .img-thumb-wrap img { width: 100%; height: 100%; object-fit: cover; }
            .img-remove-btn { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.8); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: 0.3s;}
            .img-remove-btn:hover { background: var(--ep-primary); border-color: var(--ep-primary); transform: scale(1.15) rotate(90deg); }

            #ep-toast-container { position: fixed; bottom: 30px; right: 30px; z-index: 12000; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
            .ep-toast { background: rgba(18,25,18,0.95); backdrop-filter: blur(15px); border: 1px solid rgba(77,187,106,0.3); border-left: 6px solid #4dbb6a; border-radius: 10px; padding: 20px 25px; display: flex; align-items: center; gap: 15px; font-size: 1rem; font-weight: 600; color: #fff; transform: translateX(120%) scale(0.9); opacity: 0; transition: all 0.5s var(--ep-ease); box-shadow: 0 15px 40px rgba(0,0,0,0.6); pointer-events: auto; }
            .ep-toast.show { transform: translateX(0) scale(1); opacity: 1; }
            .ep-toast-error { background: rgba(25,18,18,0.95); border-color: rgba(255,59,48,0.3); border-left-color: #ff3b30; }
            .ep-toast i { font-size: 1.4rem; }
        `;
        const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="ep-overlay">
                <div class="ep-container">
                    <div class="ep-header">
                        <div style="font-size: 1.6rem; font-weight: 900; letter-spacing: 4px;">ELITE <span style="color:#ff3b30">ADMIN PRO</span></div>
                        <button class="ep-btn ep-btn-sec" onclick="window.closeMainPanel()"><i class="fas fa-times"></i> Close Panel</button>
                    </div>

                    <div id="ep-login-form" style="padding: 120px 20px; max-width: 480px; margin: 0 auto; text-align: center;">
                        <i class="fas fa-user-lock" style="font-size: 3rem; color: #ff3b30; margin-bottom: 20px;"></i>
                        <h2 style="margin-bottom: 30px; font-weight: 900; letter-spacing: 1px;">Secure Authorization</h2>
                        <div style="margin-bottom: 20px; text-align: left;">
                            <label class="ep-label">Admin Email</label>
                            <input type="email" id="ep-email" class="ep-input" placeholder="admin@eliteroute.com">
                        </div>
                        <div style="margin-bottom: 35px; text-align: left;">
                            <label class="ep-label">Password</label>
                            <input type="password" id="ep-pass" class="ep-input" placeholder="••••••••">
                        </div>
                        <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width: 100%; padding: 16px;"><i class="fas fa-lock"></i> Authenticate Session</button>
                    </div>

                    <div id="ep-main-panel" style="display: none; display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                        <div class="ep-nav">
                            <button class="ep-nav-btn active" data-tab="tab-inventory"><i class="fas fa-car"></i> Inventory</button>
                            <button class="ep-nav-btn" data-tab="tab-leads"><i class="fas fa-envelope-open-text"></i> Inquiries</button>
                            <button class="ep-nav-btn" data-tab="tab-quotes"><i class="fas fa-file-invoice-dollar"></i> Quotes</button>
                            <button class="ep-nav-btn" data-tab="tab-services"><i class="fas fa-briefcase"></i> Services</button>
                            <button class="ep-nav-btn" data-tab="tab-footer"><i class="fas fa-link"></i> Site Data</button>
                            <button class="ep-nav-btn" data-tab="tab-settings"><i class="fas fa-cog"></i> Settings</button>
                            <button class="ep-nav-btn" id="ep-logout" style="flex: 0.5; color: #ff4444;"><i class="fas fa-sign-out-alt"></i> Logout</button>
                        </div>

                        <div class="ep-content">
                            <!-- INVENTORY -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                                    <div style="position: relative; width: 100%; max-width: 400px;">
                                        <i class="fas fa-search" style="position: absolute; left: 16px; top: 16px; color: #888;"></i>
                                        <input type="text" id="inv-search" class="ep-input" style="padding-left: 45px;" placeholder="Search make or model..." onkeyup="window.filterInventory()">
                                    </div>
                                    <button class="ep-btn ep-btn-p" onclick="window.openCarForm()"><i class="fas fa-plus"></i> Add Vehicle</button>
                                </div>
                                <table class="ep-table">
                                    <thead><tr><th>Image</th><th>Make & Model</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead>
                                    <tbody id="inv-list"></tbody>
                                </table>
                            </div>

                            <!-- INQUIRIES -->
                            <div id="tab-leads" class="ep-tab-content" style="display: none;">
                                <table class="ep-table">
                                    <thead><tr><th>Date</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody id="leads-list"></tbody>
                                </table>
                            </div>

                            <!-- QUOTES -->
                            <div id="tab-quotes" class="ep-tab-content" style="display: none;">
                                <table class="ep-table">
                                    <thead><tr><th>Date</th><th>Customer</th><th>Interest</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody id="quotes-list"></tbody>
                                </table>
                            </div>

                            <!-- SERVICES -->
                            <div id="tab-services" class="ep-tab-content" style="display: none;">
                                <div style="text-align: right; margin-bottom: 20px;">
                                    <button class="ep-btn ep-btn-p" onclick="window.openServiceForm()"><i class="fas fa-plus"></i> Add Service</button>
                                </div>
                                <table class="ep-table">
                                    <thead><tr><th>Icon</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead>
                                    <tbody id="services-list"></tbody>
                                </table>
                            </div>

                            <!-- FOOTER & PARTNERS -->
                            <div id="tab-footer" class="ep-tab-content" style="display: none;">
                                <div class="split-grid">
                                    <div class="ep-section">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                            <h3 style="color:#fff; text-transform:uppercase; font-size:1rem; letter-spacing:2px; font-weight:800;"><i class="fas fa-building" style="color:#ff3b30; margin-right:8px;"></i> Sister Companies</h3>
                                            <button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.openSisterForm()"><i class="fas fa-plus"></i> Add</button>
                                        </div>
                                        <table class="ep-table">
                                            <thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead>
                                            <tbody id="sister-list"></tbody>
                                        </table>
                                    </div>
                                    <div class="ep-section">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                            <h3 style="color:#fff; text-transform:uppercase; font-size:1rem; letter-spacing:2px; font-weight:800;"><i class="fas fa-link" style="color:#ff3b30; margin-right:8px;"></i> Footer Links</h3>
                                            <button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.openFooterLinkForm()"><i class="fas fa-plus"></i> Add</button>
                                        </div>
                                        <table class="ep-table">
                                            <thead><tr><th>Section</th><th>Label</th><th>URL</th><th>Actions</th></tr></thead>
                                            <tbody id="footer-links-list"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- SETTINGS -->
                            <div id="tab-settings" class="ep-tab-content" style="display: none; max-width: 600px;">
                                <div class="ep-section">
                                    <div class="ep-sec-title"><i class="fas fa-map-marker-alt"></i> Contact & Location Info</div>
                                    <form id="settings-form" style="display:flex; flex-direction:column; gap:20px;">
                                        <div><label class="ep-label">Physical Address</label><input id="set-address" class="ep-input"></div>
                                        <div><label class="ep-label">Phone / WhatsApp</label><input id="set-phone" class="ep-input"></div>
                                        <div><label class="ep-label">Support Email</label><input id="set-email" class="ep-input"></div>
                                        <div><label class="ep-label">Google Maps Iframe URL</label><textarea id="set-map" class="ep-textarea"></textarea></div>
                                        <button type="submit" class="ep-btn ep-btn-p" style="padding:16px; margin-top:10px;"><i class="fas fa-save"></i> Save Global Settings</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADMIN MODALS INJECTED HERE -->
            <div id="ep-car-modal" class="ep-modal-wrapper">
                <div class="modal-inner">
                    <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-car-modal')"><i class="fas fa-times"></i></button>
                    <form id="car-form" style="display:flex; flex-direction:column; max-height:90vh;">
                        <div class="modal-header"><h2 id="car-modal-title">Vehicle Editor</h2></div>
                        <div class="modal-body-scroll">
                            <div class="split-grid">
                                <div class="ep-section">
                                    <div class="ep-sec-title"><i class="fas fa-info-circle"></i> General Information</div>
                                    <div class="ep-grid" style="grid-template-columns: 1fr;">
                                        <div><label class="ep-label">Make</label><input name="make" class="ep-input" required placeholder="e.g. Mercedes-Benz"></div>
                                        <div><label class="ep-label">Model Name</label><input name="name" class="ep-input" required placeholder="e.g. G63 AMG"></div>
                                        <div><label class="ep-label">Category</label>
                                            <select name="cat" class="ep-select">
                                                <option value="luxury">Luxury</option><option value="suv">SUV</option>
                                                <option value="exotic">Exotic</option><option value="fleet">Fleet</option>
                                            </select>
                                        </div>
                                        <div><label class="ep-label">Tags (Comma separated)</label><input name="tags_raw" class="ep-input" placeholder="V8 Biturbo, LHD, Brand New"></div>
                                    </div>
                                </div>
                                <div class="ep-section">
                                    <div class="ep-sec-title"><i class="fas fa-tags"></i> Pricing & Badging</div>
                                    <div class="ep-grid" style="grid-template-columns: 1fr;">
                                        <div><label class="ep-label">Price Text</label><input name="price" class="ep-input" placeholder="e.g. $185,000"></div>
                                        <div><label class="ep-label">Old Price</label><input name="old_price" class="ep-input" placeholder="Optional strikethrough price"></div>
                                        <div><label class="ep-label">Badge Text</label><input name="badge" class="ep-input" placeholder="e.g. NEW ARRIVAL"></div>
                                        <div><label class="ep-label">Badge Color</label>
                                            <select name="bc" class="ep-select">
                                                <option value="">Default (Red Gradient)</option>
                                                <option value="hot">Solid Dark Red</option>
                                                <option value="luxury">Luxury Purple</option>
                                                <option value="fleet">Fleet Blue</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="ep-section">
                                <div class="ep-sec-title"><i class="fas fa-images"></i> Media Gallery</div>
                                <div class="split-grid">
                                    <div>
                                        <label class="ep-label">Primary Image</label>
                                        <div class="file-drop-area">
                                            <i class="fas fa-image" style="font-size:32px; color:#ff3b30; margin-bottom:10px;"></i>
                                            <div style="font-size:0.85rem; font-weight:600; color:#fff; margin-bottom:4px;">Select Primary Photo</div>
                                            <div style="font-size:0.75rem; color:#888;">Drag & Drop or Click</div>
                                            <input type="file" id="img_file" accept="image/*">
                                        </div>
                                        <input type="text" id="img_url" class="ep-input" style="margin-top:15px;" placeholder="Or paste image URL...">
                                        <input type="hidden" name="img" id="img_hidden">
                                        <img id="img_preview" style="width: 100%; height: 160px; object-fit: cover; display: none; margin-top: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                                    </div>
                                    <div>
                                        <label class="ep-label">Additional Gallery Images</label>
                                        <div class="file-drop-area">
                                            <i class="fas fa-cloud-upload-alt" style="font-size:32px; color:#ff3b30; margin-bottom:10px;"></i>
                                            <div style="font-size:0.85rem; font-weight:600; color:#fff; margin-bottom:4px;">Upload Multiple Photos</div>
                                            <div style="font-size:0.75rem; color:#888;">Drag & Drop or Click</div>
                                            <input type="file" id="imgs_files" accept="image/*" multiple>
                                        </div>
                                        <input type="text" id="imgs_url" class="ep-input" style="margin-top:15px;" placeholder="Or paste image URL and press Enter...">
                                        <input type="hidden" name="imgs_raw" id="imgs_hidden" value="[]">
                                        <div id="imgs_preview" class="img-preview-grid"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="split-grid">
                                <div class="ep-section" style="margin-bottom:0;">
                                    <div class="ep-sec-title"><i class="fas fa-cogs"></i> Technical Specifications</div>
                                    <div id="specs-container"></div>
                                    <button type="button" class="ep-btn ep-btn-sec ep-btn-sm" style="margin-top:15px; width:100%" onclick="window.addKVRow('specs-container')"><i class="fas fa-plus"></i> Add Spec Row</button>
                                </div>
                                <div class="ep-section" style="margin-bottom:0;">
                                    <div class="ep-sec-title"><i class="fas fa-ship"></i> Export & Logistics Data</div>
                                    <div id="export-container"></div>
                                    <button type="button" class="ep-btn ep-btn-sec ep-btn-sm" style="margin-top:15px; width:100%" onclick="window.addKVRow('export-container')"><i class="fas fa-plus"></i> Add Logistics Row</button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-car-modal')">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Vehicle Record</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="ep-service-modal" class="ep-modal-wrapper">
                <div class="modal-inner" style="max-width: 600px;">
                    <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-service-modal')"><i class="fas fa-times"></i></button>
                    <form id="service-form" style="display:flex; flex-direction:column;">
                        <div class="modal-header"><h2 id="service-modal-title">Add Service</h2></div>
                        <div class="modal-body-scroll ep-grid">
                            <div style="grid-column: span 2;"><label class="ep-label">Icon Class</label><input name="icon" class="ep-input" required placeholder="fas fa-globe"></div>
                            <div style="grid-column: span 2;"><label class="ep-label">Title</label><input name="title" class="ep-input" required></div>
                            <div style="grid-column: span 2;"><label class="ep-label">Description</label><textarea name="description" class="ep-textarea" required></textarea></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-service-modal')">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Service</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="ep-sister-modal" class="ep-modal-wrapper">
                <div class="modal-inner" style="max-width: 600px;">
                    <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-sister-modal')"><i class="fas fa-times"></i></button>
                    <form id="sister-form" style="display:flex; flex-direction:column;">
                        <div class="modal-header"><h2 id="sister-modal-title">Sister Company</h2></div>
                        <div class="modal-body-scroll ep-grid">
                            <div><label class="ep-label">Highlight Text (Red)</label><input name="highlight" class="ep-input" required placeholder="e.g. EWAN"></div>
                            <div><label class="ep-label">Remaining Name</label><input name="name" class="ep-input" required placeholder="e.g. ALMUTAMAIZ"></div>
                            <div style="grid-column: span 2;"><label class="ep-label">Description Subtitle</label><input name="description" class="ep-input" required placeholder="Premium Automotive — UAE"></div>
                            <div style="grid-column: span 2;"><label class="ep-label">Target URL</label><input name="url" class="ep-input" required placeholder="https://..."></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-sister-modal')">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Company</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="ep-footer-link-modal" class="ep-modal-wrapper">
                <div class="modal-inner" style="max-width: 600px;">
                    <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-footer-link-modal')"><i class="fas fa-times"></i></button>
                    <form id="footer-link-form" style="display:flex; flex-direction:column;">
                        <div class="modal-header"><h2 id="footer-link-modal-title">Footer Link</h2></div>
                        <div class="modal-body-scroll ep-grid">
                            <div style="grid-column: span 2;"><label class="ep-label">Section</label>
                                <select name="section" class="ep-select">
                                    <option value="quick">Quick Links</option>
                                    <option value="inventory">Inventory Categories</option>
                                </select>
                            </div>
                            <div><label class="ep-label">Link Label</label><input name="label" class="ep-input" required placeholder="e.g. Luxury Sedans"></div>
                            <div><label class="ep-label">URL / Anchor</label><input name="url" class="ep-input" required placeholder="e.g. #showroom"></div>
                            <div style="grid-column: span 2;"><label class="ep-label">Icon Class</label><input name="icon" class="ep-input" value="fas fa-chevron-right" placeholder="e.g. fas fa-chevron-right"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-footer-link-modal')">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Link</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="ep-toast-container"></div>
        `);
    }

    function showAdminToast(msg, type = 'success') {
        const container = document.getElementById('ep-toast-container');
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        const colorClass = type === 'success' ? '' : 'ep-toast-error';
        
        const toast = document.createElement('div');
        toast.className = `ep-toast ${colorClass}`;
        toast.innerHTML = `<i class="fas ${icon}" style="color: ${type==='success'?'#4dbb6a':'#ff3b30'}"></i> <span>${msg}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    window.openAdminModal = (id) => document.getElementById(id).classList.add('open');
    window.closeAdminModal = (id) => document.getElementById(id).classList.remove('open');
    window.closeMainPanel = () => {
        const ov = document.getElementById('ep-overlay');
        ov.classList.remove('ep-show');
        setTimeout(() => ov.style.display = 'none', 400);
    };

    window.addKVRow = (containerId, key = '', val = '') => {
        const div = document.createElement('div');
        div.className = 'kv-row';
        div.innerHTML = `
            <input type="text" class="ep-input kv-k" placeholder="Key (e.g. Engine)" value="${key}" style="flex:1">
            <input type="text" class="ep-input kv-v" placeholder="Value (e.g. 4.0L V8)" value="${val}" style="flex:2">
            <button type="button" class="ep-btn ep-btn-sec" style="padding: 14px 18px;" onclick="this.parentElement.remove()" title="Remove Row"><i class="fas fa-trash" style="color:#ff4444"></i></button>
        `;
        document.getElementById(containerId).appendChild(div);
    };

    const extractKV = (containerId) => {
        const obj = {};
        document.getElementById(containerId).querySelectorAll('.kv-row').forEach(row => {
            const k = row.querySelector('.kv-k').value.trim();
            const v = row.querySelector('.kv-v').value.trim();
            if(k) obj[k] = v;
        });
        return obj;
    };

    function compressImage(file, callback) {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1200; let width = img.width, height = img.height;
                if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } } 
                else { if (height > MAX) { width *= MAX / height; height = MAX; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.8));
            };
        };
    }

    window.renderMultiPreview = (prId, hiId) => {
        const pr = document.getElementById(prId); const hi = document.getElementById(hiId);
        let urls =[]; try { urls = JSON.parse(hi.value); } catch(e) { urls =[]; }
        pr.innerHTML = '';
        urls.forEach((u, i) => {
            const wrap = document.createElement('div'); wrap.className = 'img-thumb-wrap';
            const img = document.createElement('img'); img.src = u;
            const btn = document.createElement('button'); btn.className = 'img-remove-btn'; btn.innerHTML = '<i class="fas fa-times"></i>';
            btn.type = 'button';
            btn.onclick = () => { urls.splice(i, 1); hi.value = JSON.stringify(urls); window.renderMultiPreview(prId, hiId); };
            wrap.appendChild(img); wrap.appendChild(btn); pr.appendChild(wrap);
        });
    };

    function setupImageUpload(fileId, urlId, hidId, prevId, multiple) {
        const fi = document.getElementById(fileId), ui = document.getElementById(urlId), hi = document.getElementById(hidId), pr = document.getElementById(prevId);
        const dropArea = fi.closest('.file-drop-area');

        if (dropArea) {
            dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
            dropArea.addEventListener('dragleave', e => { e.preventDefault(); dropArea.classList.remove('drag-over'); });
            dropArea.addEventListener('drop', e => { e.preventDefault(); dropArea.classList.remove('drag-over'); 
                if (e.dataTransfer.files.length) { fi.files = e.dataTransfer.files; fi.dispatchEvent(new Event('change')); }
            });
        }
        
        if(!multiple) {
            ui.addEventListener('input', e => { hi.value = e.target.value; pr.src = e.target.value; pr.style.display = e.target.value ? 'block' : 'none'; });
            fi.addEventListener('change', e => {
                if(!e.target.files.length) return; ui.value = '';
                compressImage(e.target.files[0], b64 => { hi.value = b64; pr.src = b64; pr.style.display = 'block'; });
            });
        } else {
            ui.addEventListener('keydown', e => {
                if(e.key === 'Enter') {
                    e.preventDefault();
                    const newUrls = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                    if(newUrls.length > 0) {
                        let curr =[]; try { curr = JSON.parse(hi.value); } catch(err){}
                        hi.value = JSON.stringify(curr.concat(newUrls)); 
                        e.target.value = ''; window.renderMultiPreview(prevId, hidId);
                    }
                }
            });
            fi.addEventListener('change', e => {
                if(!e.target.files.length) return; ui.value = ''; 
                let curr =[]; try { curr = JSON.parse(hi.value); } catch(err){}
                let loaded = 0;
                Array.from(e.target.files).forEach((file, idx) => {
                    compressImage(file, b64 => {
                        curr.push(b64); loaded++; 
                        if(loaded === e.target.files.length) {
                            hi.value = JSON.stringify(curr);
                            window.renderMultiPreview(prevId, hidId);
                            fi.value = ''; 
                        }
                    });
                });
            });
        }
    }

    async function handleFormSubmit(e, table, extractDataFn) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const obj = extractDataFn(new FormData(e.target));
            let err;
            if (editingId) { const res = await sb.from(table).update(obj).eq('id', editingId); err = res.error; } 
            else { const res = await sb.from(table).insert([obj]); err = res.error; }

            if (err) throw err;
            showAdminToast(`${table.replace('_', ' ')} saved successfully!`, 'success');
            window.closeAdminModal(e.target.closest('.ep-modal-wrapper').id);
            loadData();
        } catch (error) {
            showAdminToast(error.message, 'error');
        } finally {
            btn.innerHTML = origText; btn.disabled = false;
        }
    }

    function showPanel() { document.getElementById('ep-login-form').style.display = 'none'; document.getElementById('ep-main-panel').style.display = 'flex'; loadData(); }

    async function loadData() {
        const[inv, inq, qts, svc, set, fl, sc] = await Promise.all([
            sb.from('inventory').select('*').order('id', {ascending:false}),
            sb.from('inquiries').select('*').order('created_at', {ascending:false}),
            sb.from('quotes').select('*').order('created_at', {ascending:false}),
            sb.from('services').select('*').order('order_idx'),
            sb.from('site_settings').select('*').eq('key', 'contact_info').single(),
            sb.from('footer_links').select('*').order('order_idx'),
            sb.from('sister_companies').select('*').order('order_idx')
        ]);
        
        inventoryData = inv.data ||[]; inquiriesData = inq.data ||[]; quotesData = qts.data ||[]; 
        servicesData = svc.data ||[]; footerLinksData = fl.data ||[]; sisterCompaniesData = sc.data ||[];
        
        renderInventory(inventoryData);
        
        const stFn = (s) => `<span class="ep-status ${s==='Replied'?'status-replied':'status-new'}"><i class="${s==='Replied'?'fas fa-check-circle':'fas fa-clock'}" style="margin-right:5px"></i>${s||'New'}</span>`;
        
        document.getElementById('leads-list').innerHTML = inquiriesData.map(i => `<tr><td>${new Date(i.created_at).toLocaleDateString()}</td><td><strong>${i.name}</strong><br><small style="color:#aaa">${i.email} | ${i.phone}</small></td><td><span style="color:var(--ep-primary); font-weight:700">${i.car_title}</span></td><td>${stFn(i.status)}</td><td><button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.viewInq(${i.id}, 'inquiries')">Manage</button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('inquiries',${i.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button></td></tr>`).join('');
        document.getElementById('quotes-list').innerHTML = quotesData.map(i => `<tr><td>${new Date(i.created_at).toLocaleDateString()}</td><td><strong>${i.name}</strong><br><small style="color:#aaa">${i.email}</small></td><td>${i.interest}</td><td>${stFn(i.status)}</td><td><button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.viewInq(${i.id}, 'quotes')">Manage</button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('quotes',${i.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button></td></tr>`).join('');
        
        document.getElementById('services-list').innerHTML = servicesData.map(s => `<tr><td><div style="width:40px;height:40px;background:rgba(255,59,48,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center"><i class="${s.icon}" style="font-size:1.2rem; color:#ff3b30"></i></div></td><td><strong>${s.title}</strong></td><td><span style="color:#aaa">${s.description.substring(0,50)}...</span></td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('services',${s.id})"><i class="fas fa-edit"></i> Edit</button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('services',${s.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button></td></tr>`).join('');
        
        document.getElementById('sister-list').innerHTML = sisterCompaniesData.map(s => `<tr><td><strong><span style="color:#ff3b30">${s.highlight}</span> ${s.name}</strong></td><td><a href="${s.url}" target="_blank" style="color:#aaa;text-decoration:underline">${s.url}</a></td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('sister_companies',${s.id})"><i class="fas fa-edit"></i></button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('sister_companies',${s.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button></td></tr>`).join('');
        
        document.getElementById('footer-links-list').innerHTML = footerLinksData.map(f => `<tr><td><span class="ep-status status-new" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1);">${f.section}</span></td><td><i class="${f.icon}" style="color:var(--ep-primary);margin-right:8px"></i> ${f.label}</td><td><span style="color:#aaa">${f.url}</span></td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('footer_links',${f.id})"><i class="fas fa-edit"></i></button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('footer_links',${f.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button></td></tr>`).join('');

        if(set.data && set.data.value) {
            document.getElementById('set-address').value = set.data.value.address || ''; document.getElementById('set-phone').value = set.data.value.phone || ''; document.getElementById('set-email').value = set.data.value.email || ''; document.getElementById('set-map').value = set.data.value.map_iframe || '';
        }
    }
    
    function renderInventory(data) {
        document.getElementById('inv-list').innerHTML = data.map(i => `<tr><td><div style="padding:3px; background:var(--ep-card); border:1px solid var(--ep-border); border-radius:6px; display:inline-block;"><img src="${i.img}" style="height:45px; width:75px; border-radius:4px; object-fit:cover;"></div></td><td><strong>${i.make}</strong> <span style="color:#aaa">${i.name}</span></td><td><strong style="color:#fff; font-size:1rem;">${i.price}</strong></td><td><span class="ep-status status-replied" style="background:rgba(255,255,255,0.05); color:var(--ep-primary); border:none;">${i.cat}</span></td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('inventory',${i.id})"><i class="fas fa-edit"></i> Edit</button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('inventory',${i.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button></td></tr>`).join('');
    }

    window.filterInventory = () => { const q = document.getElementById('inv-search').value.toLowerCase(); renderInventory(inventoryData.filter(i => i.make.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))); };

    window.openCarForm = () => { 
        editingId = null; document.getElementById('car-form').reset(); 
        document.getElementById('img_hidden').value = ''; document.getElementById('img_preview').style.display='none';
        document.getElementById('imgs_hidden').value = '[]'; window.renderMultiPreview('imgs_preview', 'imgs_hidden');
        document.getElementById('specs-container').innerHTML=''; window.addKVRow('specs-container');
        document.getElementById('export-container').innerHTML=''; window.addKVRow('export-container');
        document.getElementById('car-modal-title').innerText = "Add New Vehicle"; window.openAdminModal('ep-car-modal'); 
    };
    window.openServiceForm = () => { editingId = null; document.getElementById('service-form').reset(); document.getElementById('service-modal-title').innerText = "Add Service"; window.openAdminModal('ep-service-modal'); };
    window.openSisterForm = () => { editingId = null; document.getElementById('sister-form').reset(); document.getElementById('sister-modal-title').innerText = "Add Sister Company"; window.openAdminModal('ep-sister-modal'); };
    window.openFooterLinkForm = () => { editingId = null; document.getElementById('footer-link-form').reset(); document.getElementById('footer-link-modal-title').innerText = "Add Footer Link"; window.openAdminModal('ep-footer-link-modal'); };

    window.editForm = (table, id) => {
        editingId = id;
        if(table === 'inventory') {
            const item = inventoryData.find(c => c.id === id); const form = document.getElementById('car-form');
            document.getElementById('car-modal-title').innerText = "Edit Vehicle Details";
            for(let k in item) { if(form.elements[k] && typeof item[k]!=='object') form.elements[k].value = item[k]; }
            
            document.getElementById('img_hidden').value = item.img || ''; document.getElementById('img_url').value = (item.img && item.img.length < 1000) ? item.img : '';
            if(item.img) { document.getElementById('img_preview').src = item.img; document.getElementById('img_preview').style.display = 'block'; } else document.getElementById('img_preview').style.display = 'none';
            
            document.getElementById('imgs_hidden').value = JSON.stringify(item.imgs ||[]); document.getElementById('imgs_url').value = '';
            window.renderMultiPreview('imgs_preview', 'imgs_hidden');
            
            form.elements['tags_raw'].value = (item.tags||[]).join(', ');
            
            const sc = document.getElementById('specs-container'); sc.innerHTML='';
            Object.entries(item.specs||{}).forEach(([k,v]) => window.addKVRow('specs-container', k, v));
            if(sc.innerHTML === '') window.addKVRow('specs-container'); 

            const ec = document.getElementById('export-container'); ec.innerHTML='';
            Object.entries(item.export||{}).forEach(([k,v]) => window.addKVRow('export-container', k, v));
            if(ec.innerHTML === '') window.addKVRow('export-container');

            window.openAdminModal('ep-car-modal');
        } else if(table === 'services') {
            const item = servicesData.find(c => c.id === id); const form = document.getElementById('service-form');
            document.getElementById('service-modal-title').innerText = "Edit Service";
            for(let k in item) { if(form.elements[k]) form.elements[k].value = item[k]; }
            window.openAdminModal('ep-service-modal');
        } else if(table === 'sister_companies') {
            const item = sisterCompaniesData.find(c => c.id === id); const form = document.getElementById('sister-form');
            document.getElementById('sister-modal-title').innerText = "Edit Sister Company";
            for(let k in item) { if(form.elements[k]) form.elements[k].value = item[k]; }
            window.openAdminModal('ep-sister-modal');
        } else if(table === 'footer_links') {
            const item = footerLinksData.find(c => c.id === id); const form = document.getElementById('footer-link-form');
            document.getElementById('footer-link-modal-title').innerText = "Edit Footer Link";
            for(let k in item) { if(form.elements[k]) form.elements[k].value = item[k]; }
            window.openAdminModal('ep-footer-link-modal');
        }
    };

    window.delRow = async (table, id) => { 
        if (confirm("Are you sure you want to delete this record permanently?")) { 
            const { error } = await sb.from(table).delete().eq('id', id); 
            if(error) showAdminToast(error.message, 'error');
            else { showAdminToast('Record deleted.', 'success'); loadData(); }
        } 
    };

    window.viewInq = async (id, table) => {
        const item = (table === 'inquiries' ? inquiriesData : quotesData).find(i => i.id === id);
        let info = `Customer: ${item.name}\nEmail: ${item.email}\nDest: ${item.destination}\n\n`;
        if(item.car_title) info += `Vehicle: ${item.car_title}\n`; if(item.interest) info += `Interest: ${item.interest}\n`;
        if(item.notes) info += `Notes: ${item.notes}\n`; if(item.message) info += `Message: ${item.message}\n`;
        info += `\n--- Status Notes ---\n${item.reply || 'None'}`;
        
        const reply = prompt(info + "\n\nEnter admin notes to update status to 'Replied':", item.reply || "");
        if (reply !== null && reply.trim() !== "") { 
            const { error } = await sb.from(table).update({ reply: reply, status: 'Replied' }).eq('id', id); 
            if (error) showAdminToast(error.message, 'error');
            else { showAdminToast('Inquiry marked as replied.', 'success'); loadData(); }
        }
    };

})();