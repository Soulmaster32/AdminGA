/**
 * extension.js
 * Security script to prevent copying, right-clicking, and opening Developer Tools.
 */

(function() {
    'use strict';

    // Helper function to check if the user is interacting with form inputs
    function isFormElement(e) {
        const tag = e.target.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select';
    }

    // 1. Prevent Right-Click Context Menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    }, false);

    // 2. Prevent Text Selection (except inside form fields)
    document.addEventListener('selectstart', function(e) {
        if (!isFormElement(e)) {
            e.preventDefault();
        }
    }, false);

    // 3. Prevent Dragging elements (like images)
    document.addEventListener('dragstart', function(e) {
        if (!isFormElement(e)) {
            e.preventDefault();
        }
    }, false);

    // 4. Prevent Copying
    document.addEventListener('copy', function(e) {
        if (!isFormElement(e)) {
            e.preventDefault();
        }
    }, false);

    // 5. Prevent Cutting
    document.addEventListener('cut', function(e) {
        if (!isFormElement(e)) {
            e.preventDefault();
        }
    }, false);

    // 6. Prevent Keyboard Shortcuts (DevTools, View Source, Save, Print, Copy)
    document.addEventListener('keydown', function(e) {
        const isInput = isFormElement(e);
        
        // F12 (DevTools)
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Ctrl+U / Cmd+U (View Page Source)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I / Cmd+Option+I (Open DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.keyCode === 73)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+J / Cmd+Option+J (Open DevTools Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J' || e.keyCode === 74)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C' || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+S / Cmd+S (Save Page)
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+P / Cmd+P (Print Page)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+C / Cmd+C (Copy) - Disabled unless in input field
        if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+X / Cmd+X (Cut) - Disabled unless in input field
        if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X' || e.keyCode === 88)) {
            e.preventDefault();
            return false;
        }
    }, false);

})();