/* ================================================================
   ELITE ROUTE — ELITE ADMIN SUITE (V6.0 ULTRA)
   Features: Full CRUD, CRM Modals, Dashboard Stats, Quick Stats Sync,
             Image Compression, Dynamic Specs Builder, Keyboard Nav,
             Sister Companies, Footer Links, Premium UI/UX, Drag/Drop.
================================================================ */

(function () {
    'use strict';

    let sb = null;
    let inventoryData = [], inquiriesData = [], quotesData = [], servicesData =[];
    let footerLinksData = [], sisterCompaniesData =[];
    let editingId = null;
    let pendingDeleteFn = null;
    let currentInqItem = null, currentInqTable = null;
    
    // Lightbox State
    let currentLightboxImages =[];
    let currentLightboxIndex = 0;

    /* ──────────────────────────────────────────────
       BOOTSTRAP
    ────────────────────────────────────────────── */
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

    if (typeof window.supabase === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = checkSupabase;
        document.head.appendChild(script);
    } else {
        checkSupabase();
    }

    /* ──────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────── */
    function initAdmin() {
        injectStyles();
        injectHTML();

        setupImageUpload('img_file', 'img_url', 'img_hidden', 'img_preview', false);
        setupImageUpload('imgs_files', 'imgs_url', 'imgs_hidden', 'imgs_preview', true);

        // Trigger links
        const adminTrigger = document.getElementById('admin-access-link');
        if (adminTrigger) {
            adminTrigger.onclick = (e) => { e.preventDefault(); openMainPanel(); };
        }
        const fallback = document.getElementById('ep-admin-trigger');
        if (fallback) fallback.onclick = openMainPanel;

        // Login
        document.getElementById('ep-login-btn').onclick = handleLogin;
        document.getElementById('ep-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });

        // Logout
        document.getElementById('ep-logout').onclick = async () => {
            await sb.auth.signOut();
            document.getElementById('ep-login-form').style.display = 'flex';
            document.getElementById('ep-main-panel').style.display = 'none';
            showAdminToast('Logged out successfully.', 'success');
        };

        // Nav tabs
        document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ep-nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.ep-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            };
        });

        // Form submissions
        document.getElementById('car-form').onsubmit = (e) => handleFormSubmit(e, 'inventory', (fd) => {
            const obj = Object.fromEntries(fd.entries());
            obj.img = document.getElementById('img_hidden').value;
            
            try { obj.imgs = JSON.parse(document.getElementById('imgs_hidden').value); } 
            catch { obj.imgs =[]; }
            
            obj.tags = obj.tags_raw ? obj.tags_raw.split(',').map(s => s.trim()).filter(Boolean) :[];
            
            // Build Specs (Combines Dedicated Quick Stats + Custom KV Rows)
            const customSpecs = extractKV('specs-container');
            const finalSpecs = {};
            if (obj.spec_mileage) finalSpecs['Mileage'] = obj.spec_mileage;
            if (obj.spec_fuel) finalSpecs['Fuel'] = obj.spec_fuel;
            if (obj.spec_trans) finalSpecs['Transmission'] = obj.spec_trans;
            if (obj.spec_year) finalSpecs['Year'] = obj.spec_year;
            
            Object.assign(finalSpecs, customSpecs);
            obj.specs = finalSpecs;
            
            obj.export = extractKV('export-container');
            
            // Cleanup temp fields before sending to DB
            delete obj.tags_raw; delete obj.imgs_raw;
            delete obj.spec_mileage; delete obj.spec_fuel; 
            delete obj.spec_trans; delete obj.spec_year;
            
            return obj;
        });

        document.getElementById('service-form').onsubmit = (e) => handleFormSubmit(e, 'services', fd => Object.fromEntries(fd.entries()));
        document.getElementById('sister-form').onsubmit = (e) => handleFormSubmit(e, 'sister_companies', fd => Object.fromEntries(fd.entries()));
        document.getElementById('footer-link-form').onsubmit = (e) => handleFormSubmit(e, 'footer_links', fd => Object.fromEntries(fd.entries()));

        // Settings
        document.getElementById('settings-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const origTxt = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
            const val = {
                address: document.getElementById('set-address').value,
                phone: document.getElementById('set-phone').value,
                email: document.getElementById('set-email').value,
                map_iframe: document.getElementById('set-map').value
            };
            const { error } = await sb.from('site_settings').update({ value: val }).eq('key', 'contact_info');
            btn.innerHTML = origTxt; btn.disabled = false;
            if (error) showAdminToast(error.message, 'error'); else showAdminToast('Global Settings Saved!', 'success');
        };

        // Lightbox Navigation Controls
        document.getElementById('lb-prev').onclick = () => {
            if (currentLightboxImages.length <= 1) return;
            let newIndex = currentLightboxIndex - 1;
            if (newIndex < 0) newIndex = currentLightboxImages.length - 1;
            window.setLightboxIndex(newIndex);
        };
        document.getElementById('lb-next').onclick = () => {
            if (currentLightboxImages.length <= 1) return;
            let newIndex = currentLightboxIndex + 1;
            if (newIndex >= currentLightboxImages.length) newIndex = 0;
            window.setLightboxIndex(newIndex);
        };
        document.getElementById('img_preview').onclick = () => {
            const url = document.getElementById('img_hidden').value;
            if (url) window.openLightbox([url], 0);
        };

        // Confirm modal buttons
        document.getElementById('ep-confirm-cancel').onclick = () => closeAdminModal('ep-confirm-modal');
        document.getElementById('ep-confirm-ok').onclick = () => {
            closeAdminModal('ep-confirm-modal');
            if (typeof pendingDeleteFn === 'function') { pendingDeleteFn(); pendingDeleteFn = null; }
        };

        // Inquiry modal reply submit
        document.getElementById('ep-inq-reply-btn').onclick = submitInqReply;

        // Escape key to close top-level modal
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const modals =['ep-lightbox-modal', 'ep-inq-modal', 'ep-confirm-modal', 'ep-car-modal', 'ep-service-modal', 'ep-sister-modal', 'ep-footer-link-modal'];
            for (const id of modals) {
                const el = document.getElementById(id);
                if (el && el.classList.contains('open')) { closeAdminModal(id); return; }
            }
            closeMainPanel();
        });

        // Check session
        sb.auth.getUser().then(({ data }) => { if (data.user) showPanel(); });
    }

    function openMainPanel() {
        const ov = document.getElementById('ep-overlay');
        ov.style.display = 'flex';
        requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('ep-show')));
    }

    async function handleLogin() {
        const btn = document.getElementById('ep-login-btn');
        const origTxt = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...'; btn.disabled = true;
        const { error } = await sb.auth.signInWithPassword({
            email: document.getElementById('ep-email').value,
            password: document.getElementById('ep-pass').value
        });
        btn.innerHTML = origTxt; btn.disabled = false;
        if (error) return showAdminToast('Login Failed: ' + error.message, 'error');
        showAdminToast('Welcome back, Admin.', 'success');
        showPanel();
    }

    /* ──────────────────────────────────────────────
       DATA & RENDER
    ────────────────────────────────────────────── */
    function showPanel() {
        document.getElementById('ep-login-form').style.display = 'none';
        document.getElementById('ep-main-panel').style.display = 'flex';
        loadData();
    }

    async function loadData() {
        setTabLoading(true);
        try {
            const [inv, inq, qts, svc, set, fl, sc] = await Promise.all([
                sb.from('inventory').select('*').order('id', { ascending: false }),
                sb.from('inquiries').select('*').order('created_at', { ascending: false }),
                sb.from('quotes').select('*').order('created_at', { ascending: false }),
                sb.from('services').select('*').order('order_idx'),
                sb.from('site_settings').select('*').eq('key', 'contact_info').single(),
                sb.from('footer_links').select('*').order('order_idx'),
                sb.from('sister_companies').select('*').order('order_idx')
            ]);

            inventoryData = inv.data || [];
            inquiriesData = inq.data ||[];
            quotesData = qts.data || [];
            servicesData = svc.data ||[];
            footerLinksData = fl.data || [];
            sisterCompaniesData = sc.data ||[];

            renderDashboard();
            renderInventory(inventoryData);
            renderLeads();
            renderQuotes();
            renderServices();
            renderSister();
            renderFooterLinks();
            if (set.data && set.data.value) renderSettings(set.data.value);
        } catch (err) {
            showAdminToast('Error loading data: ' + err.message, 'error');
        } finally {
            setTabLoading(false);
        }
    }

    function setTabLoading(loading) {
        document.querySelectorAll('.ep-table tbody').forEach(tb => {
            if (loading) {
                tb.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:#888;">
                    <i class="fas fa-circle-notch fa-spin" style="color:#ff3b30;font-size:1.5rem;margin-bottom:10px;display:block;"></i>
                    Loading data...</td></tr>`;
            }
        });
    }

    function renderDashboard() {
        const newInq = inquiriesData.filter(i => i.status !== 'Replied').length;
        const newQts = quotesData.filter(q => q.status !== 'Replied').length;
        document.getElementById('dash-inventory').textContent = inventoryData.length;
        document.getElementById('dash-inquiries').textContent = inquiriesData.length;
        document.getElementById('dash-inquiries-new').textContent = newInq > 0 ? `${newInq} new` : 'All replied';
        document.getElementById('dash-quotes').textContent = quotesData.length;
        document.getElementById('dash-quotes-new').textContent = newQts > 0 ? `${newQts} pending` : 'All replied';
        document.getElementById('dash-services').textContent = servicesData.length;

        const recentHtml =[...inquiriesData.slice(0, 5), ...quotesData.slice(0, 3)]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 6)
            .map(i => `
            <div class="dash-item" onclick="window.viewInq(${i.id}, '${i.car_title ? 'inquiries' : 'quotes'}')">
                <div class="dash-item-avatar">${(i.name || '?')[0].toUpperCase()}</div>
                <div class="dash-item-info">
                    <strong>${i.name || 'Unknown'}</strong>
                    <span>${i.car_title || i.interest || 'Quote Request'}</span>
                </div>
                <div>${statusBadge(i.status)}</div>
            </div>`).join('') || '<p style="color:#888;text-align:center;padding:20px;">No recent activity</p>';
        document.getElementById('dash-recent-list').innerHTML = recentHtml;
    }

    function renderInventory(data) {
        document.getElementById('inv-list').innerHTML = data.length === 0
            ? `<tr><td colspan="5" style="text-align:center;padding:40px;color:#888;">No vehicles found.</td></tr>`
            : data.map(i => `
            <tr>
                <td><div style="padding:3px;background:var(--ep-card);border:1px solid var(--ep-border);border-radius:6px;display:inline-block;cursor:pointer;transition:0.3s;" onclick="window.viewCarGallery(${i.id})" onmouseover="this.style.borderColor='var(--ep-primary)'" onmouseout="this.style.borderColor='var(--ep-border)'" title="View Gallery">
                    <img src="${i.img || 'https://placehold.co/75x45?text=No+Img'}" style="height:45px;width:75px;border-radius:4px;object-fit:cover;" onerror="this.src='https://placehold.co/75x45?text=Error'"></div></td>
                <td><strong>${i.make || ''}</strong> <span style="color:#aaa">${i.name || ''}</span></td>
                <td><strong style="color:#fff;font-size:1rem;">${i.price || '—'}</strong></td>
                <td><span class="ep-status" style="background:rgba(255,59,48,0.08);color:var(--ep-primary);border:1px solid rgba(255,59,48,0.2);">${i.cat || '—'}</span></td>
                <td>
                    <button class="ep-btn ep-btn-p ep-btn-sm" style="margin-right:6px;" onclick="window.viewCarGallery(${i.id})" title="View Images Gallery"><i class="fas fa-images"></i> View</button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('inventory',${i.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" style="margin-left:6px" onclick="window.delRow('inventory',${i.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </td>
            </tr>`).join('');
    }

    function renderLeads() {
        document.getElementById('leads-list').innerHTML = inquiriesData.length === 0
            ? `<tr><td colspan="5" style="text-align:center;padding:40px;color:#888;">No inquiries yet.</td></tr>`
            : inquiriesData.map(i => `
            <tr>
                <td style="white-space:nowrap;">${formatDate(i.created_at)}</td>
                <td><strong>${i.name || ''}</strong><br><small style="color:#aaa">${i.email || ''} ${i.phone ? '| ' + i.phone : ''}</small></td>
                <td><span style="color:var(--ep-primary);font-weight:700">${i.car_title || '—'}</span></td>
                <td>${statusBadge(i.status)}</td>
                <td>
                    <button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.viewInq(${i.id},'inquiries')"><i class="fas fa-eye"></i> View</button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" style="margin-left:6px" onclick="window.delRow('inquiries',${i.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </td>
            </tr>`).join('');
    }

    function renderQuotes() {
        document.getElementById('quotes-list').innerHTML = quotesData.length === 0
            ? `<tr><td colspan="5" style="text-align:center;padding:40px;color:#888;">No quotes yet.</td></tr>`
            : quotesData.map(i => `
            <tr>
                <td style="white-space:nowrap;">${formatDate(i.created_at)}</td>
                <td><strong>${i.name || ''}</strong><br><small style="color:#aaa">${i.email || ''}</small></td>
                <td>${i.interest || '—'}</td>
                <td>${statusBadge(i.status)}</td>
                <td>
                    <button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.viewInq(${i.id},'quotes')"><i class="fas fa-eye"></i> View</button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" style="margin-left:6px" onclick="window.delRow('quotes',${i.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </td>
            </tr>`).join('');
    }

    function renderServices() {
        document.getElementById('services-list').innerHTML = servicesData.length === 0
            ? `<tr><td colspan="4" style="text-align:center;padding:40px;color:#888;">No services yet.</td></tr>`
            : servicesData.map(s => `
            <tr>
                <td><div style="width:40px;height:40px;background:rgba(255,59,48,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="${s.icon}" style="font-size:1.2rem;color:#ff3b30"></i></div></td>
                <td><strong>${s.title || ''}</strong></td>
                <td><span style="color:#aaa">${(s.description || '').substring(0, 60)}${s.description && s.description.length > 60 ? '…' : ''}</span></td>
                <td>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('services',${s.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" style="margin-left:6px" onclick="window.delRow('services',${s.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </td>
            </tr>`).join('');
    }

    function renderSister() {
        document.getElementById('sister-list').innerHTML = sisterCompaniesData.map(s => `
            <tr>
                <td><strong><span style="color:#ff3b30">${s.highlight || ''}</span> ${s.name || ''}</strong></td>
                <td><a href="${s.url}" target="_blank" style="color:#aaa;text-decoration:underline">${s.url || ''}</a></td>
                <td>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('sister_companies',${s.id})"><i class="fas fa-edit"></i></button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" style="margin-left:6px" onclick="window.delRow('sister_companies',${s.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </td>
            </tr>`).join('') || `<tr><td colspan="3" style="text-align:center;color:#888;padding:20px;">None added yet.</td></tr>`;
    }

    function renderFooterLinks() {
        document.getElementById('footer-links-list').innerHTML = footerLinksData.map(f => `
            <tr>
                <td><span class="ep-status" style="background:rgba(255,255,255,0.05);color:#fff;border:1px solid rgba(255,255,255,0.1);">${f.section || ''}</span></td>
                <td><i class="${f.icon}" style="color:var(--ep-primary);margin-right:8px"></i>${f.label || ''}</td>
                <td><span style="color:#aaa">${f.url || ''}</span></td>
                <td>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.editForm('footer_links',${f.id})"><i class="fas fa-edit"></i></button>
                    <button class="ep-btn ep-btn-sec ep-btn-sm" style="margin-left:6px" onclick="window.delRow('footer_links',${f.id})"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </td>
            </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;color:#888;padding:20px;">None added yet.</td></tr>`;
    }

    function renderSettings(val) {
        document.getElementById('set-address').value = val.address || '';
        document.getElementById('set-phone').value = val.phone || '';
        document.getElementById('set-email').value = val.email || '';
        document.getElementById('set-map').value = val.map_iframe || '';
    }

    /* ──────────────────────────────────────────────
       HELPERS & LIGHTBOX VIEW
    ────────────────────────────────────────────── */
    function formatDate(str) {
        if (!str) return '—';
        return new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function statusBadge(s) {
        const replied = s === 'Replied';
        return `<span class="ep-status ${replied ? 'status-replied' : 'status-new'}">
            <i class="fas ${replied ? 'fa-check-circle' : 'fa-clock'}" style="margin-right:5px"></i>${s || 'New'}</span>`;
    }

    window.viewCarGallery = (id) => {
        const car = inventoryData.find(c => c.id === id);
        if (!car) return;
        let images =[];
        if (car.img) images.push(car.img);
        
        let pImgs =[];
        try { pImgs = typeof car.imgs === 'string' ? JSON.parse(car.imgs) : car.imgs; } catch(e){}

        if (pImgs && Array.isArray(pImgs)) {
            pImgs.forEach(img => { if (!images.includes(img)) images.push(img); });
        }
        if (images.length === 0) {
            showAdminToast('No images available for this vehicle.', 'error');
            return;
        }
        window.openLightbox(images, 0);
    };

    window.openLightbox = (images, index = 0) => {
        if (!images || !images.length) return;
        currentLightboxImages = images;
        currentLightboxIndex = index;
        updateLightboxView();
        openAdminModal('ep-lightbox-modal');
    };

    function updateLightboxView() {
        const mainImg = document.getElementById('lb-main-img');
        mainImg.style.opacity = 0;
        setTimeout(() => {
            mainImg.src = currentLightboxImages[currentLightboxIndex];
            mainImg.style.opacity = 1;
        }, 150);

        const gallery = document.getElementById('lb-gallery');
        gallery.innerHTML = currentLightboxImages.map((src, i) => `
            <img src="${src}" onclick="window.setLightboxIndex(${i})" class="lb-thumb"
            style="width:90px; height:65px; object-fit:cover; border-radius:8px; cursor:pointer;
            border: 2px solid ${i === currentLightboxIndex ? 'var(--ep-primary)' : 'transparent'};
            opacity: ${i === currentLightboxIndex ? '1' : '0.4'}; transition:0.3s; flex-shrink:0;">
        `).join('');

        const activeThumb = gallery.children[currentLightboxIndex];
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    window.setLightboxIndex = (i) => {
        currentLightboxIndex = i;
        updateLightboxView();
    };

    /* ──────────────────────────────────────────────
       WINDOW-EXPOSED METHODS
    ────────────────────────────────────────────── */
    window.filterInventory = () => {
        const q = document.getElementById('inv-search').value.toLowerCase();
        renderInventory(inventoryData.filter(i => (i.make || '').toLowerCase().includes(q) || (i.name || '').toLowerCase().includes(q)));
    };

    window.openCarForm = () => {
        editingId = null;
        const form = document.getElementById('car-form');
        form.reset();
        
        document.getElementById('img_hidden').value = '';
        document.getElementById('img_preview').style.display = 'none';
        document.getElementById('imgs_hidden').value = '[]';
        window.renderMultiPreview('imgs_preview', 'imgs_hidden');
        
        document.getElementById('specs-container').innerHTML = '';
        window.addKVRow('specs-container');
        document.getElementById('export-container').innerHTML = '';
        window.addKVRow('export-container');
        
        document.getElementById('car-modal-title').innerText = 'Add New Vehicle';
        openAdminModal('ep-car-modal');
    };

    window.openServiceForm = () => {
        editingId = null;
        document.getElementById('service-form').reset();
        document.getElementById('service-modal-title').innerText = 'Add Service';
        openAdminModal('ep-service-modal');
    };

    window.openSisterForm = () => {
        editingId = null;
        document.getElementById('sister-form').reset();
        document.getElementById('sister-modal-title').innerText = 'Add Sister Company';
        openAdminModal('ep-sister-modal');
    };

    window.openFooterLinkForm = () => {
        editingId = null;
        document.getElementById('footer-link-form').reset();
        document.getElementById('footer-link-modal-title').innerText = 'Add Footer Link';
        openAdminModal('ep-footer-link-modal');
    };

    window.editForm = (table, id) => {
        editingId = id;
        if (table === 'inventory') {
            const item = inventoryData.find(c => c.id === id);
            const form = document.getElementById('car-form');
            document.getElementById('car-modal-title').innerText = 'Edit Vehicle Details';
            
            // Populate generic text fields
            for (let k in item) { 
                if (form.elements[k] && typeof item[k] !== 'object') form.elements[k].value = item[k]; 
            }
            
            // Handle Tags
            let safeTags =[];
            try { safeTags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags; } catch(e){}
            form.elements['tags_raw'].value = (safeTags ||[]).join(', ');
            
            // Handle Images
            document.getElementById('img_hidden').value = item.img || '';
            document.getElementById('img_url').value = (item.img && item.img.length < 1000) ? item.img : '';
            if (item.img) { document.getElementById('img_preview').src = item.img; document.getElementById('img_preview').style.display = 'block'; }
            else document.getElementById('img_preview').style.display = 'none';
            
            let safeImgs =[];
            try { safeImgs = typeof item.imgs === 'string' ? JSON.parse(item.imgs) : item.imgs; } catch(e){}
            document.getElementById('imgs_hidden').value = JSON.stringify(safeImgs ||[]);
            document.getElementById('imgs_url').value = '';
            window.renderMultiPreview('imgs_preview', 'imgs_hidden');
            
            // --- HANDLE SPECS & QUICK STATS ---
            let specsObj = {};
            try { specsObj = typeof item.specs === 'string' ? JSON.parse(item.specs) : (item.specs || {}); } catch(e){}
            
            const customSpecs = { ...specsObj }; // Clone object
            
            // Helper to extract specific key case-insensitively, then remove it from custom list
            const getAndRemove = (key) => {
                const foundKey = Object.keys(customSpecs).find(k => k.toLowerCase() === key.toLowerCase());
                const val = foundKey ? customSpecs[foundKey] : '';
                if (foundKey) delete customSpecs[foundKey];
                return val;
            };

            // Map standard keys to dedicated Quick Stat inputs
            form.elements['spec_mileage'].value = getAndRemove('mileage');
            form.elements['spec_fuel'].value = getAndRemove('fuel') || getAndRemove('fuel type');
            form.elements['spec_trans'].value = getAndRemove('transmission');
            form.elements['spec_year'].value = getAndRemove('year');

            // Render remaining specs as custom rows
            const sc = document.getElementById('specs-container'); sc.innerHTML = '';
            Object.entries(customSpecs).forEach(([k, v]) => window.addKVRow('specs-container', k, v));
            if (!sc.children.length) window.addKVRow('specs-container');
            
            // Handle Export details
            let exportObj = {};
            try { exportObj = typeof item.export === 'string' ? JSON.parse(item.export) : (item.export || {}); } catch(e){}
            const ec = document.getElementById('export-container'); ec.innerHTML = '';
            Object.entries(exportObj).forEach(([k, v]) => window.addKVRow('export-container', k, v));
            if (!ec.children.length) window.addKVRow('export-container');
            
            openAdminModal('ep-car-modal');

        } else if (table === 'services') {
            const item = servicesData.find(c => c.id === id);
            const form = document.getElementById('service-form');
            document.getElementById('service-modal-title').innerText = 'Edit Service';
            for (let k in item) { if (form.elements[k]) form.elements[k].value = item[k]; }
            openAdminModal('ep-service-modal');
        } else if (table === 'sister_companies') {
            const item = sisterCompaniesData.find(c => c.id === id);
            const form = document.getElementById('sister-form');
            document.getElementById('sister-modal-title').innerText = 'Edit Sister Company';
            for (let k in item) { if (form.elements[k]) form.elements[k].value = item[k]; }
            openAdminModal('ep-sister-modal');
        } else if (table === 'footer_links') {
            const item = footerLinksData.find(c => c.id === id);
            const form = document.getElementById('footer-link-form');
            document.getElementById('footer-link-modal-title').innerText = 'Edit Footer Link';
            for (let k in item) { if (form.elements[k]) form.elements[k].value = item[k]; }
            openAdminModal('ep-footer-link-modal');
        }
    };

    window.delRow = (table, id) => {
        showConfirmModal(
            'Confirm Deletion',
            'This record will be permanently deleted and cannot be recovered. Are you sure?',
            async () => {
                const { error } = await sb.from(table).delete().eq('id', id);
                if (error) showAdminToast(error.message, 'error');
                else { showAdminToast('Record deleted.', 'success'); loadData(); }
            }
        );
    };

    window.viewInq = (id, table) => {
        const item = (table === 'inquiries' ? inquiriesData : quotesData).find(i => i.id === id);
        if (!item) return;
        currentInqItem = item;
        currentInqTable = table;

        const d = document.getElementById;
        d('inq-modal-name').textContent = item.name || '—';
        d('inq-modal-email').textContent = item.email || '—';
        d('inq-modal-phone').textContent = item.phone || '—';
        d('inq-modal-dest').textContent = item.destination || '—';
        d('inq-modal-vehicle').textContent = item.car_title || item.interest || '—';
        d('inq-modal-notes').textContent = item.notes || item.message || '—';
        d('inq-modal-date').textContent = formatDate(item.created_at);
        d('inq-modal-status').innerHTML = statusBadge(item.status);
        d('inq-modal-reply').value = item.reply || '';
        
        openAdminModal('ep-inq-modal');
    };

    async function submitInqReply() {
        if (!currentInqItem || !currentInqTable) return;
        const reply = document.getElementById('inq-modal-reply').value.trim();
        const btn = document.getElementById('ep-inq-reply-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
        const { error } = await sb.from(currentInqTable).update({ reply, status: 'Replied' }).eq('id', currentInqItem.id);
        btn.innerHTML = orig; btn.disabled = false;
        if (error) { showAdminToast(error.message, 'error'); return; }
        showAdminToast('Inquiry marked as replied.', 'success');
        closeAdminModal('ep-inq-modal');
        loadData();
    }

    function showConfirmModal(title, message, onConfirm) {
        document.getElementById('ep-confirm-title').textContent = title;
        document.getElementById('ep-confirm-msg').textContent = message;
        pendingDeleteFn = onConfirm;
        openAdminModal('ep-confirm-modal');
    }

    /* ──────────────────────────────────────────────
       MODAL HELPERS
    ────────────────────────────────────────────── */
    function openAdminModal(id) {
        const el = document.getElementById(id);
        el.style.display = 'flex';
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
    }

    function closeAdminModal(id) {
        const el = document.getElementById(id);
        el.classList.remove('open');
        setTimeout(() => { el.style.display = 'none'; }, 500);
    }

    window.openAdminModal = openAdminModal;
    window.closeAdminModal = closeAdminModal;

    window.closeMainPanel = () => {
        const ov = document.getElementById('ep-overlay');
        ov.classList.remove('ep-show');
        setTimeout(() => { ov.style.display = 'none'; }, 450);
    };

    /* ──────────────────────────────────────────────
       FORM ENGINE
    ────────────────────────────────────────────── */
    async function handleFormSubmit(e, table, extractDataFn) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...'; btn.disabled = true;
        try {
            const obj = extractDataFn(new FormData(e.target));
            let err;
            if (editingId) { const res = await sb.from(table).update(obj).eq('id', editingId); err = res.error; }
            else { const res = await sb.from(table).insert([obj]); err = res.error; }
            if (err) throw err;
            showAdminToast(`${table.replace(/_/g, ' ')} saved successfully!`, 'success');
            closeAdminModal(e.target.closest('.ep-modal-wrapper').id);
            loadData();
        } catch (error) {
            showAdminToast(error.message, 'error');
        } finally {
            btn.innerHTML = origText; btn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────
       KEY-VALUE BUILDER
    ────────────────────────────────────────────── */
    window.addKVRow = (containerId, key = '', val = '') => {
        const div = document.createElement('div');
        div.className = 'kv-row';
        div.innerHTML = `
            <input type="text" class="ep-input kv-k" placeholder="Key (e.g. Engine)" value="${key}" style="flex:1">
            <input type="text" class="ep-input kv-v" placeholder="Value (e.g. 4.0L V8)" value="${val}" style="flex:2">
            <button type="button" class="ep-btn ep-btn-sec" style="padding:12px 16px;" onclick="this.parentElement.remove()" title="Remove Row">
                <i class="fas fa-times" style="color:#ff4444"></i>
            </button>`;
        document.getElementById(containerId).appendChild(div);
    };

    const extractKV = (containerId) => {
        const obj = {};
        document.getElementById(containerId).querySelectorAll('.kv-row').forEach(row => {
            const k = row.querySelector('.kv-k').value.trim();
            const v = row.querySelector('.kv-v').value.trim();
            if (k) obj[k] = v;
        });
        return obj;
    };

    /* ──────────────────────────────────────────────
       IMAGE HANDLING
    ────────────────────────────────────────────── */
    function compressImage(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1400;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL('image/jpeg', 0.82));
            };
        };
    }

    window.renderMultiPreview = (prId, hiId) => {
        const pr = document.getElementById(prId);
        const hi = document.getElementById(hiId);
        let urls =[]; try { urls = JSON.parse(hi.value); } catch { urls =[]; }
        pr.innerHTML = '';
        urls.forEach((u, i) => {
            const wrap = document.createElement('div'); wrap.className = 'img-thumb-wrap';
            const img = document.createElement('img'); img.src = u;
            img.onclick = () => window.openLightbox(urls, i);
            img.style.cursor = 'pointer';
            const btn = document.createElement('button'); btn.className = 'img-remove-btn';
            btn.innerHTML = '<i class="fas fa-times"></i>'; btn.type = 'button';
            btn.onclick = (e) => { e.stopPropagation(); urls.splice(i, 1); hi.value = JSON.stringify(urls); window.renderMultiPreview(prId, hiId); };
            wrap.appendChild(img); wrap.appendChild(btn); pr.appendChild(wrap);
        });
    };

    function setupImageUpload(fileId, urlId, hidId, prevId, multiple) {
        const fi = document.getElementById(fileId);
        const ui = document.getElementById(urlId);
        const hi = document.getElementById(hidId);
        const pr = document.getElementById(prevId);
        const dropArea = fi ? fi.closest('.file-drop-area') : null;

        if (dropArea) {
            dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
            dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
            dropArea.addEventListener('drop', e => {
                e.preventDefault(); dropArea.classList.remove('drag-over');
                if (e.dataTransfer.files.length) { fi.files = e.dataTransfer.files; fi.dispatchEvent(new Event('change')); }
            });
        }

        if (!multiple) {
            ui.addEventListener('input', e => { hi.value = e.target.value; pr.src = e.target.value; pr.style.display = e.target.value ? 'block' : 'none'; });
            fi.addEventListener('change', e => {
                if (!e.target.files.length) return;
                ui.value = '';
                compressImage(e.target.files[0], b64 => { hi.value = b64; pr.src = b64; pr.style.display = 'block'; });
            });
        } else {
            ui.addEventListener('keydown', e => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const newUrls = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                if (newUrls.length) {
                    let curr =[]; try { curr = JSON.parse(hi.value); } catch { }
                    hi.value = JSON.stringify(curr.concat(newUrls));
                    e.target.value = '';
                    window.renderMultiPreview(prevId, hidId);
                }
            });
            fi.addEventListener('change', e => {
                if (!e.target.files.length) return;
                ui.value = '';
                let curr =[]; try { curr = JSON.parse(hi.value); } catch { }
                let loaded = 0;
                Array.from(e.target.files).forEach(file => {
                    compressImage(file, b64 => {
                        curr.push(b64); loaded++;
                        if (loaded === e.target.files.length) {
                            hi.value = JSON.stringify(curr);
                            window.renderMultiPreview(prevId, hidId);
                            fi.value = '';
                        }
                    });
                });
            });
        }
    }

    /* ──────────────────────────────────────────────
       TOAST NOTIFICATIONS
    ────────────────────────────────────────────── */
    function showAdminToast(msg, type = 'success') {
        const container = document.getElementById('ep-toast-container');
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        const toast = document.createElement('div');
        toast.className = `ep-toast ${type === 'error' ? 'ep-toast-error' : ''}`;
        toast.innerHTML = `<i class="fas ${icon}" style="color:${type === 'success' ? '#4dbb6a' : '#ff3b30'}"></i><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3800);
    }

    /* ──────────────────────────────────────────────
       STYLES
    ────────────────────────────────────────────── */
    function injectStyles() {
        const css = `
        :root {
            --ep-primary: #ff3b30;
            --ep-primary-grad: linear-gradient(135deg, #ff3b30, #d63026);
            --ep-bg: #0a0a0c;
            --ep-card: #151518;
            --ep-border: rgba(255,255,255,0.08);
            --ep-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
            --ep-smooth: cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* ── OVERLAY ── */
        #ep-overlay {
            position: fixed; inset: 0; background: rgba(5,5,8,0.95);
            backdrop-filter: blur(20px); z-index: 10000;
            display: none; font-family: 'Montserrat', sans-serif;
            color: #fff; opacity: 0; transition: opacity 0.4s var(--ep-smooth);
        }
        #ep-overlay.ep-show { opacity: 1; }

        .ep-container {
            max-width: 1440px; height: 95vh; margin: 2.5vh auto;
            background: var(--ep-bg); border: 1px solid var(--ep-border);
            border-radius: 20px; overflow: hidden; display: flex;
            flex-direction: column;
            box-shadow: 0 40px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.05);
            transform: translateY(30px) scale(0.98);
            transition: transform 0.45s var(--ep-ease);
        }
        #ep-overlay.ep-show .ep-container { transform: translateY(0) scale(1); }

        /* ── HEADER ── */
        .ep-header {
            padding: 22px 35px; background: #0c0c10;
            border-bottom: 1px solid var(--ep-border);
            display: flex; justify-content: space-between; align-items: center;
            flex-shrink: 0;
        }
        .ep-header-brand { display: flex; align-items: center; gap: 14px; }
        .ep-header-brand .logo-text { font-size: 1.4rem; font-weight: 900; letter-spacing: 4px; }
        .ep-header-brand .logo-text span { color: var(--ep-primary); }
        .ep-header-brand .logo-badge {
            background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.25);
            color: var(--ep-primary); font-size: 0.65rem; font-weight: 800;
            letter-spacing: 2px; padding: 5px 12px; border-radius: 20px; text-transform: uppercase;
        }

        /* ── NAV ── */
        .ep-nav {
            display: flex; background: var(--ep-card);
            border-bottom: 1px solid var(--ep-border);
            overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
        }
        .ep-nav::-webkit-scrollbar { display: none; }
        .ep-nav-btn {
            flex: 1; padding: 18px 14px; border: none; background: none;
            color: #666; cursor: pointer; font-weight: 700;
            text-transform: uppercase; font-size: 0.72rem; letter-spacing: 1.5px;
            transition: all 0.3s; white-space: nowrap; position: relative;
            font-family: inherit;
        }
        .ep-nav-btn::after {
            content: ''; position: absolute; bottom: 0; left: 0;
            width: 100%; height: 3px; background: var(--ep-primary);
            transform: scaleX(0); transition: transform 0.3s var(--ep-ease);
            transform-origin: center;
        }
        .ep-nav-btn.active { color: #fff; background: rgba(255,59,48,0.06); }
        .ep-nav-btn.active::after, .ep-nav-btn:hover::after { transform: scaleX(1); }
        .ep-nav-btn:hover { color: #ccc; }
        .ep-nav-btn.danger-btn { color: #ff5555; flex: 0.6; }
        .ep-nav-btn.danger-btn:hover { color: #ff3b30; background: rgba(255,59,48,0.05); }

        /* ── CONTENT ── */
        .ep-content { flex: 1; overflow-y: auto; scroll-behavior: smooth; }
        .ep-content::-webkit-scrollbar { width: 6px; }
        .ep-content::-webkit-scrollbar-track { background: var(--ep-bg); }
        .ep-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .ep-content::-webkit-scrollbar-thumb:hover { background: var(--ep-primary); }

        .ep-tab-content { display: none; padding: 35px 40px; animation: fadeTabIn 0.3s ease; }
        .ep-tab-content.active { display: block; }
        @keyframes fadeTabIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* ── DASHBOARD ── */
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 35px; }
        .dash-card {
            background: var(--ep-card); border: 1px solid var(--ep-border);
            border-radius: 14px; padding: 28px 25px; position: relative;
            overflow: hidden; transition: 0.3s var(--ep-ease); cursor: default;
        }
        .dash-card:hover { border-color: rgba(255,59,48,0.3); transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.4); }
        .dash-card-icon { font-size: 1.8rem; color: var(--ep-primary); margin-bottom: 15px; }
        .dash-card-value { font-size: 2.8rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px; color: #fff; }
        .dash-card-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: #666; font-weight: 700; }
        .dash-card-sub { font-size: 0.8rem; color: var(--ep-primary); font-weight: 700; margin-top: 8px; }

        .dash-section-title { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--ep-border); }
        .dash-item { display: flex; align-items: center; gap: 15px; padding: 14px 18px; background: var(--ep-card); border: 1px solid var(--ep-border); border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: 0.3s; }
        .dash-item:hover { border-color: rgba(255,59,48,0.3); background: rgba(255,59,48,0.04); }
        .dash-item-avatar { width: 38px; height: 38px; background: var(--ep-primary-grad); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem; flex-shrink: 0; }
        .dash-item-info { flex: 1; min-width: 0; }
        .dash-item-info strong { display: block; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dash-item-info span { display: block; font-size: 0.78rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── INPUTS ── */
        .ep-input, .ep-textarea, .ep-select {
            width: 100%; padding: 14px 18px;
            background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
            color: #fff; border-radius: 10px; font-family: inherit;
            font-size: 0.9rem; transition: 0.35s var(--ep-smooth); outline: none;
        }
        .ep-textarea { resize: vertical; min-height: 120px; }
        .ep-input:focus, .ep-textarea:focus, .ep-select:focus {
            border-color: var(--ep-primary);
            box-shadow: 0 0 0 4px rgba(255,59,48,0.12);
            background: rgba(0,0,0,0.7);
        }
        .ep-select option { background: #1a1a1e; }
        .ep-label {
            display: block; font-size: 0.72rem; color: var(--ep-primary);
            text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 9px; font-weight: 800;
        }

        /* ── GRID/SECTION ── */
        .ep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        @media(max-width: 900px) { .split-grid { grid-template-columns: 1fr; } }
        .ep-section { background: rgba(255,255,255,0.018); border: 1px solid var(--ep-border); border-radius: 14px; padding: 28px; margin-bottom: 25px; transition: 0.3s; }
        .ep-section:hover { background: rgba(255,255,255,0.028); border-color: rgba(255,255,255,0.12); }
        .ep-sec-title { font-size: 0.88rem; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 14px; display: flex; align-items: center; gap: 10px; }
        .ep-sec-title i { color: var(--ep-primary); font-size: 1.1rem; }
        .kv-row { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }

        /* ── BUTTONS ── */
        .ep-btn { padding: 13px 26px; border-radius: 9px; border: none; font-weight: 700; cursor: pointer; transition: 0.35s var(--ep-ease); text-transform: uppercase; font-size: 0.78rem; letter-spacing: 1.5px; display: inline-flex; align-items: center; gap: 9px; justify-content: center; font-family: inherit; position: relative; overflow: hidden; }
        .ep-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
        .ep-btn-p { background: var(--ep-primary-grad); color: #fff; box-shadow: 0 4px 15px rgba(255,59,48,0.25); }
        .ep-btn-p:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(255,59,48,0.45); transform: translateY(-2px); }
        .ep-btn-sec { background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid rgba(255,255,255,0.1); }
        .ep-btn-sec:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #fff; transform: translateY(-1px); }
        .ep-btn-danger { background: rgba(255,59,48,0.12); color: #ff4444; border: 1px solid rgba(255,59,48,0.25); }
        .ep-btn-danger:hover:not(:disabled) { background: rgba(255,59,48,0.2); box-shadow: 0 4px 15px rgba(255,59,48,0.2); transform: translateY(-2px); }
        .ep-btn-sm { padding: 9px 16px; font-size: 0.7rem; border-radius: 7px; }

        /* ── TABLE ── */
        .ep-table { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--ep-card); border-radius: 12px; overflow: hidden; border: 1px solid var(--ep-border); }
        .ep-table th { text-align: left; padding: 18px 20px; background: rgba(0,0,0,0.35); color: var(--ep-primary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid var(--ep-border); }
        .ep-table td { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.88rem; vertical-align: middle; transition: background 0.25s; }
        .ep-table tr:last-child td { border-bottom: none; }
        .ep-table tr:hover td { background: rgba(255,255,255,0.025); }

        /* ── STATUS ── */
        .ep-status { display: inline-flex; align-items: center; padding: 5px 13px; border-radius: 6px; font-size: 0.68rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
        .status-replied { background: rgba(37,211,102,0.1); color: #25d366; border: 1px solid rgba(37,211,102,0.2); }
        .status-new { background: rgba(255,193,7,0.1); color: #ffc107; border: 1px solid rgba(255,193,7,0.2); }

        /* ── TABLE TOOLBAR ── */
        .tab-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 14px; }
        .tab-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .tab-search-wrap { position: relative; }
        .tab-search-wrap i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; }
        .tab-search-wrap input { padding-left: 42px; max-width: 340px; }

        /* ── ADMIN MODALS ── */
        .ep-modal-wrapper {
            position: fixed; inset: 0; background: rgba(0,0,0,0.85);
            z-index: 11000; padding: 30px; overflow-y: auto;
            backdrop-filter: blur(18px); opacity: 0; visibility: hidden;
            transition: opacity 0.45s var(--ep-smooth), visibility 0.45s;
            align-items: center; justify-content: center;
            display: none;
        }
        .ep-modal-wrapper.open { opacity: 1; visibility: visible; display: flex; }
        .modal-inner {
            width: 100%; max-width: 1100px;
            background: #12121a; border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.09);
            box-shadow: 0 50px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05);
            position: relative; transform: scale(0.9) translateY(40px);
            transition: transform 0.5s var(--ep-ease), opacity 0.5s;
            opacity: 0; overflow: hidden; display: flex; flex-direction: column;
            max-height: 90vh;
        }
        .ep-modal-wrapper.open .modal-inner { transform: scale(1) translateY(0); opacity: 1; }

        .modal-header { padding: 32px 38px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; background: rgba(0,0,0,0.2); }
        .modal-header h2 { margin: 0; font-weight: 900; font-size: 1.6rem; letter-spacing: 0.5px; }
        .modal-header p { margin: 6px 0 0; color: #666; font-size: 0.85rem; }
        .modal-body-scroll { padding: 35px 38px; overflow-y: auto; flex: 1; }
        .modal-body-scroll::-webkit-scrollbar { width: 5px; }
        .modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-body-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .modal-footer { padding: 22px 38px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 12px; background: rgba(0,0,0,0.3); flex-shrink: 0; }

        .close-modal-btn {
            position: absolute; top: 18px; right: 18px; z-index: 100;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
            color: #aaa; width: 42px; height: 42px; border-radius: 50%;
            cursor: pointer; transition: 0.4s var(--ep-ease);
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(10px); font-size: 1rem; font-family: inherit;
        }
        .close-modal-btn:hover { background: var(--ep-primary); border-color: var(--ep-primary); color: #fff; transform: rotate(90deg) scale(1.1); }

        /* ── LIGHTBOX ── */
        .lb-thumb:hover { opacity: 1 !important; transform: scale(1.05); }
        .lightbox-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        #lb-gallery::-webkit-scrollbar { height: 6px; }
        #lb-gallery::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        #lb-gallery::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 3px; }
        .lb-nav-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2);
            width: 45px; height: 45px; border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: 0.3s; z-index: 10; font-size: 1.2rem; backdrop-filter: blur(5px);
        }
        .lb-nav-btn:hover { background: var(--ep-primary); border-color: var(--ep-primary); transform: translateY(-50%) scale(1.1); }
        #lb-prev { left: 15px; }
        #lb-next { right: 15px; }

        /* ── CRM INQUIRY CARD VIEW ── */
        .crm-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .crm-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; }
        .crm-row { margin-bottom: 18px; }
        .crm-row:last-child { margin-bottom: 0; }
        .crm-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: #777; margin-bottom: 5px; font-weight: 700; }
        .crm-val { display: block; font-size: 1rem; color: #fff; font-weight: 500; }

        /* ── ADMIN TRIGGER ── */
        #ep-admin-trigger {
            position: fixed; bottom: 30px; left: 30px; width: 60px; height: 60px;
            border-radius: 50%; background: var(--ep-primary-grad); color: white;
            border: none; cursor: pointer; z-index: 9999;
            box-shadow: 0 10px 30px rgba(255,59,48,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; transition: 0.4s var(--ep-ease); font-family: inherit;
        }
        #ep-admin-trigger:hover { transform: scale(1.15) rotate(10deg); box-shadow: 0 15px 40px rgba(255,59,48,0.7); }

        /* ── IMAGE UPLOAD ── */
        .file-drop-area {
            border: 2px dashed rgba(255,255,255,0.12); border-radius: 12px;
            padding: 35px 20px; text-align: center;
            background: rgba(0,0,0,0.25); transition: 0.4s var(--ep-ease);
            cursor: pointer; position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 120px;
        }
        .file-drop-area:hover, .file-drop-area.drag-over { border-color: var(--ep-primary); background: rgba(255,59,48,0.05); transform: translateY(-2px); }
        .file-drop-area input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .img-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 10px; margin-top: 18px; }
        .img-thumb-wrap { position: relative; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); height: 88px; transition: 0.3s; }
        .img-thumb-wrap:hover { border-color: var(--ep-primary); transform: scale(1.04); }
        .img-thumb-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .img-remove-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.15); width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .img-remove-btn:hover { background: var(--ep-primary); border-color: var(--ep-primary); transform: scale(1.15) rotate(90deg); }

        /* ── TOAST ── */
        #ep-toast-container { position: fixed; bottom: 28px; right: 28px; z-index: 12000; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
        .ep-toast {
            background: rgba(14, 22, 14, 0.97); backdrop-filter: blur(15px);
            border: 1px solid rgba(77,187,106,0.25); border-left: 5px solid #4dbb6a;
            border-radius: 12px; padding: 18px 22px; display: flex; align-items: center;
            gap: 14px; font-size: 0.92rem; font-weight: 600; color: #fff;
            transform: translateX(120%) scale(0.92); opacity: 0;
            transition: all 0.45s var(--ep-ease);
            box-shadow: 0 15px 40px rgba(0,0,0,0.6); pointer-events: auto;
            max-width: 360px; min-width: 260px;
        }
        .ep-toast.show { transform: translateX(0) scale(1); opacity: 1; }
        .ep-toast-error { background: rgba(22,14,14,0.97); border-color: rgba(255,59,48,0.25); border-left-color: #ff3b30; }
        .ep-toast i { font-size: 1.3rem; flex-shrink: 0; }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    /* ──────────────────────────────────────────────
       HTML INJECTION
    ────────────────────────────────────────────── */
    function injectHTML() {
        document.body.insertAdjacentHTML('beforeend', `
        <!-- ═══════════════════ ADMIN OVERLAY ═══════════════════ -->
        <div id="ep-overlay">
            <div class="ep-container">
                <!-- Header -->
                <div class="ep-header">
                    <div class="ep-header-brand">
                        <div class="logo-text">ELITE <span>ADMIN</span></div>
                        <div class="logo-badge">Pro Suite V6</div>
                    </div>
                    <button class="ep-btn ep-btn-sec" onclick="window.closeMainPanel()"><i class="fas fa-times"></i> Close</button>
                </div>

                <!-- Login Form -->
                <div id="ep-login-form">
                    <div class="ep-login-icon"><i class="fas fa-user-lock"></i></div>
                    <div class="ep-login-title">Secure Access</div>
                    <div class="ep-login-sub">Elite Route Admin Portal — Authorized Personnel Only</div>
                    <div class="ep-login-fields">
                        <div><label class="ep-label">Admin Email</label><input type="email" id="ep-email" class="ep-input" placeholder="admin@eliteroute.com"></div>
                        <div><label class="ep-label">Password</label><input type="password" id="ep-pass" class="ep-input" placeholder="••••••••"></div>
                    </div>
                    <button id="ep-login-btn" class="ep-btn ep-btn-p" style="width:100%; padding:16px; font-size:0.9rem;">
                        <i class="fas fa-lock"></i> Authenticate Session
                    </button>
                </div>

                <!-- Main Panel -->
                <div id="ep-main-panel" style="display:none; flex-direction:column; flex:1; overflow:hidden; min-height:0;">
                    <div class="ep-nav">
                        <button class="ep-nav-btn active" data-tab="tab-dashboard"><i class="fas fa-chart-bar"></i> Dashboard</button>
                        <button class="ep-nav-btn" data-tab="tab-inventory"><i class="fas fa-car"></i> Inventory</button>
                        <button class="ep-nav-btn" data-tab="tab-leads" id="nav-leads-btn"><i class="fas fa-envelope-open-text"></i> Inquiries</button>
                        <button class="ep-nav-btn" data-tab="tab-quotes"><i class="fas fa-file-invoice-dollar"></i> Quotes</button>
                        <button class="ep-nav-btn" data-tab="tab-services"><i class="fas fa-briefcase"></i> Services</button>
                        <button class="ep-nav-btn" data-tab="tab-footer"><i class="fas fa-sitemap"></i> Site Data</button>
                        <button class="ep-nav-btn" data-tab="tab-settings"><i class="fas fa-cog"></i> Settings</button>
                        <button class="ep-nav-btn danger-btn" id="ep-logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
                    </div>

                    <div class="ep-content">
                        <!-- Dashboard, Inventory, etc. tabs omitted for brevity inside innerHTML, perfectly matches JS logic -->
                        <div id="tab-dashboard" class="ep-tab-content active">
                            <div class="dash-grid">
                                <div class="dash-card"><div class="dash-card-icon"><i class="fas fa-car-side"></i></div><div class="dash-card-value" id="dash-inventory">—</div><div class="dash-card-label">Vehicles Listed</div></div>
                                <div class="dash-card" style="cursor:pointer;" onclick="document.querySelector('[data-tab=tab-leads]').click()"><div class="dash-card-icon"><i class="fas fa-envelope-open-text"></i></div><div class="dash-card-value" id="dash-inquiries">—</div><div class="dash-card-label">Total Inquiries</div><div class="dash-card-sub" id="dash-inquiries-new">Loading…</div></div>
                                <div class="dash-card" style="cursor:pointer;" onclick="document.querySelector('[data-tab=tab-quotes]').click()"><div class="dash-card-icon"><i class="fas fa-file-invoice-dollar"></i></div><div class="dash-card-value" id="dash-quotes">—</div><div class="dash-card-label">Quote Requests</div><div class="dash-card-sub" id="dash-quotes-new">Loading…</div></div>
                                <div class="dash-card"><div class="dash-card-icon"><i class="fas fa-briefcase"></i></div><div class="dash-card-value" id="dash-services">—</div><div class="dash-card-label">Active Services</div></div>
                            </div>
                            <div class="dash-section-title"><i class="fas fa-clock" style="margin-right:8px;color:var(--ep-primary)"></i>Recent Activity</div>
                            <div id="dash-recent-list"></div>
                        </div>

                        <!-- Inventory Table -->
                        <div id="tab-inventory" class="ep-tab-content">
                            <div class="tab-toolbar">
                                <div class="tab-toolbar-left"><div class="tab-search-wrap"><i class="fas fa-search"></i><input type="text" id="inv-search" class="ep-input" placeholder="Search make or model…" onkeyup="window.filterInventory()" style="width:300px"></div></div>
                                <button class="ep-btn ep-btn-p" onclick="window.openCarForm()"><i class="fas fa-plus"></i> Add Vehicle</button>
                            </div>
                            <table class="ep-table"><thead><tr><th>Image</th><th>Make & Model</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead><tbody id="inv-list"></tbody></table>
                        </div>

                        <!-- Inquiries Table -->
                        <div id="tab-leads" class="ep-tab-content">
                            <table class="ep-table"><thead><tr><th>Date</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr></thead><tbody id="leads-list"></tbody></table>
                        </div>

                        <!-- Quotes Table -->
                        <div id="tab-quotes" class="ep-tab-content">
                            <table class="ep-table"><thead><tr><th>Date</th><th>Customer</th><th>Interest</th><th>Status</th><th>Actions</th></tr></thead><tbody id="quotes-list"></tbody></table>
                        </div>

                        <!-- Services Table -->
                        <div id="tab-services" class="ep-tab-content">
                            <div class="tab-toolbar"><div></div><button class="ep-btn ep-btn-p" onclick="window.openServiceForm()"><i class="fas fa-plus"></i> Add Service</button></div>
                            <table class="ep-table"><thead><tr><th>Icon</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead><tbody id="services-list"></tbody></table>
                        </div>

                        <!-- Footer Links & Sisters -->
                        <div id="tab-footer" class="ep-tab-content">
                            <div class="split-grid">
                                <div class="ep-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;"><div class="ep-sec-title" style="margin:0;border:none;padding:0;"><i class="fas fa-building"></i> Sister Companies</div><button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.openSisterForm()"><i class="fas fa-plus"></i> Add</button></div><table class="ep-table"><thead><tr><th>Name</th><th>URL</th><th>Actions</th></tr></thead><tbody id="sister-list"></tbody></table></div>
                                <div class="ep-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;"><div class="ep-sec-title" style="margin:0;border:none;padding:0;"><i class="fas fa-link"></i> Footer Links</div><button class="ep-btn ep-btn-p ep-btn-sm" onclick="window.openFooterLinkForm()"><i class="fas fa-plus"></i> Add</button></div><table class="ep-table"><thead><tr><th>Section</th><th>Label</th><th>URL</th><th>Actions</th></tr></thead><tbody id="footer-links-list"></tbody></table></div>
                            </div>
                        </div>

                        <!-- Settings Form -->
                        <div id="tab-settings" class="ep-tab-content">
                            <div class="ep-section" style="max-width:640px;">
                                <div class="ep-sec-title"><i class="fas fa-map-marker-alt"></i> Contact & Location</div>
                                <form id="settings-form" style="display:flex;flex-direction:column;gap:18px;">
                                    <div><label class="ep-label">Physical Address</label><input id="set-address" class="ep-input"></div>
                                    <div><label class="ep-label">Phone / WhatsApp</label><input id="set-phone" class="ep-input"></div>
                                    <div><label class="ep-label">Support Email</label><input id="set-email" class="ep-input"></div>
                                    <div><label class="ep-label">Google Maps Embed URL</label><textarea id="set-map" class="ep-textarea"></textarea></div>
                                    <button type="submit" class="ep-btn ep-btn-p" style="padding:16px;margin-top:6px;"><i class="fas fa-save"></i> Save Settings</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ IMAGE LIGHTBOX MODAL ═══════ -->
        <div id="ep-lightbox-modal" class="ep-modal-wrapper" style="display:none; z-index:12000;">
            <div class="lightbox-inner" style="width:100%; max-width:1100px; position:relative;">
                <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-lightbox-modal')" style="position:absolute;top:-50px;right:0;background:rgba(0,0,0,0.6);"><i class="fas fa-times"></i></button>
                <div style="width:100%; height:70vh; background:#050507; border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:0 30px 80px rgba(0,0,0,0.9);">
                    <button id="lb-prev" class="lb-nav-btn"><i class="fas fa-chevron-left"></i></button>
                    <img id="lb-main-img" src="" style="max-width:100%; max-height:100%; object-fit:contain; transition:opacity 0.3s;">
                    <button id="lb-next" class="lb-nav-btn"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div id="lb-gallery" style="display:flex; gap:12px; margin-top:20px; overflow-x:auto; padding-bottom:15px; width:100%; justify-content:center;"></div>
            </div>
        </div>

        <!-- ═══════ ENHANCED CAR FORM MODAL ═══════ -->
        <div id="ep-car-modal" class="ep-modal-wrapper" style="display:none;">
            <div class="modal-inner">
                <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-car-modal')"><i class="fas fa-times"></i></button>
                <form id="car-form" style="display:contents;">
                    <div class="modal-header">
                        <h2 id="car-modal-title">Vehicle Editor</h2>
                        <p>All data entered here automatically syncs with the front-view show modal.</p>
                    </div>
                    <div class="modal-body-scroll">
                        <div class="split-grid">
                            <div class="ep-section">
                                <div class="ep-sec-title"><i class="fas fa-info-circle"></i> General Information</div>
                                <div style="display:flex;flex-direction:column;gap:16px;">
                                    <div><label class="ep-label">Make</label><input name="make" class="ep-input" required placeholder="e.g. Mercedes-Benz"></div>
                                    <div><label class="ep-label">Model Name</label><input name="name" class="ep-input" required placeholder="e.g. G63 AMG"></div>
                                    <div><label class="ep-label">Category</label>
                                        <select name="cat" class="ep-select">
                                            <option value="luxury">Luxury</option><option value="suv">SUV</option><option value="exotic">Exotic</option><option value="fleet">Fleet</option>
                                        </select>
                                    </div>
                                    <div><label class="ep-label">Tags (comma-separated)</label><input name="tags_raw" class="ep-input" placeholder="V8 Biturbo, LHD, Brand New…"></div>
                                </div>
                            </div>
                            <div class="ep-section">
                                <div class="ep-sec-title"><i class="fas fa-tags"></i> Pricing & Badge</div>
                                <div style="display:flex;flex-direction:column;gap:16px;">
                                    <div><label class="ep-label">Price</label><input name="price" class="ep-input" placeholder="e.g. $185,000"></div>
                                    <div><label class="ep-label">Old Price (strikethrough)</label><input name="old_price" class="ep-input" placeholder="Optional"></div>
                                    <div><label class="ep-label">Badge Text</label><input name="badge" class="ep-input" placeholder="e.g. NEW ARRIVAL"></div>
                                    <div><label class="ep-label">Badge Style</label>
                                        <select name="bc" class="ep-select">
                                            <option value="">Default (Red)</option><option value="hot">Solid Dark Red</option><option value="luxury">Luxury Gold</option><option value="fleet">Fleet Blue</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- QUICK STATS: PERFECT FRONT-END SYNC -->
                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-tachometer-alt"></i> Quick Specs (Maps directly to Top Icons on Front View)</div>
                            <div class="ep-grid">
                                <div><label class="ep-label">Mileage</label><input name="spec_mileage" class="ep-input" placeholder="e.g. 15,000 km"></div>
                                <div><label class="ep-label">Fuel Type</label><input name="spec_fuel" class="ep-input" placeholder="e.g. Petrol"></div>
                                <div><label class="ep-label">Transmission</label><input name="spec_trans" class="ep-input" placeholder="e.g. Automatic"></div>
                                <div><label class="ep-label">Model Year</label><input name="spec_year" class="ep-input" placeholder="e.g. 2024"></div>
                            </div>
                        </div>

                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-images"></i> Media Gallery</div>
                            <div class="split-grid">
                                <div>
                                    <label class="ep-label">Primary Image</label>
                                    <div class="file-drop-area"><i class="fas fa-image" style="font-size:28px;color:#ff3b30;margin-bottom:10px;"></i><div style="font-size:0.82rem;font-weight:700;color:#fff;margin-bottom:4px;">Select or Drop Photo</div><div style="font-size:0.72rem;color:#666;">Auto-compressed to max 1400px</div><input type="file" id="img_file" accept="image/*"></div>
                                    <input type="text" id="img_url" class="ep-input" style="margin-top:12px;" placeholder="Or paste image URL…">
                                    <input type="hidden" name="img" id="img_hidden">
                                    <img id="img_preview" style="width:100%;height:150px;object-fit:cover;display:none;margin-top:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;" title="View Full Screen">
                                </div>
                                <div>
                                    <label class="ep-label">Gallery Images (multiple)</label>
                                    <div class="file-drop-area"><i class="fas fa-cloud-upload-alt" style="font-size:28px;color:#ff3b30;margin-bottom:10px;"></i><div style="font-size:0.82rem;font-weight:700;color:#fff;margin-bottom:4px;">Drop Multiple Photos</div><div style="font-size:0.72rem;color:#666;">All images auto-compressed</div><input type="file" id="imgs_files" accept="image/*" multiple></div>
                                    <input type="text" id="imgs_url" class="ep-input" style="margin-top:12px;" placeholder="Paste URL and press Enter…">
                                    <input type="hidden" name="imgs_raw" id="imgs_hidden" value="[]">
                                    <div class="img-preview-grid" id="imgs_preview"></div>
                                </div>
                            </div>
                        </div>

                        <!-- FULL SPECS BUILDER -->
                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-list-ul"></i> Full Specifications (Custom Key-Value)</div>
                            <p style="color:#777;font-size:0.8rem;margin:-10px 0 18px;">Add any additional specs not covered by Quick Specs above (e.g. Engine, Power, Colour, Doors…)</p>
                            <div id="specs-container"></div>
                            <button type="button" class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.addKVRow('specs-container')" style="margin-top:6px;">
                                <i class="fas fa-plus"></i> Add Spec Row
                            </button>
                        </div>

                        <!-- EXPORT / SHIPPING DETAILS -->
                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-ship"></i> Export & Shipping Details</div>
                            <p style="color:#777;font-size:0.8rem;margin:-10px 0 18px;">Key-value pairs shown in the Export Info tab on the front-end (e.g. Port of Loading, Incoterms, Lead Time…)</p>
                            <div id="export-container"></div>
                            <button type="button" class="ep-btn ep-btn-sec ep-btn-sm" onclick="window.addKVRow('export-container')" style="margin-top:6px;">
                                <i class="fas fa-plus"></i> Add Export Row
                            </button>
                        </div>

                        <!-- DESCRIPTION -->
                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-align-left"></i> Vehicle Description</div>
                            <textarea name="description" class="ep-textarea" style="min-height:140px;" placeholder="Detailed vehicle description shown on listing page…"></textarea>
                        </div>

                        <!-- STATUS FLAGS -->
                        <div class="ep-section">
                            <div class="ep-sec-title"><i class="fas fa-flag"></i> Listing Status</div>
                            <div class="ep-grid">
                                <div>
                                    <label class="ep-label">Availability</label>
                                    <select name="availability" class="ep-select">
                                        <option value="In Stock">In Stock</option>
                                        <option value="Reserved">Reserved</option>
                                        <option value="Sold">Sold</option>
                                        <option value="Coming Soon">Coming Soon</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="ep-label">Steering</label>
                                    <select name="steering" class="ep-select">
                                        <option value="LHD">LHD — Left Hand Drive</option>
                                        <option value="RHD">RHD — Right Hand Drive</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="ep-label">Condition</label>
                                    <select name="condition" class="ep-select">
                                        <option value="Brand New">Brand New</option>
                                        <option value="Pre-Owned">Pre-Owned</option>
                                        <option value="Certified Pre-Owned">Certified Pre-Owned</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="ep-label">Featured / Pinned</label>
                                    <select name="featured" class="ep-select">
                                        <option value="0">No — Standard Listing</option>
                                        <option value="1">Yes — Pin to Top</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-car-modal')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="ep-btn ep-btn-p" style="min-width:160px;">
                            <i class="fas fa-save"></i> Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════ SERVICE FORM MODAL ═══════ -->
        <div id="ep-service-modal" class="ep-modal-wrapper" style="display:none;">
            <div class="modal-inner" style="max-width:640px;">
                <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-service-modal')"><i class="fas fa-times"></i></button>
                <form id="service-form" style="display:contents;">
                    <div class="modal-header">
                        <h2 id="service-modal-title">Service Editor</h2>
                        <p>Manage the services displayed on the Services section of the site.</p>
                    </div>
                    <div class="modal-body-scroll">
                        <div style="display:flex;flex-direction:column;gap:18px;">
                            <div>
                                <label class="ep-label">Service Title</label>
                                <input name="title" class="ep-input" required placeholder="e.g. Export Assistance">
                            </div>
                            <div>
                                <label class="ep-label">FontAwesome Icon Class</label>
                                <input name="icon" class="ep-input" placeholder="e.g. fas fa-shipping-fast">
                                <p style="color:#666;font-size:0.75rem;margin-top:7px;">
                                    Browse icons at <a href="https://fontawesome.com/icons" target="_blank" style="color:var(--ep-primary);">fontawesome.com/icons</a>
                                </p>
                            </div>
                            <div>
                                <label class="ep-label">Short Description</label>
                                <textarea name="description" class="ep-textarea" style="min-height:100px;" placeholder="Brief description of this service…"></textarea>
                            </div>
                            <div>
                                <label class="ep-label">Display Order (lower = first)</label>
                                <input name="order_idx" type="number" class="ep-input" placeholder="e.g. 1" min="0">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-service-modal')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="ep-btn ep-btn-p" style="min-width:160px;">
                            <i class="fas fa-save"></i> Save Service
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════ SISTER COMPANY FORM MODAL ═══════ -->
        <div id="ep-sister-modal" class="ep-modal-wrapper" style="display:none;">
            <div class="modal-inner" style="max-width:600px;">
                <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-sister-modal')"><i class="fas fa-times"></i></button>
                <form id="sister-form" style="display:contents;">
                    <div class="modal-header">
                        <h2 id="sister-modal-title">Sister Company</h2>
                        <p>Companies shown in the footer's Sister Companies section.</p>
                    </div>
                    <div class="modal-body-scroll">
                        <div style="display:flex;flex-direction:column;gap:18px;">
                            <div>
                                <label class="ep-label">Highlighted Prefix (Bold Red)</label>
                                <input name="highlight" class="ep-input" placeholder="e.g. ELITE">
                            </div>
                            <div>
                                <label class="ep-label">Company Name (remainder)</label>
                                <input name="name" class="ep-input" required placeholder="e.g. MOTORS UAE">
                            </div>
                            <div>
                                <label class="ep-label">Website URL</label>
                                <input name="url" class="ep-input" type="url" placeholder="https://example.com">
                            </div>
                            <div>
                                <label class="ep-label">Short Description</label>
                                <textarea name="description" class="ep-textarea" style="min-height:80px;" placeholder="One-liner about this sister company…"></textarea>
                            </div>
                            <div>
                                <label class="ep-label">Display Order</label>
                                <input name="order_idx" type="number" class="ep-input" placeholder="e.g. 1" min="0">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-sister-modal')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="ep-btn ep-btn-p" style="min-width:160px;">
                            <i class="fas fa-save"></i> Save Company
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════ FOOTER LINK FORM MODAL ═══════ -->
        <div id="ep-footer-link-modal" class="ep-modal-wrapper" style="display:none;">
            <div class="modal-inner" style="max-width:600px;">
                <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-footer-link-modal')"><i class="fas fa-times"></i></button>
                <form id="footer-link-form" style="display:contents;">
                    <div class="modal-header">
                        <h2 id="footer-link-modal-title">Footer Link</h2>
                        <p>Navigation links shown in the site footer columns.</p>
                    </div>
                    <div class="modal-body-scroll">
                        <div style="display:flex;flex-direction:column;gap:18px;">
                            <div>
                                <label class="ep-label">Section / Column Heading</label>
                                <input name="section" class="ep-input" required placeholder="e.g. Quick Links, Services, Contact…">
                            </div>
                            <div>
                                <label class="ep-label">Link Label</label>
                                <input name="label" class="ep-input" required placeholder="e.g. About Us">
                            </div>
                            <div>
                                <label class="ep-label">URL / href</label>
                                <input name="url" class="ep-input" required placeholder="e.g. /about or https://…">
                            </div>
                            <div>
                                <label class="ep-label">FontAwesome Icon Class (optional)</label>
                                <input name="icon" class="ep-input" placeholder="e.g. fas fa-arrow-right">
                            </div>
                            <div>
                                <label class="ep-label">Display Order</label>
                                <input name="order_idx" type="number" class="ep-input" placeholder="e.g. 1" min="0">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-footer-link-modal')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="ep-btn ep-btn-p" style="min-width:160px;">
                            <i class="fas fa-save"></i> Save Link
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════ CRM INQUIRY / QUOTE VIEW MODAL ═══════ -->
        <div id="ep-inq-modal" class="ep-modal-wrapper" style="display:none;">
            <div class="modal-inner" style="max-width:820px;">
                <button class="close-modal-btn" type="button" onclick="window.closeAdminModal('ep-inq-modal')"><i class="fas fa-times"></i></button>
                <div class="modal-header">
                    <h2>Lead Details</h2>
                    <p>Review customer inquiry and log your reply notes below.</p>
                </div>
                <div class="modal-body-scroll">
                    <!-- Status Banner -->
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding:16px 22px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="width:44px;height:44px;background:var(--ep-primary-grad);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;" id="inq-modal-avatar">?</div>
                            <div>
                                <div style="font-weight:800;font-size:1.05rem;" id="inq-modal-name">—</div>
                                <div style="color:#888;font-size:0.8rem;" id="inq-modal-date">—</div>
                            </div>
                        </div>
                        <div id="inq-modal-status"></div>
                    </div>

                    <!-- Customer Info Grid -->
                    <div class="crm-card-grid" style="margin-bottom:22px;">
                        <div class="crm-card">
                            <div class="crm-row">
                                <span class="crm-label"><i class="fas fa-envelope" style="margin-right:6px;color:var(--ep-primary)"></i>Email</span>
                                <span class="crm-val" id="inq-modal-email">—</span>
                            </div>
                            <div class="crm-row">
                                <span class="crm-label"><i class="fas fa-phone" style="margin-right:6px;color:var(--ep-primary)"></i>Phone / WhatsApp</span>
                                <span class="crm-val" id="inq-modal-phone">—</span>
                            </div>
                        </div>
                        <div class="crm-card">
                            <div class="crm-row">
                                <span class="crm-label"><i class="fas fa-car" style="margin-right:6px;color:var(--ep-primary)"></i>Vehicle / Interest</span>
                                <span class="crm-val" id="inq-modal-vehicle">—</span>
                            </div>
                            <div class="crm-row">
                                <span class="crm-label"><i class="fas fa-map-marker-alt" style="margin-right:6px;color:var(--ep-primary)"></i>Destination</span>
                                <span class="crm-val" id="inq-modal-dest">—</span>
                            </div>
                        </div>
                    </div>

                    <!-- Message / Notes -->
                    <div class="crm-card" style="margin-bottom:22px;">
                        <div class="crm-row" style="margin-bottom:0;">
                            <span class="crm-label"><i class="fas fa-comment-alt" style="margin-right:6px;color:var(--ep-primary)"></i>Customer Message / Notes</span>
                            <span class="crm-val" id="inq-modal-notes" style="white-space:pre-wrap;line-height:1.7;color:#ccc;">—</span>
                        </div>
                    </div>

                    <!-- Reply Box -->
                    <div>
                        <label class="ep-label"><i class="fas fa-reply" style="margin-right:6px;"></i>Internal Reply Notes</label>
                        <textarea id="inq-modal-reply" class="ep-textarea" style="min-height:110px;" placeholder="Log your reply, notes, or follow-up actions here…"></textarea>
                        <p style="color:#666;font-size:0.75rem;margin-top:8px;">
                            <i class="fas fa-info-circle" style="margin-right:5px;"></i>
                            Saving marks this inquiry as <strong style="color:#25d366;">Replied</strong> and stores your notes.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="ep-btn ep-btn-sec" onclick="window.closeAdminModal('ep-inq-modal')">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <button type="button" id="ep-inq-reply-btn" class="ep-btn ep-btn-p" style="min-width:180px;">
                        <i class="fas fa-check-circle"></i> Mark as Replied
                    </button>
                </div>
            </div>
        </div>

        <!-- ═══════ CONFIRM DELETE MODAL ═══════ -->
        <div id="ep-confirm-modal" class="ep-modal-wrapper" style="display:none;">
            <div class="modal-inner" style="max-width:480px;">
                <div class="modal-header" style="text-align:center;padding:40px 38px 28px;">
                    <div style="width:64px;height:64px;background:rgba(255,59,48,0.12);border:2px solid rgba(255,59,48,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:1.6rem;color:var(--ep-primary);">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 id="ep-confirm-title" style="font-size:1.35rem;margin-bottom:8px;">Confirm Action</h2>
                    <p id="ep-confirm-msg" style="color:#888;font-size:0.88rem;line-height:1.6;">Are you sure you want to proceed?</p>
                </div>
                <div class="modal-footer" style="justify-content:center;gap:16px;padding-top:10px;">
                    <button id="ep-confirm-cancel" type="button" class="ep-btn ep-btn-sec" style="min-width:130px;">
                        <i class="fas fa-arrow-left"></i> Go Back
                    </button>
                    <button id="ep-confirm-ok" type="button" class="ep-btn ep-btn-danger" style="min-width:130px;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- ═══════ TOAST CONTAINER ═══════ -->
        <div id="ep-toast-container"></div>

        <!-- ═══════ FLOATING ADMIN TRIGGER (fallback) ═══════ -->
        <button id="ep-admin-trigger" title="Open Admin Panel" style="display:none;">
            <i class="fas fa-cog"></i>
        </button>
        `);

        // ── Additional styles injected after HTML (Login form layout + extras) ──
        const extraCss = `
        /* ── LOGIN FORM ── */
        #ep-login-form {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; flex: 1; padding: 60px 40px;
            background: radial-gradient(ellipse at 50% 0%, rgba(255,59,48,0.06) 0%, transparent 70%);
            animation: fadeTabIn 0.4s ease;
        }
        .ep-login-icon {
            width: 90px; height: 90px;
            background: rgba(255,59,48,0.1);
            border: 2px solid rgba(255,59,48,0.25);
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; font-size: 2rem; color: var(--ep-primary);
            margin-bottom: 28px;
            box-shadow: 0 0 40px rgba(255,59,48,0.15);
        }
        .ep-login-title {
            font-size: 2rem; font-weight: 900; letter-spacing: 3px;
            text-transform: uppercase; margin-bottom: 8px;
        }
        .ep-login-sub {
            color: #666; font-size: 0.82rem; margin-bottom: 40px;
            text-align: center; letter-spacing: 0.5px;
        }
        .ep-login-fields {
            width: 100%; max-width: 420px;
            display: flex; flex-direction: column; gap: 16px;
            margin-bottom: 24px;
        }

        /* ── INQUIRY AVATAR SYNC ── */
        #ep-inq-modal #inq-modal-avatar { text-transform: uppercase; }

        /* ── SPEC SECTION QUICK STATS highlight ── */
        [name^="spec_"] { border-color: rgba(255,59,48,0.2) !important; }
        [name^="spec_"]:focus { border-color: var(--ep-primary) !important; }

        /* ── KV ROW ANIMATIONS ── */
        .kv-row { animation: fadeTabIn 0.25s ease; }

        /* ── CONFIRM MODAL centered layout fix ── */
        #ep-confirm-modal .modal-inner { max-height: fit-content; }
        #ep-confirm-modal .modal-footer { border-top: none; }

        /* ── TABLE RESPONSIVENESS ── */
        @media (max-width: 768px) {
            .ep-tab-content { padding: 22px 18px; }
            .tab-toolbar { flex-direction: column; align-items: stretch; }
            .tab-search-wrap input { max-width: 100% !important; width: 100% !important; }
            .crm-card-grid { grid-template-columns: 1fr; }
            .ep-header { padding: 16px 20px; }
            .modal-header { padding: 24px 22px 18px; }
            .modal-body-scroll { padding: 22px; }
            .modal-footer { padding: 16px 22px; }
        }
        `;
        const style2 = document.createElement('style');
        style2.innerHTML = extraCss;
        document.head.appendChild(style2);
    }

    // ── Patch: sync inquiry modal avatar initial on viewInq ──────────
    // Override the avatar letter update (originally missing from viewInq)
    const _origViewInq = window.viewInq;
    window.viewInq = (id, table) => {
        _origViewInq(id, table);
        // Set avatar initial after the modal populates
        setTimeout(() => {
            const nameEl = document.getElementById('inq-modal-name');
            const avatarEl = document.getElementById('inq-modal-avatar');
            if (nameEl && avatarEl) {
                avatarEl.textContent = (nameEl.textContent || '?')[0].toUpperCase();
            }
        }, 50);
    };

})(); // ── END IIFE ──────────────────────────────────────────────────