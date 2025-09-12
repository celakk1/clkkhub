document.querySelectorAll(".button").forEach(btn => {
    btn.addEventListener('click', () => {
         window.open(btn.dataset.link, '_blank')
     })
});

function togglesettings() {
    const settings = document.getElementById('settingspanel');

    settings.classList.toggle('active');
    settings.classList.toggle('item-hidden')

    updatemenupanel();
}

function togglechangelog() {
    const changelog = document.getElementById('changelogpanel');

    changelog.classList.toggle('active');
    changelog.classList.toggle('item-hidden')

    updatemenupanel()
}

function updatemenupanel() {
    const settings = document.getElementById('settingspanel');
    const changelog = document.getElementById('changelogpanel');
    const menupanel = document.getElementById('menupanel');

    if (!settings.classList.contains('active') && !changelog.classList.contains('active')) {
        menupanel.classList.remove('active');
    } else {
        menupanel.classList.add('active');
    }
}