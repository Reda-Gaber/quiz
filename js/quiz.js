let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = {};

async function loadQuiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

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
      <div class="question-header">السؤال ${currentQuestionIndex + 1}</div>
      <div class="question-text">${question.question}</div>
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
