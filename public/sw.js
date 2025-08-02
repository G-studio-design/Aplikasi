// public/sw.js
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      // Always parse the data as text first, then parse as JSON
      data = JSON.parse(event.data.text());
    } catch (e) {
      console.error("Failed to parse push data:", e);
      // Fallback for plain text notifications
      data = { title: "New Notification", body: event.data.text() };
    }
  }

  const title = data.title || "Msarch App";
  const options = {
    body: data.body || "You have a new update.",
    icon: "/msarch-logo.png?v=5",
    badge: "/msarch-logo.png?v=5",
    vibrate: [100, 50, 100],
    data: {
      url: data.data?.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a tab open with the target URL
        for (const client of clientList) {
          // Use URL objects for robust comparison
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.location.origin);

          if (clientUrl.pathname === targetUrlObj.pathname && "focus" in client) {
            return client.focus();
          }
        }
        // If no tab is found, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
