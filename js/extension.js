/* * EXTENSION.JS 
 * Logic for: Registration, Clock, Signature, Validation, Storage, Redirection
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LIVE CLOCK ---
    const clockElement = document.getElementById("liveClock");
    
    function updateTime() {
        if(!clockElement) return;
        const now = new Date();
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        // Format: Mon, Dec 4 • 10:00:00 AM
        clockElement.textContent = `${now.toLocaleDateString('en-US', dateOptions)} • ${now.toLocaleTimeString()}`;
    }
    setInterval(updateTime, 1000);
    updateTime();

    // --- 2. SIGNATURE PAD ENGINE ---
    const canvas = document.getElementById("sigCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const container = document.getElementById("sigContainer");
    const clearBtn = document.getElementById("clearSig");
    let isDrawing = false;

    // Canvas Resize (Responsive)
    function resizeCanvas() {
        if(!canvas || !container) return;
        
        // Make internal resolution match display size
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Reset brush styles after resize
        ctx.strokeStyle = "#2d3436";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }
    
    window.addEventListener("resize", resizeCanvas);
    setTimeout(resizeCanvas, 100); // Init delay

    // Coordinate Calculator (Touch & Mouse)
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: cx - rect.left,
            y: cy - rect.top
        };
    }

    // Drawing Logic
    if (canvas) {
        const start = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!isDrawing) return;
            // Prevent scrolling on mobile while signing
            if (e.cancelable) e.preventDefault(); 
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const stop = () => { isDrawing = false; ctx.closePath(); };

        // Mouse Events
        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stop);
        canvas.addEventListener("mouseleave", stop);

        // Touch Events (Passive: false required to prevent scroll)
        canvas.addEventListener("touchstart", start, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", stop);
    }

    // Clear Button
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // --- 3. HELPER FUNCTIONS ---
    
    // Toast Notification
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if(!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<strong>${type === 'success' ? '✔' : '⚠'}</strong> &nbsp; ${message}`;
        container.appendChild(toast);
        
        // Remove after 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Check Empty Signature
    function isSignatureEmpty() {
        if(!canvas) return true;
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }
    
    // *** UPDATED HELPER FUNCTION: Reset the form ***
    function resetRegistrationForm() {
        // Reset text inputs
        document.getElementById("fname").value = "";
        document.getElementById("mname").value = "";
        document.getElementById("lname").value = "";
        // REMOVED: document.getElementById("section").value = "";
        
        // Reset department select (to the first disabled option)
        const deptSelect = document.getElementById("dept");
        deptSelect.selectedIndex = 0;
        
        // Clear the signature canvas
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Hide the success modal
        const successModal = document.getElementById("successModal");
        if(successModal) successModal.style.display = "none";

        // Optional: Reset focus for the next entry
        document.getElementById("fname").focus();
    }
    // ------------------------------------------


    // --- 4. FORM SUBMISSION ---
    const form = document.getElementById("regForm");

    if(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // A. Capture Data
            const fname = document.getElementById("fname").value.trim();
            const mname = document.getElementById("mname").value.trim();
            const lname = document.getElementById("lname").value.trim();
            const dept = document.getElementById("dept").value;
            // REMOVED: const section = document.getElementById("section").value.trim();

            // B. Validation
            // UPDATED: Removed 'section' from validation check
            if (!fname || !lname || !dept) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            if (isSignatureEmpty()) {
                showToast("Digital signature is required.", "error");
                return;
            }

            // C. Duplicate Check
            // Unique ID = name combo
            const uniqueID = `${fname}-${mname}-${lname}`.toLowerCase().replace(/\s/g, '');
            
            // Get existing data
            let registrants = JSON.parse(localStorage.getItem("registrants")) || [];

            // Check if ID exists
            const isDuplicate = registrants.some(person => person.id === uniqueID);

            if (isDuplicate) {
                showToast(`${fname} ${lname} is already registered!`, "error");
                // Shake Card Animation
                const card = document.querySelector('.card');
                card.animate([
                    { transform: 'translateX(0)' }, 
                    { transform: 'translateX(-10px)' }, 
                    { transform: 'translateX(10px)' }, 
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
                return;
            }

            // D. Save Data Object
            // UPDATED: Removed 'section' property from the newRecord object
            const newRecord = {
                id: uniqueID,
                firstName: fname,
                middleName: mname,
                lastName: lname,
                dept: dept,
                date: new Date().toISOString(),
                signature: canvas.toDataURL() // Save signature image
            };

            registrants.push(newRecord);
            localStorage.setItem("registrants", JSON.stringify(registrants));

            // E. Success & Return to Form (No Redirect)
            showToast("Registration Saved! Ready for next entry.", "success");
            triggerConfetti();

            // Show Modal
            const successModal = document.getElementById("successModal");
            if(successModal) successModal.style.display = "flex";

            // *** REPLACED REDIRECTION WITH FORM RESET ***
            setTimeout(() => {
                resetRegistrationForm();
            }, 1500); // Wait 1.5s for the success message/confetti to display
        });
    }

    // --- 5. CONFETTI EFFECT ---
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
