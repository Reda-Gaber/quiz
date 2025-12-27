let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let currentQuizId = null;

async function loadQuiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');
  currentQuizId = quizId;

  if (!quizId) {
    showError('لم يتم تحديد الاختبار');
    return;
  }

  try {
    const response = await fetch('data/questions.json');

    if (!response.ok) {
      throw new Error('فشل تحميل الاختبار');
    }

    const allQuizzes = await response.json();
    quizData = allQuizzes[quizId];

    if (!quizData) {
      throw new Error('الاختبار غير موجود');
    }

    document.getElementById('quiz-title').textContent = quizData.title;
    document.title = quizData.title;

    showQuestion();

  } catch (error) {
    console.error('Error loading quiz:', error);
    showError('حدث خطأ أثناء تحميل الاختبار. يرجى المحاولة مرة أخرى.');
  }
}

function showQuestion() {
  const quizView = document.getElementById('quiz-view');
  const question = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // عدد الأسئلة التي أجاب عليها المستخدم حتى الآن
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] !== undefined).length;

  let optionsHTML = '';

  if (question.type === 'true_false') {
    optionsHTML = `
      <div class="options-container">
        <div class="option ${userAnswers[question.id] === 'true' ? 'selected' : ''}"
             onclick="selectAnswer(${question.id}, 'true')">
          صحيح
        </div>
        <div class="option ${userAnswers[question.id] === 'false' ? 'selected' : ''}"
             onclick="selectAnswer(${question.id}, 'false')">
          خطأ
        </div>
      </div>
    `;
  } else if (question.type === 'multiple_choice') {
    optionsHTML = '<div class="options-container">';
    question.options.forEach((option, index) => {
      const isSelected = userAnswers[question.id] === index;
      optionsHTML += `
        <div class="option ${isSelected ? 'selected' : ''}"
             onclick="selectAnswer(${question.id}, ${index})">
          ${option}
        </div>
      `;
    });
    optionsHTML += '</div>';
  }

  quizView.innerHTML = `
    <div class="progress-bar">
      <div class="progress-text">
        السؤال ${currentQuestionIndex + 1} من ${totalQuestions} — مجيب: ${answeredCount}
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>

    <div class="question-card">
      <div class="question-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>السؤال ${currentQuestionIndex + 1}</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="btn btn-edit" onclick="openQuestionEditor(event, ${question.id})">✏️ تعديل</button>
        </div>
      </div>

      <div class="question-text">${question.question}</div>
      ${question.image ? `<img src="${question.image}" alt="question-image" class="preview-image" />` : ''}

      ${optionsHTML}
    </div>

    <div class="navigation">
      <button class="btn btn-secondary" onclick="previousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
        السابق
      </button>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn" onclick="nextQuestion()">
          ${currentQuestionIndex === totalQuestions - 1 ? 'إنهاء الاختبار' : 'التالي'}
        </button>
        <button class="btn btn-danger" onclick="endQuizEarly()" title="إنهاء الاختبار وحساب الدرجة حتى هذه اللحظة">
          إنهاء الاختبار
        </button>
      </div>
    </div>
  `;
}

function selectAnswer(questionId, answer) {
  userAnswers[questionId] = answer;
  showQuestion();
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion();
  }
}

function nextQuestion() {
  const totalQuestions = quizData.questions.length;

  if (currentQuestionIndex < totalQuestions - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    // إذا كان آخر سؤال، اعرض النتائج عن طريقة الحساب الطبيعي (كل الأسئلة)
    showResults();
  }
}

function endQuizEarly() {
  // إنهاء الاختبار الآن وحساب الدرجة بناءً على الإجابات التي تم إدخالها فقط
  showResults({ answeredOnly: true });
}

