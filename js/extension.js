/* * EXTENSION.JS 
 * Logic for: Registration, Clock, Signature, Validation, Supabase Submission
 */

// ✅ SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://hbkitssxgajgncavxang.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhia2l0c3N4Z2FqZ25jYXZ4cW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjE0OTksImV4cCI6MjA4MDQzNzQ5OX0.qLoTUj8nqQuE0W-6g5DBdEiRhjDb1KfzBd2zEHPaJbE'; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LIVE CLOCK ---
    const clockElement = document.getElementById("liveClock");
    
    function updateTime() {
        if(!clockElement) return;
        const now = new Date();
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        clockElement.textContent = `${now.toLocaleDateString('en-US', dateOptions)} • ${now.toLocaleTimeString()}`;
    }
    setInterval(updateTime, 1000);
    updateTime();

    // --- 2. SIGNATURE PAD ENGINE (Fixed Initialization) ---
    const canvas = document.getElementById("sigCanvas");
    const container = document.getElementById("sigContainer");
    const clearBtn = document.getElementById("clearSig");
    let isDrawing = false;
    let ctx = null; // Initialize ctx here

    // Function to set up the canvas, called on load and resize
    function resizeCanvas() {
        if(!canvas || !container) return;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Re-get context and set styles after resize
        if (!ctx) {
            ctx = canvas.getContext("2d");
            ctx.strokeStyle = "#2d3436";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }
    
    window.addEventListener("resize", resizeCanvas);
    // Use a small timeout to ensure the DOM is fully rendered before resizing
    setTimeout(resizeCanvas, 50); 

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    }

    if (canvas) {
        const start = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            if(ctx) {
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
            }
        };

        const draw = (e) => {
            if (!isDrawing || !ctx) return;
            if (e.cancelable) e.preventDefault(); 
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const stop = () => { isDrawing = false; if(ctx) ctx.closePath(); };

        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stop);
        canvas.addEventListener("mouseleave", stop);
        canvas.addEventListener("touchstart", start, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", stop);
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // --- 3. HELPER FUNCTIONS ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if(!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<strong>${type === 'success' ? '✔' : '⚠'}</strong> &nbsp; ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function isSignatureEmpty() {
        if(!canvas) return true;
        // Make sure canvas is ready before checking
        if (canvas.width === 0 || canvas.height === 0) return true; 
        
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        // Check if the canvas data is identical to a blank canvas
        return canvas.toDataURL() === blank.toDataURL();
    }
    
    function resetRegistrationForm() {
        document.getElementById("fname").value = "";
        document.getElementById("mname").value = "";
        document.getElementById("lname").value = "";
        
        const deptSelect = document.getElementById("dept");
        deptSelect.selectedIndex = 0;
        
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const successModal = document.getElementById("successModal");
        if(successModal) successModal.style.display = "none";

        document.getElementById("fname").focus();
    }

    // --- 4. FORM SUBMISSION (Supabase) ---
    const form = document.getElementById("regForm");

    if(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // A. Capture Data
            const fname = document.getElementById("fname").value.trim();
            const mname = document.getElementById("mname").value.trim();
            const lname = document.getElementById("lname").value.trim();
            const dept = document.getElementById("dept").value;

            // B. Validation
            if (!fname || !lname || !dept) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            if (isSignatureEmpty()) {
                showToast("Digital signature is required.", "error");
                return;
            }

            // C. Duplicate Check against Supabase
            // Use date_registered as default for now, then check for duplicates
            const uniqueID = `${fname.toLowerCase()}-${lname.toLowerCase()}-${dept.toLowerCase()}`.replace(/\s/g, '');
            
            const { data: existingData, error: checkError } = await supabase
                .from('registrations')
                .select('id')
                .eq('unique_id', uniqueID);

            if (checkError) {
                console.error("Supabase Check Error:", checkError);
                showToast("A database error occurred during validation.", "error");
                return;
            }

            if (existingData && existingData.length > 0) {
                showToast(`${fname} ${lname} from ${dept} is already registered!`, "error");
                const card = document.querySelector('.card-wrapper');
                card.animate([
                    { transform: 'translateX(0)' }, 
                    { transform: 'translateX(-10px)' }, 
                    { transform: 'translateX(10px)' }, 
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
                return;
            }
            
            // D. Save Data to Supabase (Signature is captured as Base64 Data URL)
            const signatureDataUrl = canvas ? canvas.toDataURL() : null;

            const newRecord = {
                unique_id: uniqueID, 
                first_name: fname,
                middle_name: mname,
                last_name: lname,
                dept: dept,
                signature: signatureDataUrl,
                date_registered: new Date().toISOString() // Save timestamp
            };

            const { error: insertError } = await supabase
                .from('registrations')
                .insert([newRecord]);

            if (insertError) {
                console.error("Supabase Insert Error:", insertError);
                showToast("Registration failed due to a database error.", "error");
                return;
            }

            // E. Success & Form Reset
            showToast("Registration Saved! Ready for next entry.", "success");
            triggerConfetti();

            const successModal = document.getElementById("successModal");
            if(successModal) successModal.style.display = "flex";

            setTimeout(() => {
                resetRegistrationForm();
            }, 1500); 
        });
    }

    // --- 5. CONFETTI EFFECT (Unchanged) ---
    function triggerConfetti() {
        const colors = ['#4e54c8', '#8f94fb', '#ff6b6b', '#feca57', '#00b894'];
        
        for(let i=0; i<60; i++) {
            const conf = document.createElement('div');
            const size = Math.random() * 8 + 4;
            
            Object.assign(conf.style, {
                position: 'fixed',
                width: size + 'px',
                height: size + 'px',
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                top: '50%', left: '50%',
                zIndex: '9999', pointerEvents: 'none', borderRadius: '50%'
            });
            document.body.appendChild(conf);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 3 + Math.random() * 4;
            const tx = Math.cos(angle) * (150 + Math.random() * 100) * velocity;
            const ty = Math.sin(angle) * (150 + Math.random() * 100) * velocity;

            conf.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 500,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
            }).onfinish = () => conf.remove();
        }
    }
});
