
// /public/sw.js

self.addEventListener('install', (event) => {
  console.log('Service Worker: Install in progress...');
  event.waitUntil(self.skipWaiting()); // Force activation
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation complete.');
  event.waitUntil(self.clients.claim()); // Take control of all clients
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received.');
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
      icon: '/msarch-logo-192.png', // Main icon
      badge: '/msarch-logo-72.png', // Badge for smaller UI areas
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };

    const promiseChain = self.registration.showNotification(title, options);
    event.waitUntil(promiseChain);

  } catch (e) {
    console.error('Service Worker: Error processing push event data.', e);
  }
});


self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  console.log(`Service Worker: Attempting to navigate to or focus: ${urlToOpen}`);

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // Looser check: if the origin matches, it's a potential candidate.
      if (new URL(client.url).origin === new URL(urlToOpen).origin) {
        matchingClient = client;
        break; // Found a matching client, no need to look further.
      }
    }

    if (matchingClient) {
      console.log('Service Worker: Matching client found, focusing and navigating...');
      return matchingClient.focus().then((client) => {
        // Post message to the client to navigate internally
        client.postMessage({
          type: 'navigate',
          url: urlToOpen,
        });
      });
    } else {
      console.log('Service Worker: No matching client found, opening new window.');
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