function showResults(options = {}) {
  // options.answeredOnly: إذا كانت true فسنحسب النتيجة بناءً على الإجابات المقدمة فقط
  const answeredOnly = !!options.answeredOnly;

  const quizView = document.getElementById('quiz-view');
  const resultView = document.getElementById('result-view');

  let correctCount = 0;
  let wrongCount = 0;
  const totalQuestions = quizData.questions.length;

  // الأسئلة التي سنأخذها بالحسبان عند حساب النتيجة
  const consideredQuestions = answeredOnly
    ? quizData.questions.filter(q => userAnswers[q.id] !== undefined)
    : quizData.questions;

  // حساب النتائج، لكن إعداد مراجعة كاملة لكل الأسئلة لعرضها لاحقاً
  const results = quizData.questions.map(question => {
    const userAnswer = userAnswers[question.id];
    let isCorrect = false;

    if (userAnswer !== undefined) {
      if (question.type === 'true_false') {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === 'multiple_choice') {
        isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) correctCount++;
      else wrongCount++;
    } else {
      // غير مُجاب عنه
      if (!answeredOnly) wrongCount++; // إذا كنا نحسب على كامل الأسئلة اعتبره خاطئاً
    }

    return {
      question: question,
      userAnswer: userAnswer,
      isCorrect: isCorrect
    };
  });

  const totalConsidered = consideredQuestions.length;

  if (answeredOnly && totalConsidered === 0) {
    resultView.innerHTML = `
      <div class="error">لم تجب على أي سؤال. لا يمكن حساب النتيجة.</div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="index.html" class="btn">العودة إلى القائمة الرئيسية</a>
      </div>
    `;

    quizView.style.display = 'none';
    resultView.style.display = 'block';
    return;
  }

  const denom = answeredOnly ? totalConsidered : totalQuestions;
  const scorePercentage = denom === 0 ? 0 : Math.round((correctCount / denom) * 100);

  let message = '';
  if (scorePercentage >= 90) {
    message = 'ممتاز! أداء رائع';
  } else if (scorePercentage >= 70) {
    message = 'جيد جداً! استمر في التقدم';
  } else if (scorePercentage >= 50) {
    message = 'جيد، يمكنك تحسين أدائك';
  } else {
    message = 'يحتاج إلى مزيد من المراجعة';
  }

  let reviewHTML = '<div class="review-section"><h2>مراجعة الإجابات</h2>';

  results.forEach((result, index) => {
    const question = result.question;
    let userAnswerText = '';
    let correctAnswerText = '';

    if (question.type === 'true_false') {
      userAnswerText = result.userAnswer === 'true' ? 'صحيح' : result.userAnswer === 'false' ? 'خطأ' : 'لم يتم الإجابة';
      correctAnswerText = question.correctAnswer === 'true' ? 'صحيح' : 'خطأ';
    } else if (question.type === 'multiple_choice') {
      userAnswerText = result.userAnswer !== undefined ? question.options[result.userAnswer] : 'لم يتم الإجابة';
      correctAnswerText = question.options[question.correctAnswer];
    }

    reviewHTML += `
      <div class="review-question ${result.isCorrect ? 'correct' : 'wrong'}">
        <div class="review-question-text">
          ${index + 1}. ${question.question}
        </div>
        <div class="review-answer ${result.isCorrect ? 'correct-answer' : 'wrong-answer'}">
          <span class="answer-label">إجابتك:</span> ${userAnswerText}
        </div>
        ${!result.isCorrect ? `
          <div class="review-answer correct-answer">
            <span class="answer-label">الإجابة الصحيحة:</span> ${correctAnswerText}
          </div>
        ` : ''}
      </div>
    `;
  });

  reviewHTML += '</div>';

  resultView.innerHTML = `
    <div class="result-card">
      <h1>نتيجة الاختبار</h1>
      <div class="result-score">${scorePercentage}%</div>
      <div class="result-message">${message}</div>

      <div class="result-stats">
        <div class="stat-item stat-correct">
          <div class="stat-value">${correctCount}</div>
          <div class="stat-label">إجابات صحيحة</div>
        </div>
        <div class="stat-item stat-wrong">
          <div class="stat-value">${wrongCount}</div>
          <div class="stat-label">إجابات خاطئة</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${answeredOnly ? totalConsidered : totalQuestions}</div>
          <div class="stat-label">${answeredOnly ? 'الأسئلة المأخوذة بالحسبان' : 'إجمالي الأسئلة'}</div>
        </div>
      </div>

      <div style="margin-top: 30px;">
        <a href="index.html" class="btn">العودة إلى القائمة الرئيسية</a>
      </div>
    </div>

    ${reviewHTML}
  `;

  quizView.style.display = 'none';
  resultView.style.display = 'block';
}

