/* RESHAPE — Service Worker
   وظيفته الوحيدة: استقبال إشعارات Web Push وعرضها، وفتح التطبيق عند الضغط.
   لا يوجد أي تخزين مؤقت (cache) ولا اعتراض للطلبات — فلا يمكن أن يعرض نسخة قديمة من الموقع. */

const SW_VERSION = 'reshape-push-1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

/* رسالة من الصفحة: تحديث فوري */
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (err) {
    try { d = { title: 'RESHAPE', body: event.data.text() }; } catch (e2) { d = {}; }
  }
  const title = d.title || 'RESHAPE';
  const opts = {
    body: d.body || '',
    icon: d.icon || '/icon-192.png',
    badge: d.badge || '/icon-192.png',
    tag: d.tag || 'reshape',
    renotify: true,
    dir: 'rtl',
    lang: 'ar',
    data: { url: d.url || '/', kind: d.kind || '' },
    vibrate: d.kind === 'pain' ? [200, 90, 200, 90, 200] : [120, 60, 120],
    requireInteraction: d.kind === 'pain'
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', event => {
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

/* تجديد الاشتراك تلقائياً إذا أبطله المتصفح */
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(sub => self.clients.matchAll({ includeUncontrolled: true }).then(list => {
        list.forEach(c => c.postMessage({ type: 'resubscribe', sub: sub.toJSON() }));
      }))
      .catch(() => {})
  );
});
