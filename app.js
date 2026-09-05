document.addEventListener('DOMContentLoaded', () => {
    const bottomSheet = document.getElementById('bottomSheet');
    const sheetBackdrop = document.getElementById('sheetBackdrop');
    const sheetToggleBtn = document.getElementById('sheetToggleBtn');
    const sheetHandleZone = document.getElementById('sheetHandleZone');
    const activeChannelName = document.getElementById('activeChannelName');
    const channelCards = document.querySelectorAll('.channel-card');

    let isSheetOpen = false;
    let startY = 0;
    let currentY = 0;

    // Toggle Sheet Functionality
    function openSheet() {
        isSheetOpen = true;
        bottomSheet.classList.add('open');
        sheetBackdrop.classList.add('active');
        sheetToggleBtn.setAttribute('aria-expanded', 'true');
        bottomSheet.setAttribute('aria-hidden', 'false');
        if (navigator.vibrate) navigator.vibrate(12);
    }

    function closeSheet() {
        isSheetOpen = false;
        bottomSheet.classList.remove('open');
        sheetBackdrop.classList.remove('active');
        bottomSheet.style.transform = '';
        sheetToggleBtn.setAttribute('aria-expanded', 'false');
        bottomSheet.setAttribute('aria-hidden', 'true');
    }

    sheetToggleBtn.addEventListener('click', openSheet);
    sheetBackdrop.addEventListener('click', closeSheet);

    // Touch Drag Physics for Handle Zone
    sheetHandleZone.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        bottomSheet.style.transition = 'none';
    }, { passive: true });

    sheetHandleZone.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 0) {
            bottomSheet.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });

    sheetHandleZone.addEventListener('touchend', () => {
        bottomSheet.style.transition = '';
        const deltaY = currentY - startY;

        if (deltaY > 120) {
            closeSheet();
        } else {
            bottomSheet.style.transform = 'translateY(0%)';
        }
        startY = 0;
        currentY = 0;
    });

    // Channel Selection Handling
    channelCards.forEach(card => {
        card.addEventListener('click', () => {
            channelCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const selectedChannel = card.dataset.channel;
            activeChannelName.textContent = selectedChannel;
            
            closeSheet();
        });
    });

    // Keyboard ESC key listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isSheetOpen) {
            closeSheet();
        }
    });
});
