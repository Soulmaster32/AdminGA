/* 
 * EXTENSION.JS 
 * Features: Live Clock, Signature Pad (Touch/Mouse), Duplicate Check, LocalStorage, Redirect
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LIVE CLOCK FUNCTION ---
    const clockElement = document.getElementById("liveClock");
    
    function updateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        if(clockElement) {
            clockElement.textContent = `${now.toLocaleDateString('en-US', dateOptions)} • ${now.toLocaleTimeString()}`;
        }
    }
    setInterval(updateTime, 1000);
    updateTime(); // Run immediately

    // --- 2. ADVANCED SIGNATURE PAD LOGIC ---
    const canvas = document.getElementById("sigCanvas");
    const ctx = canvas.getContext("2d");
    const container = document.getElementById("sigContainer");
    const clearBtn = document.getElementById("clearSig");
    let isDrawing = false;

    // Responsive Canvas Resizing
    function resizeCanvas() {
        if(!canvas || !container) return;
        // Set canvas internal dimensions to match display dimensions
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Context settings reset on resize, so re-apply
        ctx.strokeStyle = "#2d3436";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }
    
    // Listen for window resize
    window.addEventListener("resize", resizeCanvas);
    // Slight delay to ensure DOM is ready
    setTimeout(resizeCanvas, 50);

    // Get position helper (Handles Touch and Mouse)
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
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
        
        // Note: We don't preventDefault here on mouse to allow normal clicking,
        // but touch moves will be prevented in the draw function.
    }

    // Draw Line
    function draw(e) {
        if (!isDrawing) return;
        
        // Critical: Prevent scrolling on mobile when dragging inside canvas
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

    // Event Listeners
    if(canvas) {
        // Mouse
        canvas.addEventListener("mousedown", startDraw);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", stopDraw);
        canvas.addEventListener("mouseleave", stopDraw);

        // Touch (Mobile) - { passive: false } is required to use preventDefault()
        canvas.addEventListener("touchstart", startDraw, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", stopDraw);
    }

    // Clear Button
    if(clearBtn) {
        clearBtn.addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // Check if signature is empty
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
        
        // Animate out
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

            // A. Get Values
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
                showToast("Please provide a digital signature.", "error");
                return;
            }

            // C. Duplicate Check
            // Unique ID = First + Middle + Last (lowercased)
            const uniqueID = `${fname.toLowerCase()}-${mname.toLowerCase()}-${lname.toLowerCase()}`;
            
            // Get existing data
            let registrants = JSON.parse(localStorage.getItem("registrants")) || [];

            // Check if ID exists
            const isDuplicate = registrants.some(person => person.id === uniqueID);

            if (isDuplicate) {
                showToast(`Duplicate: ${fname} ${lname} is already registered.`, "error");
                // Shake effect
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

            // D. Save Data
            const newRecord = {
                id: uniqueID,
                firstName: fname,
                middleName: mname,
                lastName: lname,
                dept: dept,
                section: section,
                date: new Date().toISOString(),
                signature: canvas.toDataURL() // Save signature as image data
            };

            registrants.push(newRecord);
            localStorage.setItem("registrants", JSON.stringify(registrants));

            // E. Success Handling
            showToast("Registration Successful! Redirecting...", "success");
            triggerConfetti();

            // Show visual modal
            const successModal = document.getElementById("successModal");
            if(successModal) successModal.style.display = "flex";

            // Redirect to records.html after 1.5 seconds
            setTimeout(() => {
                window.location.href = "records.html";
            }, 1500);
        });
    }

    // --- 5. CONFETTI ANIMATION ---
    function triggerConfetti() {
        const colors = ['#4e54c8', '#8f94fb', '#ff6b6b', '#feca57', '#2ecc71'];
        
        for(let i=0; i<60; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.width = Math.random() * 10 + 5 + 'px';
            conf.style.height = Math.random() * 10 + 5 + 'px';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.top = '50%';
            conf.style.left = '50%';
            conf.style.zIndex = '9999';
            conf.style.pointerEvents = 'none';
            conf.style.borderRadius = '50%';
            document.body.appendChild(conf);

            // Physics calculation
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
