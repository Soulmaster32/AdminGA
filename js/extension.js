/* 
 * EXTENSION.JS 
 * Full Logic: Clock, Signature, Storage, Duplicate Check, and Redirect
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LIVE CLOCK FUNCTION ---
    const clockElement = document.getElementById("liveClock");
    
    function updateTime() {
        if(!clockElement) return;
        const now = new Date();
        const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        clockElement.textContent = `${now.toLocaleDateString('en-US', dateOptions)} • ${now.toLocaleTimeString()}`;
    }
    setInterval(updateTime, 1000);
    updateTime();


    // --- 2. SIGNATURE PAD LOGIC (Mobile Optimized) ---
    const canvas = document.getElementById("sigCanvas");
    const ctx = canvas.getContext("2d");
    const container = document.getElementById("sigContainer");
    const clearBtn = document.getElementById("clearSig");
    let isDrawing = false;

    // Resize canvas to fit responsive div
    function resizeCanvas() {
        if(!canvas || !container) return;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Reset styles after resize
        ctx.strokeStyle = "#2d3436";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }
    
    // Resize initially and on window resize
    window.addEventListener("resize", resizeCanvas);
    // Slight delay to ensure DOM is fully rendered before calculating width
    setTimeout(resizeCanvas, 100); 

    // Get exact position relative to canvas
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        // Handle touch or mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // Start Drawing
    function startDraw(e) {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        
        // Prevent default on touch to stop scrolling while signing
        if(e.type === 'touchstart') {
            // e.preventDefault(); // Uncomment if signature feels laggy on specific devices
        }
    }

    // Draw Movement
    function draw(e) {
        if (!isDrawing) return;
        
        // Stop page scrolling when touching the canvas
        if(e.cancelable) e.preventDefault(); 
        
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    // Stop Drawing
    function stopDraw() {
        isDrawing = false;
        ctx.closePath();
    }

    if(canvas) {
        // Mouse Events
        canvas.addEventListener("mousedown", startDraw);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDraw);
        canvas.addEventListener("mouseleave", stopDraw);

        // Touch Events (Mobile)
        canvas.addEventListener("touchstart", startDraw, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", stopDraw);
    }

    // Clear Button Logic
    if(clearBtn) {
        clearBtn.addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // Helper: Check if canvas is blank
    function isSignatureEmpty() {
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }


    // --- 3. TOAST NOTIFICATION SYSTEM ---
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


    // --- 4. FORM SUBMISSION & DUPLICATE CHECK ---
    const form = document.getElementById("regForm");

    if(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // A. Capture Values
            const fname = document.getElementById("fname").value.trim();
            const mname = document.getElementById("mname").value.trim();
            const lname = document.getElementById("lname").value.trim();
            const dept = document.getElementById("dept").value;
            const section = document.getElementById("section").value.trim();

            // B. Validation
            if (!fname || !lname || !dept || !section) {
                showToast("Please fill in all required fields.", "error");
                return;
            }

            if (isSignatureEmpty()) {
                showToast("Electronic signature is required.", "error");
                return;
            }

            // C. DUPLICATE CHECK LOGIC
            // Generate unique ID based on name combination
            const fullNameKey = `${fname.toLowerCase()}-${mname.toLowerCase()}-${lname.toLowerCase()}`;
            
            // Fetch existing records
            let registrants = JSON.parse(localStorage.getItem("registrants")) || [];

            // Check if ID exists
            const exists = registrants.some(person => person.id === fullNameKey);

            if (exists) {
                showToast(`Duplicate: ${fname} ${lname} is already registered.`, "error");
                // Shake Animation
                const card = document.querySelector('.card');
                if(card) {
                    card.animate([
                        { transform: 'translateX(0)' }, 
                        { transform: 'translateX(-10px)' }, 
                        { transform: 'translateX(10px)' }, 
                        { transform: 'translateX(0)' }
                    ], { duration: 300 });
                }
                return;
            }

            // D. SAVE DATA
            const newRecord = {
                id: fullNameKey,
                firstName: fname,
                middleName: mname,
                lastName: lname,
                dept: dept,
                section: section,
                date: new Date().toISOString(), // ISO format is better for sorting later
                signature: canvas.toDataURL() 
            };

            registrants.push(newRecord);
            localStorage.setItem("registrants", JSON.stringify(registrants));

            // E. SUCCESS & REDIRECT
            showToast("Registration Successful! Redirecting...", "success");
            triggerConfetti(); 
            
            // Show Success Modal (Optional, purely visual before redirect)
            const successModal = document.getElementById("successModal");
            if(successModal) successModal.style.display = "flex";

            // Redirect to records page after 1.5 seconds
            setTimeout(() => {
                window.location.href = "records.html";
            }, 1500);
        });
    }

    // --- 5. CONFETTI EFFECT ---
    function triggerConfetti() {
        const colors = ['#4e54c8', '#8f94fb', '#ff6b6b', '#feca57'];
        
        // Create 50 particles
        for(let i=0; i<50; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.width = '10px';
            conf.style.height = '10px';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.top = '50%';
            conf.style.left = '50%';
            conf.style.zIndex = '9999';
            conf.style.pointerEvents = 'none'; // Click-through
            document.body.appendChild(conf);

            // Calculate random trajectory
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 2; // Speed
            const tx = Math.cos(angle) * 150 * velocity;
            const ty = Math.sin(angle) * 150 * velocity;

            // Animate
            conf.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
            }).onfinish = () => conf.remove(); // Cleanup DOM
        }
    }
});
