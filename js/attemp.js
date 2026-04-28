/**
 * ELITE ROUTE - Enhanced Security & Scare Script
 * Disables UI interaction and threatens system restart on DevTools detection.
 */

(function () {
    'use strict';

    // Count attempts to escalate the warning
    let attemptCount = 0;

    function triggerSecurityAction() {
        attemptCount++;

        if (attemptCount === 1) {
            alert("SECURITY WARNING: Unauthorized access to source code is restricted.\n\nATTENTION: Any further attempts will trigger a mandatory system restart command on this device to protect proprietary data.");
        } else {
            // The "Scare" Message
            alert("CRITICAL SECURITY BREACH: System restart command initiated...\n\nYour session is being terminated. Please save your work immediately.");
            
            // Attempt to kill the tab immediately
            terminateSession();
        }
    }

    function terminateSession() {
        // Attempt to close the tab
        window.open('', '_self', '');
        window.close();
        
        // Fallback for browsers that block window.close()
        window.location.href = "about:blank";
    }

    // 1. Block Right-Click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        triggerSecurityAction();
    });

    // 2. Block Keyboard Shortcuts (F12, Ctrl+U, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', (e) => {
        const forbiddenKeys = [123, 73, 74, 67, 85, 83]; // F12, I, J, C, U, S
        const isMeta = e.ctrlKey || e.shiftKey || e.altKey;

        if (forbiddenKeys.includes(e.keyCode) || (isMeta && forbiddenKeys.includes(e.keyCode))) {
            e.preventDefault();
            triggerSecurityAction();
            return false;
        }
    });

    // 3. Prevent Text Highlighting (Copying)
    document.onselectstart = () => { return false; };

    // 4. DevTools Detection (Window Dimension Check)
    const detectDevTools = () => {
        const threshold = 160;
        const widthViolation = window.outerWidth - window.innerWidth > threshold;
        const heightViolation = window.outerHeight - window.innerHeight > threshold;

        if (widthViolation || heightViolation) {
            terminateSession();
        }
    };

    // 5. Debugger "Trap"
    // This pauses the browser if they somehow get the console open, making the site unusable
    setInterval(() => {
        (function() {
            return false;
        }['constructor']('debugger')());
        detectDevTools();
    }, 1000);

})();