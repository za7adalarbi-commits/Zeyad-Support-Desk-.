# RENTAL GATE CRM — نظام إدارة خدمة العملاء والحجوزات

نظام CRM متكامل لشركة **Rental Gate** مبني بـ **HTML5 / CSS3 / JavaScript** على **GitHub Pages**، مع **Google Apps Script Web App** كخادم Backend و**Google Sheets** كقاعدة بيانات (12 تبويبًا منظمًا) بدون أي قواعد بيانات خارجية.

---

## هيكل المشروع

```
rental-gate-crm/
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── core.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── reservations.js
│   │   ├── followups.js
│   │   ├── problems.js
│   │   ├── employees.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   └── app.js
│   ├── vendor/
│   │   ├── chart.umd.min.js
│   │   ├── xlsx.full.min.js
│   │   └── jspdf.umd.min.js
│   └── images/
│       └── logo.png
├── google-apps-script/
│   ├── Code.gs
│   ├── Database.gs
│   ├── Auth.gs
│   ├── Reservations.gs
│   ├── FollowUps.gs
│   ├── Problems.gs
│   ├── Employees.gs
│   ├── Reports.gs
│   ├── Settings.gs
│   └── Utils.gs
├── README.md
└── .gitignore
```

---

## خطوات التثبيت والتشغيل الكاملة (18 خطوة عملية)

1. **إنشاء Google Spreadsheet:** أنشئ ملف Google Sheets جديد باسم `RENTAL_GATE_CRM_DB` وانسخ معرف الملف (`SPREADSHEET_ID`) من الرابط.
2. **إعداد التبويبات والأعمدة تلقائيًا:** ستُنشأ جميع التبويبات الـ 12 (`Employees`, `Reservations`, `Extensions`, `Assignments`, `FollowUps`, `Problems`, `ProblemUpdates`, `ActivityLog`, `Notifications`, `Settings`, `Sessions`, `SyncLog`) تلقائيًا عند تشغيل دالة التهيئة.
3. **إنشاء مشروع Google Apps Script:** افتح [script.google.com](https://script.google.com) وأنشئ مشروعًا جديدًا باسم `RentalGateCRM-Backend`.
4. **إضافة ملفات Backend:** انسخ جميع الملفات الـ 10 من مجلد `google-apps-script/` (`Code.gs`, `Database.gs`, `Auth.gs`, `Reservations.gs`, `FollowUps.gs`, `Problems.gs`, `Employees.gs`, `Reports.gs`, `Settings.gs`, `Utils.gs`) إلى المشروع.
5. **إعداد `RG_TOKEN` في Script Properties:** من **Project Settings > Script Properties** أضف:
   - `RG_TOKEN` = التوكن الخاص بواجهة Rental Gate API
6. **إعداد `SPREADSHEET_ID`:** في **Script Properties** أضف:
   - `SPREADSHEET_ID` = معرف ملف Google Sheets
   - (اختياري) `INITIAL_ADMIN_USER` و `INITIAL_ADMIN_PASS`
7. **تشغيل دالة التهيئة:** من محرر Apps Script اختر الدالة `setupRentalGateDatabase` واضغط **Run** ثم امنح الصلاحيات المطلوبة.
8. **إنشاء حساب المدير الأول:** تقوم `setupRentalGateDatabase` تلقائيًا بإنشاء حساب المدير العام الأول (الافتراضي: `admin` / `Admin@123` ما لم تُضبط `INITIAL_ADMIN_USER` و `INITIAL_ADMIN_PASS`) بكلمة مرور مشفرة بـ SHA-256 + Salt.
9. **نشر Apps Script كـ Web App:** اضغط **Deploy > New deployment > Web app**:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
   - انسخ رابط `/exec` الناتج.
10. **ربط رابط `/exec` بالموقع:** افتح شاشة تسجيل الدخول أو صفحة **الإعدادات** في الموقع، الصق رابط `/exec` واضغط **ربط** ثم اختبر الاتصال.
11. **رفع ملفات المشروع على GitHub:** ارفع المشروع كاملًا بما فيه `src/` و`assets/` و`vite.config.ts` ومجلد `.github/workflows/`.
12. **تفعيل GitHub Pages:** من **Settings > Pages** اختر **GitHub Actions** كمصدر للنشر، وليس Deploy from a branch.
13. **تشغيل الموقع:** ادفع التعديلات إلى `main` أو `master` وانتظر نجاح Workflow البناء والنشر؛ سيتم نشر `dist` تلقائيًا.
14. **إضافة حسابات الموظفين:** سجّل الدخول بحساب المدير العام، انتقل إلى **الموظفون > إضافة موظف جديد** وأنشئ حسابات المشرفين وموظفي خدمة العملاء.
15. **اختبار تسجيل الدخول والصلاحيات:** سجّل الدخول بحساب موظف خدمة عملاء وتأكد من تطبيق الصلاحيات من الخادم (منع تعديل الموظفين أو الإعدادات أو سجل النشاطات).
16. **اختبار سحب الحجوزات:** من **الإعدادات > مزامنة بيانات Rental Gate API** اضغط **اختبار الاتصال** ثم **سحب الحجوزات الآن** وتحقق من ظهور البيانات في Google Sheets وفي صفحة **الحجوزات**.
17. **اختبار المتابعات المتزامنة:** افتح حجزًا، أسنده لأكثر من موظف، وأضف متابعات من حسابين مختلفين للتحقق من حفظ كل متابعة كسجل مستقل وعدم تعارض الكتابة (`LockService`).
18. **اختبار التقارير والتصدير:** انتقل إلى **التقارير والإحصائيات** واختبر التصدير بصيغة **Excel (.xlsx)** و**PDF (RTL)** وتصدير **PDF الفردي** من داخل تفاصيل الحجز.


## مهم: النشر الصحيح على GitHub Pages

لا تنشر ملفات المشروع الخام من جذر المستودع. الواجهة تستخدم Tailwind utilities داخل قوالب JavaScript، ولذلك يجب تشغيل Vite حتى يتم توليد CSS النهائي. ملف GitHub Actions الموجود في `.github/workflows/deploy.yml` ينفذ البناء وينشر مجلد `dist` تلقائيًا عند كل Push إلى `main` أو `master`.

1. ارفع هذه الملفات إلى المستودع `za7adalarbi-commits/RENT-CRM`، مع مجلد `.github/workflows/`.
2. من GitHub افتح **Settings → Pages**.
3. غيّر **Build and deployment → Source** إلى **GitHub Actions** (وليس Deploy from a branch).
4. ادفع التعديلات إلى `main` أو `master`، ثم راقب **Actions** حتى تنجح مهمتا Build وDeploy.
5. افتح `https://za7adalarbi-commits.github.io/RENT-CRM/` بعد اكتمال النشر.

تم ضبط Vite على `base: '/RENT-CRM/'` لأن المستودع يُنشر داخل مسار فرعي. كما تم تحديد مصادر Tailwind صراحةً لتشمل `assets/js` حيث تُنشأ عناصر الواجهة.
