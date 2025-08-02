
self.addEventListener('push', event => {
    console.log('[Service Worker] Push Received.');
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        console.error('[Service Worker] Push event but no data');
        data = {
            title: 'Notifikasi Baru',
            body: 'Anda memiliki pembaruan baru.',
            url: '/'
        };
    }

    const title = data.title || 'Notifikasi Msarch';
    const options = {
        body: data.body || 'Ada pembaruan untuk Anda.',
        icon: '/msarch-logo.png',
        badge: '/msarch-logo.png',
        data: {
            url: data.url || '/dashboard'
        }
    };

    const notificationPromise = self.registration.showNotification(title, options);
    event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();
    
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((clientList) => {
        if (clientList.length > 0) {
            let client = clientList[0];
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].focused) {
                    client = clientList[i];
                }
            }
            console.log('[Service Worker] App window found, focusing and navigating.');
            return client.focus().then(cli => cli.navigate(urlToOpen));
        }
        console.log('[Service Worker] No app window found, opening new one.');
        return clients.openWindow(urlToOpen);
    });

    event.waitUntil(promiseChain);
});