// --- Question edit modal ---
function showModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<div class="modal-card">${html}</div>`;

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) root.innerHTML = '';
  });

  root.appendChild(backdrop);
}

function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

async function openQuestionEditor(event, questionId) {
  event.stopPropagation();
  if (!quizData) return Swal.fire('خطأ', 'لم يتم تحميل الاختبار بعد', 'error');

  const question = quizData.questions.find(q => String(q.id) === String(questionId));
  if (!question) return Swal.fire('خطأ', 'لم يتم العثور على السؤال', 'error');

  const html = `
    <h2>تعديل السؤال</h2>
    <form id="question-edit-form">
      <div class="form-row">
        <label>نص السؤال</label>
        <textarea name="question" rows="3" required>${escapeHtml(question.question || '')}</textarea>
      </div>
      <div class="form-row">
        <label>النوع</label>
        <select name="type">
          <option ${question.type === 'true_false' ? 'selected' : ''} value="true_false">صواب/خطأ</option>
          <option ${question.type === 'multiple_choice' ? 'selected' : ''} value="multiple_choice">اختيار من متعدد</option>
        </select>
      </div>
      <div class="form-row" id="options-row" style="display: ${question.type === 'multiple_choice' ? 'block' : 'none'};">
        <label>الخيارات (واحد في كل سطر)</label>
        <textarea name="options">${question.options ? question.options.join('\n') : ''}</textarea>
      </div>
      <div class="form-row">
        <label>الإجابة الصحيحة (index للخيارات أو "true"/"false")</label>
        <input name="correctAnswer" type="text" value="${escapeHtml(question.correctAnswer)}" />
      </div>
      <div class="form-row">
        <label>صورة السؤال (اختياري)</label>
        <input name="image" type="file" accept="image/*" />
        ${question.image ? `<img class="preview-image" src="${question.image}" alt="preview" />` : ''}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button type="submit" class="btn">حفظ</button>
      </div>
    </form>
  `;

  showModal(html);

  // show/hide options textarea when type changes
  const form = document.getElementById('question-edit-form');
  const typeSelect = form.querySelector('select[name="type"]');
  const optionsRow = document.getElementById('options-row');
  typeSelect.addEventListener('change', () => {
    optionsRow.style.display = typeSelect.value === 'multiple_choice' ? 'block' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    // If options textarea present, send as JSON string
    const optionsTextarea = form.querySelector('textarea[name="options"]');
    if (optionsTextarea) {
      const opts = optionsTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
      fd.set('options', JSON.stringify(opts));
    }

    try {
      const r = await fetch(`/api/questions/${encodeURIComponent(currentQuizId)}/${encodeURIComponent(questionId)}`, {
        method: 'PUT',
        body: fd
      });

      const j = await r.json();
      if (!j.success) throw new Error(j.message || 'خطأ في الخادم');

      // Update in-memory quizData then re-render
      const idx = quizData.questions.findIndex(q => String(q.id) === String(questionId));
      if (idx !== -1) {
        quizData.questions[idx] = j.question;
      }

      closeModal();
      Swal.fire('تم', 'تم حفظ التعديلات على السؤال', 'success');
      showQuestion();

    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل حفظ التعديلات. الرجاء المحاولة لاحقاً', 'error');
    }
  });
}

function showError(message) {
  const quizView = document.getElementById('quiz-view');
  quizView.innerHTML = `
    <div class="error">${message}</div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="index.html" class="btn">العودة إلى القائمة الرئيسية</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadQuiz);
