# منصة الاختبارات التعليمية

منصة اختبارات تفاعلية بسيطة وسهلة الاستخدام مع دعم كامل للغة العربية وتخطيط RTL.

## المميزات

- ✅ واجهة بسيطة ونظيفة مناسبة للطلاب
- ✅ دعم كامل للغة العربية مع تخطيط RTL
- ✅ دعم أسئلة الصواب والخطأ والاختيار من متعدد
- ✅ عرض سؤال واحد في كل شاشة
- ✅ أزرار التنقل (التالي / السابق)
- ✅ مؤشر التقدم
- ✅ صفحة نتائج شاملة مع مراجعة الإجابات
- ✅ تصميم متجاوب (موبايل + سطح المكتب)
- ✅ بدون إطار عمل - HTML, CSS, JavaScript نقي

## البنية

```
project/
├── index.html           # صفحة قائمة الاختبارات
├── quiz.html            # صفحة الاختبار والنتائج
├── css/
│   └── style.css        # ملف التنسيقات
├── js/
│   ├── app.js           # منطق قائمة الاختبارات
│   └── quiz.js          # منطق الاختبار والنتائج
└── data/
    ├── quizzes.json     # قائمة الاختبارات المتاحة
    └── questions.json   # أسئلة جميع الاختبارات
```

## إضافة اختبارات جديدة

### 1. إضافة الاختبار إلى قائمة الاختبارات

عدّل ملف `data/quizzes.json`:

```json
{
  "quizzes": [
    {
      "id": "unique-quiz-id",
      "title": "عنوان الاختبار",
      "description": "وصف الاختبار",
      "questionCount": 5,
      "duration": "10 دقائق",
      "difficulty": "متوسط"
    }
  ]
}
```

### 2. إضافة أسئلة الاختبار

عدّل ملف `data/questions.json`:

```json
{
  "unique-quiz-id": {
    "quizId": "unique-quiz-id",
    "title": "عنوان الاختبار",
    "questions": [
      {
        "id": 1,
        "type": "true_false",
        "question": "نص السؤال؟",
        "correctAnswer": "true"
      },
      {
        "id": 2,
        "type": "multiple_choice",
        "question": "نص السؤال؟",
        "options": [
          "الخيار الأول",
          "الخيار الثاني",
          "الخيار الثالث",
          "الخيار الرابع"
        ],
        "correctAnswer": 2
      }
    ]
  }
}
```

**ملاحظة:** في أسئلة الاختيار من متعدد، `correctAnswer` هو رقم الخيار الصحيح (يبدأ من 0).

## النشر على GitHub Pages

1. قم برفع المشروع إلى مستودع GitHub
2. اذهب إلى Settings > Pages
3. اختر المصدر: Deploy from a branch
4. اختر الفرع: main (أو master) والمجلد: / (root)
5. احفظ التغييرات
6. سيتم نشر الموقع على: `https://username.github.io/repository-name/`

## التشغيل محلياً

يمكنك تشغيل المشروع محلياً باستخدام أي خادم ويب بسيط:

### باستخدام Python:
```bash
python -m http.server 8000
```

### باستخدام Node.js (http-server):
```bash
npx http-server
```

### باستخدام VS Code:
قم بتثبيت إضافة "Live Server" وانقر بزر الماوس الأيمن على index.html واختر "Open with Live Server"

ثم افتح المتصفح على `http://localhost:8000`

## التقنيات المستخدمة

- HTML5
- CSS3 (مع دعم RTL)
- JavaScript (Vanilla)
- JSON (لتخزين البيانات)

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.
# quiz
