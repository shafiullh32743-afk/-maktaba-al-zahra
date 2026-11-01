// مكتبہ الزھراء - سادہ سروس ورکر
// ایپ انسٹال ہونے کے لیے ضروری ہے۔ ڈیٹا ہمیشہ انٹرنیٹ سے تازہ آتا ہے،
// تاکہ پرانا ڈیٹا یا پرانے بل نہ دکھیں۔ انٹرنیٹ نہ ہو تو ایک سادہ پیغام نظر آئے گا۔
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