// مكتبہ الزھراء - سروس ورکر
// 1) ایپ انسٹال ہونے کے لیے ضروری ہے
// 2) ڈیٹا ہمیشہ انٹرنیٹ سے تازہ آتا ہے، انٹرنیٹ نہ ہو تو سادہ پیغام نظر آتا ہے
// 3) نئے آرڈر کی اطلاع (نوٹیفکیشن) دکھاتا ہے
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="ur" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>انٹرنیٹ نہیں ہے</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#334155;text-align:center"><div><h2>انٹرنیٹ دستیاب نہیں</h2><p>براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔</p></div></body></html>',
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        )
    )
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "مكتبہ الزھراء", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      dir: "rtl",
      lang: "ur",
      data: { url: data.url || "/orders" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/orders";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});