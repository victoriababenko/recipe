const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
const fileUpload = require('express-fileupload');
app.use(fileUpload());


const DB_PATH = path.join(__dirname, 'db/db.json');

// === Статичні файли ===
app.use(express.static(path.join(__dirname, 'public')));

// === API: статус сервера ===
app.get('/api/status', (req, res) => {
  res.json({ status: 'Сервер працює!' });
});

// === API: новини ===
app.get('/api/news', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  res.json(db.news || []);
});

// === API: категорії ===
app.get('/api/categories', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  res.json(db.categories || []);
});

// === API: користувачі ===
app.get('/api/users', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  res.json(db.users || []);
});

app.post('/api/users', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  const { username, password } = req.body;
  const id = Date.now();
  const user = { id, username, password };

  db.users.push(user);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const userId = parseInt(req.params.id);
  const updatedData = req.body;

  if (!updatedData.username || updatedData.username.trim() === '') {
    return res.status(400).json({ error: 'Імʼя користувача не може бути порожнім' });
  }

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }

  db.users[userIndex].username = updatedData.username;
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  res.json(db.users[userIndex]);
});

// === API: рецепти ===
app.get('/api/recipes', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  res.json(db.recipes || []);
});

app.post('/api/recipes', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const { title, ingredients, instructions, restrictions, userId } = req.body;
  const id = Date.now();
  let image = '';

  // якщо файл зображення є
  if (req.files && req.files.image) {
    const imageFile = req.files.image;
    const uploadPath = path.join(__dirname, 'public', 'images', imageFile.name);

    imageFile.mv(uploadPath, err => {
      if (err) {
        console.error('Помилка при збереженні зображення:', err);
        return res.status(500).json({ error: 'Не вдалося зберегти зображення' });
      }
    });

    image = `images/${imageFile.name}`;
  }

  // перетворити рядок обмежень у масив
  const parsedRestrictions = typeof restrictions === 'string'
    ? restrictions.split(',').map(r => r.trim())
    : [];

  const recipe = {
    id,
    title,
    ingredients,
    instructions,
    restrictions: parsedRestrictions,
    image,
    userId: parseInt(userId)
  };

  db.recipes.push(recipe);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  res.status(201).json(recipe);
});
// === Запуск сервера ===
app.listen(3000, () => {
  console.log('Сервер запущено на http://localhost:3000');
});
