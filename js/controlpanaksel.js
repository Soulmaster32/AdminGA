/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V4.0 PRO)
   Features: Full CRUD, Image Compression, Dynamic Specs Builder,
             Sister Companies, Footer Links, Premium UI/UX.
================================================================ */

(function () {
    'use strict';

    const SUPABASE_URL = 'https://doycdipvtyflshhsxqqx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNkaXB2dHlmbHNoaHN4cXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzczMjIsImV4cCI6MjA5Mjc1MzMyMn0.txaoSZw0DWdhICWnkDDTAFW_WqSkv6YdhHbMTlWLIwk';

    let sb = null;
    let inventoryData = [], inquiriesData = [], quotesData = [], servicesData =[];
    let footerLinksData = [], sisterCompaniesData =[];
    let editingId = null;
    let editingTarget = null; // To track which table we are editing for generic modals

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); init(); };
    document.head.appendChild(script);

    function injectStyles() {
        const css = `
            #ep-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(15px); z-index: 10000; display: none; font-family: 'Montserrat', sans-serif; color: #fff; }
            .ep-container { max-width: 1400px; height: 94vh; margin: 3vh auto; background: #0a0a0c; border: 1px solid rgba(255,59,48,0.3); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
            .ep-header { padding: 20px 30px; background: #111; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
            .ep-nav { display: flex; background: #151518; border-bottom: 1px solid #222; overflow-x: auto; }
            .ep-nav-btn { flex: 1; padding: 18px 15px; border: none; background: none; color: #888; cursor: pointer; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; transition: 0.3s; white-space: nowrap; }
            .ep-nav-btn.active, .ep-nav-btn:hover { color: #ff3b30; background: rgba(255,59,48,0.05); border-bottom: 3px solid #ff3b30; }
            .ep-content { flex: 1; padding: 30px; overflow-y: auto; }
            
            .ep-input, .ep-textarea, .ep-select { width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.4); border: 1px solid #333; color: #fff; border-radius: 6px; font-family: inherit; font-size: 0.85rem; transition: 0.3s; outline: none; }
            .ep-textarea { resize: vertical; min-height: 100px; }
            .ep-input:focus, .ep-textarea:focus, .ep-select:focus { border-color: #ff3b30; box-shadow: 0 0 10px rgba(255,59,48,0.1); }
            .ep-select option { background: #151518; }
            
            .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .ep-btn { padding: 12px 24px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 8px; justify-content: center; }
            .ep-btn-p { background: linear-gradient(135deg, #ff3b30, #d63026); color: #fff; }
            .ep-btn-p:hover { box-shadow: 0 5px 15px rgba(255,59,48,0.3); transform: translateY(-2px); }
            .ep-btn-sec { background: #222; color: #fff; border: 1px solid #444; }
            .ep-btn-sec:hover { background: #333; border-color: #555; }
            .ep-btn-sm { padding: 8px 14px; font-size: 0.7rem; }
            
            .ep-table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #111; border-radius: 8px; overflow: hidden; }
            .ep-table th { text-align: left; padding: 16px; background: #1a1a1d; color: #ff3b30; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
            .ep-table td { padding: 16px; border-bottom: 1px solid #222; font-size: 0.85rem; vertical-align: middle; }
            .ep-table tr:hover { background: rgba(255,255,255,0.02); }
            
            .ep-status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            .status-replied { background: rgba(37,211,102,0.1); color: #25d366; border: 1px solid rgba(37,211,102,0.3); }
            .status-new { background: rgba(255,193,7,0.1); color: #ffc107; border: 1px solid rgba(255,193,7,0.3); }
            
            #ep-admin-trigger { position: fixed; bottom: 25px; left: 25px; width: 55px; height: 55px; border-radius: 50%; background: linear-gradient(135deg, #ff3b30, #d63026); color: white; border: none; cursor: pointer; z-index: 9999; box-shadow: 0 5px 20px rgba(255,59,48,0.5); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; transition: 0.3s; }
            #ep-admin-trigger:hover { transform: scale(1.1); }
            
            .modal-wrapper { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:11000; padding:40px; overflow-y:auto; backdrop-filter: blur(8px); }
            .modal-inner { max-width: 1000px; margin: 0 auto; background: #151518; padding: 40px; border-radius: 12px; border: 1px solid #333; box-shadow: 0 25px 60px rgba(0,0,0,0.9); position: relative; }
            .ep-label { display: block; font-size: 0.7rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; }
            
            /* Premium Vehicle Edit Sections */
            .ep-section { background: #0a0a0c; border: 1px solid #222; border-radius: 8px; padding: 25px; margin-bottom: 25px; }
            .ep-sec-title { font-size: 0.9rem; font-weight: 800; color: #ff3b30; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .kv-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
            .close-modal-btn { position: absolute; top: 20px; right: 20px; background: #222; border: 1px solid #444; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
            .close-modal-btn:hover { background: #ff3b30; border-color: #ff3b30; }

            .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            @media(max-width: 800px) { .split-grid { grid-template-columns: 1fr; } }
        `;
        const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);
    }

    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
            <button id="ep-admin-trigger" title="Admin Control Panel"><i class="fas fa-user-shield"></i></button>
            <div id="ep-overlay">
                <div class="ep-container">
                    <div class="ep-header">
                        <div style="font-size: 1.5rem; font-weight: 800; letter-spacing: 3px;">ELITE <span style="color:#ff3b30">ADMIN PRO</span></div>
                        <button class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-overlay').style.display='none'"><i class="fas fa-times"></i> Close</button>
                    </div>

                    <div id="ep-login-form" style="padding: 100px 20px; max-width: 450px; margin: 0 auto; text-align: center;">
                        <h2 style="margin-bottom: 25px; font-weight: 800;">Secure Login</h2>
                        <input type="email" id="ep-email" class="ep-input" style="margin-bottom:15px" placeholder="Admin Email">
                        <input type="password" id="ep-pass" class="ep-input" style="margin-bottom:25px" placeholder="Password">
                        <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width: 100%;"><i class="fas fa-lock"></i> Authenticate Session</button>
                    </div>

                    <div id="ep-main-panel" style="display: none; display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                        <div class="ep-nav">
                            <button class="ep-nav-btn active" data-tab="tab-inventory"><i class="fas fa-car"></i> Inventory</button>
                            <button class="ep-nav-btn" data-tab="tab-leads"><i class="fas fa-envelope-open-text"></i> Specific Inquiries</button>
                            <button class="ep-nav-btn" data-tab="tab-quotes"><i class="fas fa-file-invoice-dollar"></i> Quote Requests</button>
                            <button class="ep-nav-btn" data-tab="tab-services"><i class="fas fa-briefcase"></i> Services</button>
                            <button class="ep-nav-btn" data-tab="tab-footer"><i class="fas fa-link"></i> Footer & Partners</button>
                            <button class="ep-nav-btn" data-tab="tab-settings"><i class="fas fa-cog"></i> Settings</button>
                            <button class="ep-nav-btn" id="ep-logout" style="flex: 0.5; color: #ff4444;"><i class="fas fa-sign-out-alt"></i> Logout</button>
                        </div>

                        <div class="ep-content">
                            <!-- INVENTORY -->
                            <div id="tab-inventory" class="ep-tab-content">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                                    <input type="text" id="inv-search" class="ep-input" style="max-width: 400px;" placeholder="Search make or model..." onkeyup="window.filterInventory()">
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
                                    <!-- Sister Companies -->
                                    <div class="ep-section">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                            <h3 style="color:#ff3b30; text-transform:uppercase; font-size:0.9rem; letter-spacing:2px;"><i class="fas fa-building"></i> Sister Companies</h3>
                                            <button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.openSisterForm()"><i class="fas fa-plus"></i> Add</button>
                                        </div>
                                        <table class="ep-table">
                                            <thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead>
                                            <tbody id="sister-list"></tbody>
                                        </table>
                                    </div>
                                    <!-- Footer Links -->
                                    <div class="ep-section">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                            <h3 style="color:#ff3b30; text-transform:uppercase; font-size:0.9rem; letter-spacing:2px;"><i class="fas fa-link"></i> Footer Links</h3>
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
                                    <form id="settings-form" style="display:flex; flex-direction:column; gap:15px;">
                                        <div><label class="ep-label">Physical Address</label><input id="set-address" class="ep-input"></div>
                                        <div><label class="ep-label">Phone / WhatsApp</label><input id="set-phone" class="ep-input"></div>
                                        <div><label class="ep-label">Support Email</label><input id="set-email" class="ep-input"></div>
                                        <div><label class="ep-label">Google Maps Iframe URL</label><textarea id="set-map" class="ep-textarea"></textarea></div>
                                        <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Global Settings</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PREMIUM CAR EDIT MODAL -->
            <div id="ep-car-modal" class="modal-wrapper">
                <div class="modal-inner">
                    <button class="close-modal-btn" onclick="document.getElementById('ep-car-modal').style.display='none'"><i class="fas fa-times"></i></button>
                    <h2 id="car-modal-title" style="margin-bottom: 30px; font-weight: 800; font-size: 1.8rem;">Vehicle Editor</h2>
                    
                    <form id="car-form">
                        <!-- ROW 1: Basic & Pricing -->
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

                        <!-- ROW 2: Media -->
                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-images"></i> Media Gallery</div>
                            <div class="split-grid">
                                <div>
                                    <label class="ep-label">Primary Image (Upload OR URL)</label>
                                    <input type="file" id="img_file" class="ep-input" accept="image/*" style="margin-bottom: 10px;">
                                    <input type="text" id="img_url" class="ep-input" placeholder="Or paste image URL...">
                                    <input type="hidden" name="img" id="img_hidden">
                                    <img id="img_preview" style="height: 140px; object-fit: cover; display: none; margin-top: 15px; border-radius: 6px; border: 1px solid #444;">
                                </div>
                                <div>
                                    <label class="ep-label">Additional Gallery Images</label>
                                    <input type="file" id="imgs_files" class="ep-input" accept="image/*" multiple style="margin-bottom: 10px;">
                                    <input type="text" id="imgs_url" class="ep-input" placeholder="Or comma-separated URLs...">
                                    <input type="hidden" name="imgs_raw" id="imgs_hidden">
                                    <div id="imgs_preview" style="display:flex; gap:10px; margin-top:15px; overflow-x:auto;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- ROW 3: Dynamic Specs & Export Data -->
                        <div class="split-grid">
                            <div class="ep-section">
                                <div class="ep-sec-title"><i class="fas fa-cogs"></i> Technical Specifications</div>
                                <div id="specs-container"></div>
                                <button type="button" class="ep-btn ep-btn-sec ep-btn-sm" style="margin-top:10px; width:100%" onclick="window.addKVRow('specs-container')"><i class="fas fa-plus"></i> Add Spec Row</button>
                            </div>
                            <div class="ep-section">
                                <div class="ep-sec-title"><i class="fas fa-ship"></i> Export & Logistics Data</div>
                                <div id="export-container"></div>
                                <button type="button" class="ep-btn ep-btn-sec ep-btn-sm" style="margin-top:10px; width:100%" onclick="window.addKVRow('export-container')"><i class="fas fa-plus"></i> Add Logistics Row</button>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid #333; padding-top: 25px;">
                            <button type="button" class="ep-btn ep-btn-sec" onclick="document.getElementById('ep-car-modal').style.display='none'">Cancel</button>
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Vehicle Record</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- SERVICE MODAL -->
            <div id="ep-service-modal" class="modal-wrapper">
                <div class="modal-inner" style="max-width: 600px;">
                    <button class="close-modal-btn" onclick="document.getElementById('ep-service-modal').style.display='none'"><i class="fas fa-times"></i></button>
                    <h2 id="service-modal-title" style="margin-bottom: 25px;">Add Service</h2>
                    <form id="service-form" class="ep-grid">
                        <div style="grid-column: span 2;"><label class="ep-label">Icon Class</label><input name="icon" class="ep-input" required placeholder="fas fa-globe"></div>
                        <div style="grid-column: span 2;"><label class="ep-label">Title</label><input name="title" class="ep-input" required></div>
                        <div style="grid-column: span 2;"><label class="ep-label">Description</label><textarea name="description" class="ep-textarea" required></textarea></div>
                        <div style="grid-column: span 2; display: flex; gap: 15px;">
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Service</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- SISTER COMPANY MODAL -->
            <div id="ep-sister-modal" class="modal-wrapper">
                <div class="modal-inner" style="max-width: 600px;">
                    <button class="close-modal-btn" onclick="document.getElementById('ep-sister-modal').style.display='none'"><i class="fas fa-times"></i></button>
                    <h2 id="sister-modal-title" style="margin-bottom: 25px;">Sister Company</h2>
                    <form id="sister-form" class="ep-grid">
                        <div><label class="ep-label">Highlight Text (Red)</label><input name="highlight" class="ep-input" required placeholder="e.g. EWAN"></div>
                        <div><label class="ep-label">Remaining Name</label><input name="name" class="ep-input" required placeholder="e.g. ALMUTAMAIZ"></div>
                        <div style="grid-column: span 2;"><label class="ep-label">Description Subtitle</label><input name="description" class="ep-input" required placeholder="Premium Automotive — UAE"></div>
                        <div style="grid-column: span 2;"><label class="ep-label">Target URL</label><input name="url" class="ep-input" required placeholder="https://..."></div>
                        <div style="grid-column: span 2; display: flex; gap: 15px;">
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Company</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- FOOTER LINK MODAL -->
            <div id="ep-footer-link-modal" class="modal-wrapper">
                <div class="modal-inner" style="max-width: 600px;">
                    <button class="close-modal-btn" onclick="document.getElementById('ep-footer-link-modal').style.display='none'"><i class="fas fa-times"></i></button>
                    <h2 id="footer-link-modal-title" style="margin-bottom: 25px;">Footer Link</h2>
                    <form id="footer-link-form" class="ep-grid">
                        <div style="grid-column: span 2;"><label class="ep-label">Section</label>
                            <select name="section" class="ep-select">
                                <option value="quick">Quick Links</option>
                                <option value="inventory">Inventory Categories</option>
                            </select>
                        </div>
                        <div><label class="ep-label">Link Label</label><input name="label" class="ep-input" required placeholder="e.g. Luxury Sedans"></div>
                        <div><label class="ep-label">URL / Anchor</label><input name="url" class="ep-input" required placeholder="e.g. #showroom"></div>
                        <div style="grid-column: span 2;"><label class="ep-label">Icon Class</label><input name="icon" class="ep-input" value="fas fa-chevron-right" placeholder="e.g. fas fa-chevron-right"></div>
                        <div style="grid-column: span 2; display: flex; gap: 15px;">
                            <button type="submit" class="ep-btn ep-btn-p"><i class="fas fa-save"></i> Save Link</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    // Dynamic Key-Value Builder UI
    window.addKVRow = (containerId, key = '', val = '') => {
        const div = document.createElement('div');
        div.className = 'kv-row';
        div.innerHTML = `
            <input type="text" class="ep-input kv-k" placeholder="Key (e.g. Engine)" value="${key}" style="flex:1">
            <input type="text" class="ep-input kv-v" placeholder="Value (e.g. 4.0L V8)" value="${val}" style="flex:2">
            <button type="button" class="ep-btn ep-btn-sec" style="padding: 12px 16px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
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

    // Canvas Image Compression to Base64
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

    function setupImageUpload(fileId, urlId, hidId, prevId, multiple) {
        const fi = document.getElementById(fileId), ui = document.getElementById(urlId), hi = document.getElementById(hidId), pr = document.getElementById(prevId);
        if(!multiple) {
            ui.addEventListener('input', e => { hi.value = e.target.value; pr.src = e.target.value; pr.style.display = e.target.value ? 'block' : 'none'; });
            fi.addEventListener('change', e => {
                if(!e.target.files.length) return; ui.value = '';
                compressImage(e.target.files[0], b64 => { hi.value = b64; pr.src = b64; pr.style.display = 'block'; });
            });
        } else {
            ui.addEventListener('input', e => {
                const urls = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                hi.value = JSON.stringify(urls); pr.innerHTML = '';
                urls.forEach(u => { const i = document.createElement('img'); i.src = u; i.style.height='60px'; i.style.borderRadius='4px'; pr.appendChild(i); });
            });
            fi.addEventListener('change', e => {
                if(!e.target.files.length) return; ui.value = ''; pr.innerHTML = '';
                const arr =[]; let loaded = 0;
                Array.from(e.target.files).forEach((file, idx) => {
                    compressImage(file, b64 => {
                        arr[idx] = b64;
                        const i = document.createElement('img'); i.src = b64; i.style.height='60px'; i.style.borderRadius='4px'; pr.appendChild(i);
                        loaded++; if(loaded === e.target.files.length) hi.value = JSON.stringify(arr);
                    });
                });
            });
        }
    }

    async function init() {
        injectStyles(); injectHTML();
        
        setupImageUpload('img_file', 'img_url', 'img_hidden', 'img_preview', false);
        setupImageUpload('imgs_files', 'imgs_url', 'imgs_hidden', 'imgs_preview', true);

        document.getElementById('ep-admin-trigger').onclick = () => document.getElementById('ep-overlay').style.display = 'block';
        document.getElementById('ep-login-btn').onclick = async () => {
            const { data, error } = await sb.auth.signInWithPassword({ email: document.getElementById('ep-email').value, password: document.getElementById('ep-pass').value });
            if (error) return alert("Login Failed: " + error.message);
            showPanel();
        };
        document.getElementById('ep-logout').onclick = async () => { await sb.auth.signOut(); document.getElementById('ep-login-form').style.display = 'block'; document.getElementById('ep-main-panel').style.display = 'none'; };

        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.style.display = 'none');
                btn.classList.add('active'); document.getElementById(btn.dataset.tab).style.display = 'block';
            };
        });

        // Car Form Submit
        document.getElementById('car-form').onsubmit = async (e) => {
            e.preventDefault(); const fd = new FormData(e.target); const obj = Object.fromEntries(fd.entries());
            obj.img = document.getElementById('img_hidden').value;
            try { obj.imgs = JSON.parse(document.getElementById('imgs_hidden').value); } catch(err) { obj.imgs =[]; }
            obj.tags = obj.tags_raw ? obj.tags_raw.split(',').map(s=>s.trim()).filter(Boolean) :[];
            
            // Extract from KV builders
            obj.specs = extractKV('specs-container'); 
            obj.export = extractKV('export-container');
            delete obj.tags_raw; delete obj.imgs_raw;

            if (editingId) await sb.from('inventory').update(obj).eq('id', editingId); else await sb.from('inventory').insert([obj]);
            document.getElementById('ep-car-modal').style.display = 'none'; loadData();
        };

        // Service Submit
        document.getElementById('service-form').onsubmit = async (e) => {
            e.preventDefault(); const obj = Object.fromEntries(new FormData(e.target).entries());
            if (editingId) await sb.from('services').update(obj).eq('id', editingId); else await sb.from('services').insert([obj]);
            document.getElementById('ep-service-modal').style.display = 'none'; loadData();
        };

        // Sister Company Submit
        document.getElementById('sister-form').onsubmit = async (e) => {
            e.preventDefault(); const obj = Object.fromEntries(new FormData(e.target).entries());
            if (editingId) await sb.from('sister_companies').update(obj).eq('id', editingId); else await sb.from('sister_companies').insert([obj]);
            document.getElementById('ep-sister-modal').style.display = 'none'; loadData();
        };

        // Footer Link Submit
        document.getElementById('footer-link-form').onsubmit = async (e) => {
            e.preventDefault(); const obj = Object.fromEntries(new FormData(e.target).entries());
            if (editingId) await sb.from('footer_links').update(obj).eq('id', editingId); else await sb.from('footer_links').insert([obj]);
            document.getElementById('ep-footer-link-modal').style.display = 'none'; loadData();
        };

        // Settings Submit
        document.getElementById('settings-form').onsubmit = async (e) => {
            e.preventDefault();
            const val = { address: document.getElementById('set-address').value, phone: document.getElementById('set-phone').value, email: document.getElementById('set-email').value, map_iframe: document.getElementById('set-map').value };
            await sb.from('site_settings').update({value: val}).eq('key', 'contact_info'); alert('Settings Saved!');
        };

        const { data } = await sb.auth.getUser(); if (data.user) showPanel();
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
        
        inventoryData = inv.data || []; inquiriesData = inq.data ||[]; quotesData = qts.data ||[]; 
        servicesData = svc.data ||[]; footerLinksData = fl.data ||[]; sisterCompaniesData = sc.data ||[];
        
        renderInventory(inventoryData);
        
        const stFn = (s) => `<span class="ep-status ${s==='Replied'?'status-replied':'status-new'}">${s||'New'}</span>`;
        document.getElementById('leads-list').innerHTML = inquiriesData.map(i => `<tr><td>${new Date(i.created_at).toLocaleDateString()}</td><td><strong>${i.name}</strong><br><small>${i.email} | ${i.phone}</small></td><td>${i.car_title}</td><td>${stFn(i.status)}</td><td><button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.viewInq(${i.id}, 'inquiries')">Manage</button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('inquiries',${i.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        document.getElementById('quotes-list').innerHTML = quotesData.map(i => `<tr><td>${new Date(i.created_at).toLocaleDateString()}</td><td><strong>${i.name}</strong><br><small>${i.email}</small></td><td>${i.interest}</td><td>${stFn(i.status)}</td><td><button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.viewInq(${i.id}, 'quotes')">Manage</button> <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.delRow('quotes',${i.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        
        document.getElementById('services-list').innerHTML = servicesData.map(s => `<tr><td><i class="${s.icon}" style="font-size:1.5rem; color:#ff3b30"></i></td><td><strong>${s.title}</strong></td><td>${s.description.substring(0,40)}...</td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('services',${s.id})"><i class="fas fa-edit"></i> Edit</button> <button class="ep-btn ep-btn-sec ep-btn-sm" style="color:#f44" onclick="window.delRow('services',${s.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        
        document.getElementById('sister-list').innerHTML = sisterCompaniesData.map(s => `<tr><td><strong><span style="color:#ff3b30">${s.highlight}</span> ${s.name}</strong></td><td>${s.url}</td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('sister_companies',${s.id})"><i class="fas fa-edit"></i></button> <button class="ep-btn ep-btn-sec ep-btn-sm" style="color:#f44" onclick="window.delRow('sister_companies',${s.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        
        document.getElementById('footer-links-list').innerHTML = footerLinksData.map(f => `<tr><td><span class="ep-status status-new" style="background:rgba(255,255,255,0.1); color:#fff; border:none;">${f.section}</span></td><td><i class="${f.icon}"></i> ${f.label}</td><td>${f.url}</td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('footer_links',${f.id})"><i class="fas fa-edit"></i></button> <button class="ep-btn ep-btn-sec ep-btn-sm" style="color:#f44" onclick="window.delRow('footer_links',${f.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');

        if(set.data && set.data.value) {
            document.getElementById('set-address').value = set.data.value.address || ''; document.getElementById('set-phone').value = set.data.value.phone || ''; document.getElementById('set-email').value = set.data.value.email || ''; document.getElementById('set-map').value = set.data.value.map_iframe || '';
        }
    }
    
    function renderInventory(data) {
        document.getElementById('inv-list').innerHTML = data.map(i => `<tr><td><img src="${i.img}" style="height:45px; width:70px; border-radius:4px; object-fit:cover; border: 1px solid #333;"></td><td><strong>${i.make}</strong> ${i.name}</td><td><strong style="color:#fff">${i.price}</strong></td><td><span class="ep-status status-replied" style="background:rgba(255,59,48,0.1); color:#ff3b30; border:none;">${i.cat}</span></td><td><button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('inventory',${i.id})"><i class="fas fa-edit"></i> Edit</button> <button class="ep-btn ep-btn-sec ep-btn-sm" style="color:#f44" onclick="window.delRow('inventory',${i.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    }

    window.filterInventory = () => { const q = document.getElementById('inv-search').value.toLowerCase(); renderInventory(inventoryData.filter(i => i.make.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))); };

    // --- FORM OPENERS (ADD NEW) ---
    window.openCarForm = () => { 
        editingId = null; document.getElementById('car-form').reset(); 
        document.getElementById('img_hidden').value = ''; document.getElementById('img_preview').style.display='none';
        document.getElementById('imgs_hidden').value = '[]'; document.getElementById('imgs_preview').innerHTML='';
        document.getElementById('specs-container').innerHTML=''; window.addKVRow('specs-container');
        document.getElementById('export-container').innerHTML=''; window.addKVRow('export-container');
        document.getElementById('car-modal-title').innerText = "Add New Vehicle"; document.getElementById('ep-car-modal').style.display = 'block'; 
    };
    window.openServiceForm = () => { editingId = null; document.getElementById('service-form').reset(); document.getElementById('service-modal-title').innerText = "Add Service"; document.getElementById('ep-service-modal').style.display = 'block'; };
    window.openSisterForm = () => { editingId = null; document.getElementById('sister-form').reset(); document.getElementById('sister-modal-title').innerText = "Add Sister Company"; document.getElementById('ep-sister-modal').style.display = 'block'; };
    window.openFooterLinkForm = () => { editingId = null; document.getElementById('footer-link-form').reset(); document.getElementById('footer-link-modal-title').innerText = "Add Footer Link"; document.getElementById('ep-footer-link-modal').style.display = 'block'; };

    // --- EDIT EXISTING RECORD ---
    window.editForm = (table, id) => {
        editingId = id;
        if(table === 'inventory') {
            const item = inventoryData.find(c => c.id === id); const form = document.getElementById('car-form');
            document.getElementById('car-modal-title').innerText = "Edit Vehicle details";
            for(let k in item) { if(form.elements[k] && typeof item[k]!=='object') form.elements[k].value = item[k]; }
            
            document.getElementById('img_hidden').value = item.img || ''; document.getElementById('img_url').value = (item.img && item.img.length < 1000) ? item.img : '';
            if(item.img) { document.getElementById('img_preview').src = item.img; document.getElementById('img_preview').style.display = 'block'; } else document.getElementById('img_preview').style.display = 'none';
            
            document.getElementById('imgs_hidden').value = JSON.stringify(item.imgs ||[]); document.getElementById('imgs_url').value = '';
            const pr = document.getElementById('imgs_preview'); pr.innerHTML = '';
            (item.imgs ||[]).forEach(u => { const i = document.createElement('img'); i.src = u; i.style.height='60px'; i.style.borderRadius='4px'; pr.appendChild(i); });
            
            form.elements['tags_raw'].value = (item.tags||[]).join(', ');
            
            // Populate KV Builders
            const sc = document.getElementById('specs-container'); sc.innerHTML='';
            Object.entries(item.specs||{}).forEach(([k,v]) => window.addKVRow('specs-container', k, v));
            if(sc.innerHTML === '') window.addKVRow('specs-container'); // empty row

            const ec = document.getElementById('export-container'); ec.innerHTML='';
            Object.entries(item.export||{}).forEach(([k,v]) => window.addKVRow('export-container', k, v));
            if(ec.innerHTML === '') window.addKVRow('export-container');

            document.getElementById('ep-car-modal').style.display = 'block';
        } else if(table === 'services') {
            const item = servicesData.find(c => c.id === id); const form = document.getElementById('service-form');
            document.getElementById('service-modal-title').innerText = "Edit Service";
            for(let k in item) { if(form.elements[k]) form.elements[k].value = item[k]; }
            document.getElementById('ep-service-modal').style.display = 'block';
        } else if(table === 'sister_companies') {
            const item = sisterCompaniesData.find(c => c.id === id); const form = document.getElementById('sister-form');
            document.getElementById('sister-modal-title').innerText = "Edit Sister Company";
            for(let k in item) { if(form.elements[k]) form.elements[k].value = item[k]; }
            document.getElementById('ep-sister-modal').style.display = 'block';
        } else if(table === 'footer_links') {
            const item = footerLinksData.find(c => c.id === id); const form = document.getElementById('footer-link-form');
            document.getElementById('footer-link-modal-title').innerText = "Edit Footer Link";
            for(let k in item) { if(form.elements[k]) form.elements[k].value = item[k]; }
            document.getElementById('ep-footer-link-modal').style.display = 'block';
        }
    };

    window.delRow = async (table, id) => { if (confirm("Delete this permanently?")) { await sb.from(table).delete().eq('id', id); loadData(); } };

    window.viewInq = async (id, table) => {
        const item = (table === 'inquiries' ? inquiriesData : quotesData).find(i => i.id === id);
        let info = `Customer: ${item.name}\nEmail: ${item.email}\nDest: ${item.destination}\n\n`;
        if(item.car_title) info += `Vehicle: ${item.car_title}\n`; if(item.interest) info += `Interest: ${item.interest}\n`;
        if(item.notes) info += `Notes: ${item.notes}\n`; if(item.message) info += `Message: ${item.message}\n`;
        info += `\n--- Status Notes ---\n${item.reply || 'None'}`;
        const reply = prompt(info + "\n\nEnter admin notes to mark as 'Replied':", item.reply || "");
        if (reply !== null && reply.trim() !== "") { await sb.from(table).update({ reply: reply, status: 'Replied' }).eq('id', id); loadData(); }
    };

})();
