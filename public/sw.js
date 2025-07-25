
// public/sw.js

// This event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  // skipWaiting() forces the waiting service worker to become the
  // active service worker.
  event.waitUntil(self.skipWaiting());
  console.log('Service Worker: Installed');
});

// This event is fired when the service worker is activated.
self.addEventListener('activate', (event) => {
  // clients.claim() allows an active service worker to set itself as the
  // controller for all clients within its scope.
  event.waitUntil(self.clients.claim());
  console.log('Service Worker: Activated');
});

// This event is fired when a push message is received.
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');
  if (!event.data) {
    console.error('Service Worker: Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Service Worker: Push data parsed:', data);

    const title = data.title || 'Msarch App Notification';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/msarch-logo.png', // Main icon for the notification
      badge: '/msarch-logo-badge.png', // Small icon for status bar
      data: {
        url: data.data?.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Service Worker: Error processing push data', e);
  }
});

// This event is fired when a user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click Received.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = self.clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        console.log(`Service Worker: Found active client, focusing and navigating to ${urlToOpen}`);
        return client.focus().then(c => c.navigate(urlToOpen));
      }
      console.log(`Service Worker: No active client found, opening new window to ${urlToOpen}`);
      return self.clients.openWindow(urlToOpen);
    });

  event.waitUntil(promiseChain);
});
