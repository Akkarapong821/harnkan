const status = document.getElementById('offline-status');
const installButton = document.getElementById('install-app');
const updateButton = document.getElementById('update-app');
let installPrompt;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null; installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { installPrompt = null; installButton.hidden = true; });

if ('serviceWorker' in navigator && window.isSecureContext) {
  let reloadForUpdate = false;
  function ready() {
    if (!navigator.serviceWorker.controller) return;
    status.textContent = navigator.onLine ? 'พร้อมใช้งานออฟไลน์' : 'กำลังใช้งานออฟไลน์';
    status.dataset.ready = 'true';
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadForUpdate) location.reload(); else ready();
  });
  window.addEventListener('online', ready);
  window.addEventListener('offline', ready);
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(registration => {
    function offerUpdate() { updateButton.hidden = !registration.waiting; }
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') offerUpdate();
        if (worker.state === 'redundant' && !navigator.serviceWorker.controller) status.textContent = 'ยังไม่พร้อมออฟไลน์ ลองเปิดใหม่เมื่อมีเน็ต';
      });
    });
    updateButton.addEventListener('click', () => {
      if (registration.waiting) { reloadForUpdate = true; registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' }); }
    });
    return navigator.serviceWorker.ready;
  }).then(ready).catch(() => {
    if (navigator.serviceWorker.controller) ready();
    else status.textContent = 'เบราว์เซอร์นี้ยังเก็บแอปออฟไลน์ไม่ได้';
  });
  ready();
} else {
  status.textContent = 'เปิดด้วย Safari หรือ Chrome เพื่อเตรียมใช้งานออฟไลน์';
}
