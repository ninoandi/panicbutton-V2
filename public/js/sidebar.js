document.addEventListener('DOMContentLoaded', function () {

    const quickMessage = document.getElementById('quick-message');

    if (!quickMessage) {
        return;
    }

    quickMessage.addEventListener('click', function (e) {
        e.preventDefault();

        // buka modal Quick Message
        const modal = document.getElementById('quickMessageModal');

        if (modal) {
            modal.style.display = 'flex';
        }
    });

});