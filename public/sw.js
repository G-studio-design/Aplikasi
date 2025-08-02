'use strict';

self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');

  let data;
  try {
    // We need to handle the payload as text first, then parse it as JSON.
    const VAPID_PAYLOAD_TEXT = event.data.text();
    data = JSON.parse(VAPID_PAYLOAD_TEXT);
    console.log('[Service Worker] Push data parsed:', data);
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data:', e);
    // Fallback notification if parsing fails
    data = {
      notification: {
        title: 'New Notification',
        body: 'You have a new update.',
        data: {
          url: '/'
        }
      }
    };
  }
  
  const { notification: notificationData } = data;

  if (!notificationData) {
      console.error("[Service Worker] 'notification' object not found in push data.");
      return;
  }

  const title = notificationData.title || 'Msarch App';
  const options = {
    body: notificationData.body || 'You have a new notification.',
    icon: '/msarch-logo.png', // Main app icon
    badge: '/msarch-logo-badge.png', // A smaller, monochrome icon for the status bar
    vibrate: [200, 100, 200], // Vibration pattern
    tag: 'msarch-notification', // Groups notifications
    renotify: true, // Allows replacing old notifications
    data: {
      url: notificationData.data.url || '/' // The URL to open on click
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(function (windowClients) {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      console.log('[Service Worker] Found an existing tab, focusing it.');
      return matchingClient.focus();
    } else {
      console.log('[Service Worker] No existing tab found, opening a new one.');
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
