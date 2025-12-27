import express from 'express';
import multer from 'multer';
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

// Multer setup for file uploads
const uploadDir = path.join(__dirname, 'data', 'uploads');
await fs.mkdir(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

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

// API: update quiz
app.put('/api/quizzes/:id', upload.single('image'), async (req, res) => {
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

    if (req.file) {
      // store a relative URL to the uploaded file
      quizzes[idx].image = `data/uploads/${req.file.filename}`;
    }

    await writeJson(QUIZZES_PATH, { quizzes });

    return res.json({ success: true, quiz: quizzes[idx] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API: update question
app.put('/api/questions/:quizId/:questionId', upload.single('image'), async (req, res) => {
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
        // options might come as JSON string
        if (f === 'options') {
          try {
            questions[qIdx].options = JSON.parse(req.body.options);
          } catch (e) {
            // fallback to raw string
            questions[qIdx].options = req.body.options;
          }
        } else {
          questions[qIdx][f] = req.body[f];
        }
      }
    });

    if (req.file) {
      questions[qIdx].image = `data/uploads/${req.file.filename}`;
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
