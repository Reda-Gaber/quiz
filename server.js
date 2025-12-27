import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/data/uploads', express.static(path.join(__dirname, 'data', 'uploads')));
app.use(express.static(path.join(__dirname)));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'data', 'uploads');
await fs.mkdir(uploadDir, { recursive: true });

const QUIZZES_PATH = path.join(__dirname, 'data', 'quizzes.json');
const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}
async function writeJson(filePath, data) {
  const text = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, text, 'utf-8');
}

// helper: save base64 data URL string to a file, return relative path
async function saveBase64Image(dataUrl, prefix = 'image') {
  const m = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];
  const ext = mime.split('/')[1].split('+')[0];
  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, Buffer.from(b64, 'base64'));
  return `data/uploads/${filename}`;
}

// API: update quiz (accepts JSON body; imageData is optional base64 data URL)
app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const quizId = req.params.id;
    const quizzesData = await readJson(QUIZZES_PATH);
    const quizzes = quizzesData.quizzes || [];

    const idx = quizzes.findIndex(q => q.id === quizId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Build updated object from body; only allowed fields will be updated
    const allowed = ['title', 'description', 'difficulty', 'duration', 'questionCount'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) quizzes[idx][f] = req.body[f];
    });

    if (req.body.imageData) {
      const saved = await saveBase64Image(req.body.imageData, 'quiz');
      if (saved) quizzes[idx].image = saved;
    }

    await writeJson(QUIZZES_PATH, { quizzes });

    return res.json({ success: true, quiz: quizzes[idx] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API: update question (accepts JSON body; imageData is optional base64 data URL)
app.put('/api/questions/:quizId/:questionId', async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    const qData = await readJson(QUESTIONS_PATH);

    const quiz = qData[quizId];
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const questions = quiz.questions || [];
    const qIdx = questions.findIndex(q => String(q.id) === String(questionId));
    if (qIdx === -1) return res.status(404).json({ success: false, message: 'Question not found' });

    const allowed = ['question', 'type', 'correctAnswer', 'options'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'options') {
          let opts = req.body.options;
          if (typeof opts === 'string') {
            try { opts = JSON.parse(opts); } catch (e) { opts = opts.split('\n').map(s => s.trim()).filter(Boolean); }
          }
          questions[qIdx].options = opts;
        } else {
          questions[qIdx][f] = req.body[f];
        }
      }
    });

    if (req.body.imageData) {
      const saved = await saveBase64Image(req.body.imageData, 'question');
      if (saved) questions[qIdx].image = saved;
    }

    // write back
    qData[quizId] = quiz;
    await writeJson(QUESTIONS_PATH, qData);

    return res.json({ success: true, question: questions[qIdx] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Simple helper endpoints for convenience
app.get('/api/quizzes', async (req, res) => {
  const data = await readJson(QUIZZES_PATH);
  res.json(data);
});

app.get('/api/questions', async (req, res) => {
  const data = await readJson(QUESTIONS_PATH);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
