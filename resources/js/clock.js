const clock = document.getElementById('clock');

if (clock) {
    clock.setAttribute('role', 'timer');
    clock.setAttribute('aria-live', 'off');
    clock.innerHTML = `
        <span class="clock-status" aria-hidden="true"></span>
        <span class="clock-time"></span>
        <span class="clock-meta"></span>
    `;

    const timeElement = clock.querySelector('.clock-time');
    const metaElement = clock.querySelector('.clock-meta');
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const pad = value => String(value).padStart(2, '0');

    function updateClock() {
        const now = new Date();
        timeElement.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        metaElement.textContent = `${weekdays[now.getDay()]} · ${pad(now.getDate())} ${months[now.getMonth()]} · UTC+8`;
        clock.setAttribute('aria-label', `当前时间 ${pad(now.getHours())}点${pad(now.getMinutes())}分`);
    }

    updateClock();
    window.setInterval(updateClock, 1000);
}
