# لولو وورد — Gemini + 4 مستخدمين

## الواجهة (GitHub Pages)
ارفع `index.html`, `style.css`, `script.js`, `config.js`, ومجلد `assets` إلى جذر مستودع GitHub. **لا ترفع مفتاح Gemini إلى GitHub أبدًا**.

الاختيارات: أسماء، حماتي، جودي، حبيبة. مستندات كل اسم معزولة حسب الاسم في `localStorage` داخل المتصفح والجهاز **وليست حسابات آمنة**. أي شخص على نفس الجهاز يمكنه الضغط على أي اسم ورؤية مستنداته. لا تتزامن المستندات بين الأجهزة؛ لا تستخدم هذا لبيانات خاصة أو مستندات حساسة.

## ربط Gemini
1. من Google AI Studio أنشئ Gemini API key، لا تشاركه مع أحد.
2. افتح Cloudflare Dashboard > Workers & Pages > Create Worker.
3. استبدل كود Worker بمحتوى `cloudflare-worker/worker.js` وانشره.
4. Worker > Settings > Variables and Secrets: أضف `GEMINI_API_KEY` من نوع **Secret** وأدخل المفتاح هناك فقط.
5. أضف متغير `ALLOWED_ORIGIN` بنوع Text وقيمته `https://USERNAME.github.io` (بدون `/repo/`)؛ بدّل USERNAME باسم حساب GitHub الفعلي.
6. انسخ رابط Worker من Cloudflare ويبدأ بـ `https://...workers.dev` ثم افتح `config.js` وضعه في قيمة `geminiEndpoint` بين علامتي التنصيص.
7. ارفع `config.js` الجديد إلى GitHub، وافتح الموقع بعد النشر واضغط Ctrl+F5.

الملفات داخل مجلد `cloudflare-worker` خاصة بالـ Worker وليست مطلوبة على GitHub Pages.

**الأمان والتكلفة:** لا يعني CORS حماية الخدمة من إساءة الاستخدام؛ أي شخص يعرف رابط Worker يمكنه إرسال طلبات من خارج المتصفح. قبل فتح الموقع للجمهور، أضف مصادقة فعلية وحدود طلبات لكل مستخدم في الخادم. حصة Gemini ليست غير محدودة، ورسائل تجاوز الحصة ممكنة. اشتراك Gemini Pro الشخصي لا يشمل API غير محدود. مستندات النسخة الحالية محلية على كل متصفح وليست حسابات متزامنة.
