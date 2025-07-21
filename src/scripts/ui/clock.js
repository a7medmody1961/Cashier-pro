/*
  File: src/scripts/ui/clock.js
  Version: 1.1
  Description: Manages the live date and time display in the header.
  - (Task 2) Changed time format to use Arabic AM/PM.
*/
export function initClock() {
    const timeDiv = document.getElementById('live-time');
    const dateDiv = document.getElementById('live-date');

    function updateDateTime() {
        if (!timeDiv || !dateDiv) return;
        const now = new Date();
        
        // Time Formatting
        const timeOpts = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
        let timeString = now.toLocaleTimeString('ar-EG', timeOpts);

        // FIX: (Task 2) Replace AM/PM with Arabic equivalent
        timeString = timeString.replace('AM', 'صباحًا').replace('PM', 'مساءً');
        
        // The result from 'ar-EG' is already structured well, no need for complex splits.
        timeDiv.innerHTML = timeString;

        // Date Formatting
        const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDiv.textContent = now.toLocaleDateString('ar-EG', dateOpts);
    }

    setInterval(updateDateTime, 1000);
    updateDateTime();
}
