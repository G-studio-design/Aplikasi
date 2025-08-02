// public/sw.js

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('[SW] Push event but no data');
    return;
  }

  try {
    // Always parse as text first, as this is the most reliable method
    const data = JSON.parse(event.data.text());
    console.log('[SW] Push received:', data);

    const title = data.title || 'Msarch App';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/msarch-logo.png?v=5',
      badge: '/msarch-logo.png?v=5',
      data: {
        url: data.url || data.data?.url || '/', // Support both flat and nested data structures
      },
    };
    
    event.waitUntil(self.registration.showNotification(title, options));

  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
    // Fallback notification for robustness
    const title = 'Msarch App';
    const options = {
      body: 'You have a new update.',
      icon: '/msarch-logo.png?v=5',
      badge: '/msarch-logo.png?v=5',
      data: {
        url: '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      let clientIsFocused = false;

      // Find a matching client and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          client.focus();
          clientIsFocused = true;
          break;
        }
      }

      // If no exact match was found, try to find any app tab and navigate
      if (!clientIsFocused && windowClients.length > 0) {
        windowClients[0].navigate(urlToOpen).then((client) => {
          if (client && "focus" in client) {
            client.focus();
          }
        });
        clientIsFocused = true;
      }
      
      // If no client was focused (or found), open a new one
      if (!clientIsFocused) {
        clients
          .openWindow(urlToOpen)
          .then((client) => (client ? client.focus() : null));
      }
    });

  event.waitUntil(promiseChain);
});
