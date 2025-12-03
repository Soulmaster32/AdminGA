/* 
 * EXTENSION.JS 
 * Function: Logic for Registration System
 * Includes: Clock, Signature (Mobile/PC), LocalStorage, Redirect
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LIVE CLOCK ---
    const clockElement = document.getElementById("liveClock");
    
    function updateTime() {
        if(!clockElement) return;
        const now = new Date();
        const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
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

    // A. Canvas Resizer
    function resizeCanvas() {
        if(!canvas || !container) return;
        
        // Match canvas internal resolution to the display size
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Re-apply styles after resize (context resets on resize)
        ctx.strokeStyle = "#2d3436"; // Signature color
        ctx.lineWidth = 2.5;          // Pen thickness
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }
    
    // Initial resize with a small delay to ensure CSS has loaded
    setTimeout(resizeCanvas, 100);
    window.addEventListener("resize", resizeCanvas);

    // B. Coordinate Calculator
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        // Handle both Touch and Mouse events
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // C. Drawing Functions
    function startDraw(e) {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        
        // Note: We do NOT use preventDefault here for mouse events to allow clicking
    }

    function draw(e) {
        if (!isDrawing) return;
        
        // CRITICAL FOR MOBILE: Stop the screen from scrolling while dragging finger
        if (e.cancelable) e.preventDefault(); 
        
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function stopDraw() {
        isDrawing = false;
        ctx.closePath();
    }

    // D. Event Listeners
    if (canvas) {
        // Mouse
        canvas.addEventListener("mousedown", startDraw);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDraw);
        canvas.addEventListener("mouseleave", stopDraw);

        // Touch
        canvas.addEventListener("touchstart", startDraw, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", stopDraw);
    }

    // E. Clear Button
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // F. Validation Helper
    function isSignatureEmpty() {
        if(!canvas) return true;
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }


    // --- 3. TOAST NOTIFICATIONS ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if(!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<strong>${type === 'success' ? '✔' : '⚠'}</strong> &nbsp; ${message}`;
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }


    // --- 4. FORM SUBMISSION ---
    const form = document.getElementById("regForm");

    if(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // 1. Capture Data
            const fname = document.getElementById("fname").value.trim();
            const mname = document.getElementById("mname").value.trim();
            const lname = document.getElementById("lname").value.trim();
            const dept = document.getElementById("dept").value;
            const section = document.getElementById("section").value.trim();

            // 2. Validate Text
            if (!fname || !lname || !dept || !section) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            // 3. Validate Signature
            if (isSignatureEmpty()) {
                showToast("Electronic signature is required.", "error");
                return;
            }

            // 4. Check for Duplicates
            const uniqueID = `${fname.toLowerCase()}-${mname.toLowerCase()}-${lname.toLowerCase()}`;
            let registrants = JSON.parse(localStorage.getItem("registrants")) || [];
            
            const isDuplicate = registrants.some(person => person.id === uniqueID);

            if (isDuplicate) {
                showToast(`${fname} ${lname} is already registered.`, "error");
                // Shake Animation
                document.querySelector('.card').animate([
                    { transform: 'translateX(0)' }, 
                    { transform: 'translateX(-10px)' }, 
                    { transform: 'translateX(10px)' }, 
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
                return;
            }

            // 5. Save Data
            const newRecord = {
                id: uniqueID,
                firstName: fname,
                middleName: mname,
                lastName: lname,
                dept: dept,
                section: section,
                date: new Date().toISOString(),
                signature: canvas.toDataURL() 
            };

            registrants.push(newRecord);
            localStorage.setItem("registrants", JSON.stringify(registrants));

            // 6. Success Feedback
            showToast("Registration Successful! Redirecting...", "success");
            triggerConfetti();

            const successModal = document.getElementById("successModal");
            if(successModal) successModal.style.display = "flex";

            // 7. Redirect to Records Page
            setTimeout(() => {
                window.location.href = "records.html";
            }, 1500);
        });
    }

    // --- 5. CONFETTI EFFECT ---
    function triggerConfetti() {
        const colors = ['#4e54c8', '#8f94fb', '#ff6b6b', '#feca57', '#2ecc71'];
        for(let i=0; i<60; i++) {
            const conf = document.createElement('div');
            Object.assign(conf.style, {
                position: 'fixed',
                width: (Math.random() * 8 + 4) + 'px',
                height: (Math.random() * 8 + 4) + 'px',
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
