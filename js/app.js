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

    <div class="card-controls">
      <button class="btn-edit" onclick="openQuizEditor(event, '${quiz.id}')">✏️ تعديل</button>
    </div>
  `;

  // Show image if any (non-blocking)
  if (quiz.image) {
    const img = document.createElement('img');
    img.src = quiz.image;
    img.alt = quiz.title;
    img.style.width = '100%';
    img.style.borderRadius = '8px';
    img.style.marginTop = '10px';
    card.appendChild(img);
  }

  return card;
}

function startQuiz(quizId) {
  window.location.href = `quiz.html?id=${quizId}`;
}

// --- Modal utilities ---
function showModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-card">${html}</div>
  `;

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  root.appendChild(backdrop);
}
function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

// --- Edit quiz ---
async function openQuizEditor(event, quizId) {
  event.stopPropagation();
  try {
    const resp = await fetch('data/quizzes.json');
    const data = await resp.json();
    const quiz = (data.quizzes || []).find(q => q.id === quizId);
    if (!quiz) return Swal.fire('خطأ', 'لم يتم العثور على الاختبار', 'error');

    const html = `
      <h2>تعديل الاختبار</h2>
      <form id="quiz-edit-form">
        <div class="form-row">
          <label>العنوان</label>
          <input name="title" type="text" value="${escapeHtml(quiz.title)}" required />
        </div>
        <div class="form-row">
          <label>الوصف</label>
          <textarea name="description" rows="3">${escapeHtml(quiz.description || '')}</textarea>
        </div>
        <div class="form-row">
          <label>الصعوبة</label>
          <select name="difficulty">
            <option ${quiz.difficulty === 'مبتدئ' ? 'selected' : ''}>مبتدئ</option>
            <option ${quiz.difficulty === 'متوسط' ? 'selected' : ''}>متوسط</option>
            <option ${quiz.difficulty === 'متقدم' ? 'selected' : ''}>متقدم</option>
          </select>
        </div>
        <div class="form-row">
          <label>المدة (مثل: "120 دقيقة")</label>
          <input name="duration" type="text" value="${escapeHtml(quiz.duration || '')}" />
        </div>
        <div class="form-row">
          <label>عدد الأسئلة</label>
          <input name="questionCount" type="text" value="${quiz.questionCount || 0}" />
        </div>
        <div class="form-row">
          <label>صورة الاختبار (اختياري)</label>
          <input name="image" type="file" accept="image/*" />
          ${quiz.image ? `<img class="preview-image" src="${quiz.image}" alt="preview" />` : ''}
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
          <button type="submit" class="btn">حفظ التعديلات</button>
        </div>
      </form>
    `;

    showModal(html);

    const form = document.getElementById('quiz-edit-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      try {
        const r = await fetch(`/api/quizzes/${encodeURIComponent(quiz.id)}`, {
          method: 'PUT',
          body: fd
        });
        const j = await r.json();
        if (!j.success) throw new Error(j.message || 'خطأ غير معروف');

        closeModal();
        Swal.fire('تم', 'تم حفظ التعديلات بنجاح', 'success');
        // reload list to reflect changes
        loadQuizzes();
      } catch (err) {
        console.error(err);
        Swal.fire('خطأ', 'فشل حفظ التعديلات. الرجاء المحاولة لاحقاً', 'error');
      }
    });

  } catch (err) {
    console.error(err);
    Swal.fire('خطأ', 'فشل جلب بيانات الاختبار', 'error');
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

document.addEventListener('DOMContentLoaded', loadQuizzes);
