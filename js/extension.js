/* 
 * EXTENSION.JS 
 * Contains Logic for Registration System
 * Features: Auto Clock, Canvas Signature, Duplicate Check, LocalStorage
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LIVE CLOCK FUNCTION ---
    const clockElement = document.getElementById("liveClock");
    
    function updateTime() {
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
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        ctx.strokeStyle = "#2d3436";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Init

    // Drawing helper
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

    // Start
    function startDraw(e) {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        // Important: prevent default logic to stop scrolling on mobile
        if(e.type !== 'mousedown') { 
            // Only prevent default on touch to stop scroll
            // We don't prevent default on mouse to allow normal browser interactions
        }
    }

    // Move
    function draw(e) {
        if (!isDrawing) return;
        if(e.cancelable) e.preventDefault(); // Stop scrolling while signing
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    // End
    function stopDraw() {
        isDrawing = false;
        ctx.closePath();
    }

    // Bind Events (Mouse & Touch)
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    // Clear Button
    clearBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Helper: Check if canvas is empty
    function isSignatureEmpty() {
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }


    // --- 3. TOAST NOTIFICATION SYSTEM ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
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

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // A. Basic Validation
        const fname = document.getElementById("fname").value.trim();
        const mname = document.getElementById("mname").value.trim();
        const lname = document.getElementById("lname").value.trim();
        const dept = document.getElementById("dept").value;
        const section = document.getElementById("section").value.trim();

        if (!fname || !lname || !dept || !section) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        if (isSignatureEmpty()) {
            showToast("Electronic signature is required.", "error");
            return;
        }

        // B. DUPLICATE CHECK LOGIC
        // Create a unique key for the person (Name combination)
        const fullNameKey = `${fname.toLowerCase()}-${mname.toLowerCase()}-${lname.toLowerCase()}`;
        
        // Get existing data from LocalStorage
        let registrants = JSON.parse(localStorage.getItem("registrants")) || [];

        // Check if exists
        const exists = registrants.some(person => person.id === fullNameKey);

        if (exists) {
            showToast(`Duplicate found! ${fname} ${lname} is already registered.`, "error");
            // Shake effect on form
            document.querySelector('.card').animate([
                { transform: 'translateX(0)' }, 
                { transform: 'translateX(-10px)' }, 
                { transform: 'translateX(10px)' }, 
                { transform: 'translateX(0)' }
            ], { duration: 300 });
            return;
        }

        // C. SAVE DATA
        const newRecord = {
            id: fullNameKey,
            firstName: fname,
            middleName: mname,
            lastName: lname,
            dept: dept,
            section: section,
            date: new Date().toISOString(),
            // We don't save the full image string to localstorage usually (too big), 
            // but for a demo this is fine:
            signature: canvas.toDataURL() 
        };

        registrants.push(newRecord);
        localStorage.setItem("registrants", JSON.stringify(registrants));

        // D. SUCCESS UI
        showToast("Registration Successful!", "success");
        triggerConfetti(); // Visual effect
        
        setTimeout(() => {
            document.getElementById("successModal").style.display = "flex";
        }, 1000);
    });

    // --- 5. SIMPLE CONFETTI EFFECT ---
    function triggerConfetti() {
        const colors = ['#4e54c8', '#8f94fb', '#ff6b6b', '#feca57'];
        for(let i=0; i<50; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.width = '10px';
            conf.style.height = '10px';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.top = '50%';
            conf.style.left = '50%';
            conf.style.zIndex = '9999';
            document.body.appendChild(conf);

            // Animate
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 2;
            const tx = Math.cos(angle) * 100 * velocity;
            const ty = Math.sin(angle) * 100 * velocity;

            conf.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
            }).onfinish = () => conf.remove();
        }
    }
});
