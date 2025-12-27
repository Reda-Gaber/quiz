async function loadQuizzes() {
  const quizListContainer = document.getElementById('quiz-list');

  try {
    const response = await fetch('data/quizzes.json');

    if (!response.ok) {
      throw new Error('فشل تحميل الاختبارات');
    }

    const data = await response.json();
    const quizzes = data.quizzes;

    if (!quizzes || quizzes.length === 0) {
      quizListContainer.innerHTML = '<div class="error">لا توجد اختبارات متاحة حالياً</div>';
      return;
    }

    quizListContainer.innerHTML = '';

    quizzes.forEach(quiz => {
      const quizCard = createQuizCard(quiz);
      quizListContainer.appendChild(quizCard);
    });

  } catch (error) {
    console.error('Error loading quizzes:', error);
    quizListContainer.innerHTML = '<div class="error">حدث خطأ أثناء تحميل الاختبارات. يرجى المحاولة مرة أخرى.</div>';
  }
}

function createQuizCard(quiz) {
  const card = document.createElement('div');
  card.className = 'quiz-card';
  card.onclick = () => startQuiz(quiz.id);

  const difficultyClass = {
    'مبتدئ': 'badge-easy',
    'متوسط': 'badge-medium',
    'متقدم': 'badge-hard'
  }[quiz.difficulty] || 'badge-medium';

  card.innerHTML = `
    <h2>${quiz.title}</h2>
    <p>${quiz.description}</p>
    <div class="quiz-meta">
      <div class="meta-item">
        <span>📝</span>
        <span>${quiz.questionCount} سؤال</span>
      </div>
      <div class="meta-item">
        <span>⏱️</span>
        <span>${quiz.duration}</span>
      </div>
    </div>
    <span class="badge ${difficultyClass}">${quiz.difficulty}</span>
  `;

  return card;
}

function startQuiz(quizId) {
  window.location.href = `quiz.html?id=${quizId}`;
}

document.addEventListener('DOMContentLoaded', loadQuizzes);
