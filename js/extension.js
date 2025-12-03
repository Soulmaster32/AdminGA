document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Clock
    const clock = document.getElementById("liveClock");
    setInterval(() => {
        const now = new Date();
        if(clock) clock.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString()}`;
    }, 1000);

    // 2. Signature Pad
    const canvas = document.getElementById("sigCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const container = document.getElementById("sigContainer");
    let isDrawing = false;

    function resizeCanvas() {
        if(!canvas || !container) return;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.lineCap = "round";
    }
    window.addEventListener("resize", resizeCanvas);
    setTimeout(resizeCanvas, 100);

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    }

    if(canvas) {
        const start = (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(getPos(e).x, getPos(e).y); };
        const move = (e) => { 
            if(!isDrawing) return; 
            if(e.cancelable) e.preventDefault(); // Stop scroll on mobile
            ctx.lineTo(getPos(e).x, getPos(e).y); ctx.stroke(); 
        };
        const end = () => { isDrawing = false; };

        canvas.addEventListener("mousedown", start); canvas.addEventListener("touchstart", start, {passive:false});
        canvas.addEventListener("mousemove", move); canvas.addEventListener("touchmove", move, {passive:false});
        canvas.addEventListener("mouseup", end); canvas.addEventListener("touchend", end);
        
        document.getElementById("clearSig").addEventListener("click", () => ctx.clearRect(0,0,canvas.width,canvas.height));
    }

    // 3. Validation & Saving
    function showToast(msg, type='success') {
        const div = document.createElement('div');
        div.className = `toast ${type}`;
        div.innerText = msg;
        document.getElementById('toast-container').appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    function isSigEmpty() {
        const blank = document.createElement('canvas');
        blank.width = canvas.width; blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }

    const form = document.getElementById("regForm");
    if(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const fname = document.getElementById("fname").value.trim();
            const mname = document.getElementById("mname").value.trim();
            const lname = document.getElementById("lname").value.trim();
            const dept = document.getElementById("dept").value;
            const section = document.getElementById("section").value.trim();

            if(!fname || !lname || !dept || !section) return showToast("Fill required fields", "error");
            if(isSigEmpty()) return showToast("Signature required", "error");

            // Duplicate Check
            const id = `${fname}-${mname}-${lname}`.toLowerCase();
            let data = JSON.parse(localStorage.getItem("registrants")) || [];
            
            if(data.some(u => u.id === id)) {
                return showToast("User already registered!", "error");
            }

            // Save Data
            data.push({
                id: id,
                firstName: fname, middleName: mname, lastName: lname,
                dept: dept, section: section,
                date: new Date().toISOString(),
                signature: canvas.toDataURL()
            });

            localStorage.setItem("registrants", JSON.stringify(data));
            
            showToast("Success! Redirecting...");
            
            // Redirect to Records Page after 1.5 seconds
            setTimeout(() => {
                window.location.href = "records.html";
            }, 1500);
        });
    }
});
