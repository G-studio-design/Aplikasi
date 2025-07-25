// public/sw.js

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting()); // Activate new service worker as soon as it's installed
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  try {
    const data = event.data.json(); // Correctly parse the JSON payload
    
    const title = data.title || 'Msarch App Notification';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/msarch-logo.png', // Main icon
      badge: '/msarch-logo-badge.png', // Icon for status bar on mobile
      data: {
        url: data.url || '/dashboard', // Store the URL to navigate to on click
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));

  } catch (e) {
    console.error('Error parsing push data:', e);
    // Fallback for plain text notifications if JSON parsing fails
    const title = 'Msarch App Update';
    const options = {
      body: event.data.text(),
      icon: '/msarch-logo.png',
      badge: '/msarch-logo-badge.png',
      data: {
        url: '/dashboard',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if a window for this app is already open.
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});