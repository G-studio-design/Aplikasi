
// public/sw.js

self.addEventListener('push', (event) => {
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // If parsing fails, try as text
    const dataText = event.data.text();
    console.warn('[SW] Push data was not JSON, received as text:', dataText);
    payload = {
      title: 'Msarch App Notification',
      body: dataText || 'You have a new update.',
      data: { url: '/dashboard' }
    };
  }

  const { title, body, data } = payload;
  
  const options = {
    body: body,
    icon: '/msarch-logo-192.png',
    badge: '/msarch-logo-72.png',
    data: {
      url: data?.url || '/dashboard',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    // Check if any of the open clients are the same as the notification URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // Normalize URLs by removing trailing slashes before comparing
      const clientUrl = client.url.endsWith('/') ? client.url.slice(0, -1) : client.url;
      const notificationUrl = urlToOpen.endsWith('/') ? urlToOpen.slice(0, -1) : urlToOpen;

      if (clientUrl === notificationUrl) {
        matchingClient = client;
        break;
      }
    }

    // If we found a matching client, focus it
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      // If no matching client was found, open a new one
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
