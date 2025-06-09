
// === Новини на головній ===
function loadNews() {
  const newsList = document.getElementById('news-list');
  if (!newsList) return;

  fetch('/api/news')
    .then(res => res.json())
    .then(newsArray => {
      newsList.innerHTML = '';
      newsArray.forEach(news => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
          <img src="${news.image}" alt="${news.title}">
          <div class="news-card-content">
            <h3>${news.title}</h3>
            <p>${news.text}</p>
            <a href="news.html?id=${news.id}">Детальніше</a>
          </div>
        `;
        newsList.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Помилка при завантаженні новин:", err);
    });
}

function loadNewsDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;

  const container = document.getElementById('news-detail');
  if (!container) return;

  fetch('/api/news')
    .then(res => res.json())
    .then(newsArray => {
      const news = newsArray.find(n => n.id == id);
      if (!news) {
        container.innerHTML = `<h2>Новину не знайдено</h2>`;
        return;
      }

      container.innerHTML = `
        <h2>${news.title}</h2>
        <img src="${news.image}" style="width:100%; border-radius:10px; margin-top:20px;">
        <p style="margin-top:20px; font-size:16px; line-height:1.6;">${news.fullText}</p>
      `;
    })
    .catch(err => {
      console.error("Помилка при завантаженні новини:", err);
      container.innerHTML = `<h2>Сталася помилка при завантаженні новини</h2>`;
    });
}

function loadCategories() {
  const container = document.getElementById('category-buttons');
  if (!container) return;

  fetch('/api/categories')
    .then(res => res.json())
    .then(categories => {
      categories.forEach(category => {
        const btn = document.createElement('button');
        btn.textContent = category;
        btn.onclick = () => loadRecipes(category);
        container.appendChild(btn);
      });

      const allBtn = document.createElement('button');
      allBtn.textContent = "Усі рецепти";
      allBtn.onclick = () => loadRecipes(null);
      container.prepend(allBtn);
    });
}

function loadRecipes(category = null) {
  const container = document.getElementById('recipes-list');
  if (!container) return;

  fetch('/api/recipes')
    .then(res => res.json())
    .then(recipes => {
      container.innerHTML = '';

      const filtered = category
        ? recipes.filter(r => r.restrictions && r.restrictions.includes(category))
        : recipes;

      if (filtered.length === 0) {
        container.innerHTML = '<p>Немає рецептів у цій категорії.</p>';
        return;
      }

      filtered.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
          <img src="${recipe.image || 'images/default.jpg'}" alt="${recipe.title}">
          <div class="recipe-card-content">
            <h3>${recipe.title}</h3>
            <p>${recipe.ingredients.substring(0, 60)}...</p>
            <a href="recipe.html?id=${recipe.id}">Переглянути</a>
          </div>
        `;
        container.appendChild(card);
      });
    });
}

function registerUser() {
  console.log("registerUser called");
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = form.elements['username'].value.trim();
    const password = form.elements['password'].value.trim();

    fetch('/api/users')
      .then(res => res.json())
      .then(users => {
        if (users.find(u => u.username === username)) {
          alert('Користувач з таким логіном вже існує');
          return;
        }

        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }).then(() => {
          alert('Успішна реєстрація');
          window.location.href = 'login.html';
        });
      });
  });
}

function loginUser() {
  console.log("loginUser called");
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = form.elements['username'].value.trim();
const password = form.elements['password'].value.trim();

    fetch('/api/users')
      .then(res => res.json())
      .then(users => {
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
          alert('Невірний логін або пароль');
          return;
        }

        localStorage.setItem('user', JSON.stringify(user));
        alert('Вхід виконано');
        window.location.href = 'account.html';
      });
  });
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function checkAuth(required = false) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user && required) {
    alert('Для додавання рецепту потрібно увійти в акаунт.');
    window.location.href = 'login.html';
  }
}
let isAddRecipeInitialized = false;
function handleAddRecipe() {
  if (isAddRecipeInitialized) return; // 🛑 вже ініціалізовано
  isAddRecipeInitialized = true;
  const form = document.getElementById('add-recipe-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const ingredients = document.getElementById('ingredients').value.trim();
    const instructions = document.getElementById('instructions').value.trim();
    const restrictionsInput = document.getElementById('restrictions').value.trim();
    const fileInput = document.getElementById('image');

    const user = getCurrentUser();
    if (!user) {
      alert('Потрібно увійти в акаунт для додавання рецепту.');
      window.location.href = 'login.html';
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('ingredients', ingredients);
    formData.append('instructions', instructions);
    formData.append('restrictions', restrictionsInput);
    formData.append('userId', user.id);

    if (fileInput && fileInput.files.length > 0) {
      formData.append('image', fileInput.files[0]);
    }

    fetch('/api/recipes', {
      method: 'POST',
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error('Server error');
        return res.json();
      })
      .then(() => {
        alert('Рецепт успішно додано!');
        window.location.href = 'recipes.html';
      })
      .catch(err => {
        console.error('Помилка при додаванні рецепту:', err);
        alert('Не вдалося додати рецепт');
      });
  });
}


function loadRecipeDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;

  const container = document.getElementById('recipe-detail');
  if (!container) return;

  fetch('/api/recipes')
    .then(res => res.json())
    .then(recipes => {
      const recipe = recipes.find(r => r.id == id);
      if (!recipe) {
        container.innerHTML = '<h2>Рецепт не знайдено</h2>';
        return;
      }

      container.innerHTML = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image || 'images/default.jpg'}" alt="${recipe.title}" style="width:100%; max-width:600px; margin:20px auto; display:block; border-radius:10px;">
        <h3>Інгредієнти</h3>
        <p>${recipe.ingredients.replace(/\n/g, '<br>')}</p>
        <h3>Інструкції</h3>
        <p>${recipe.instructions.replace(/\n/g, '<br>')}</p>
        ${recipe.restrictions && recipe.restrictions.length > 0 ? `
          <h3>Харчові обмеження</h3>
          <ul>
            ${recipe.restrictions.map(r => `<li>${r}</li>`).join('')}
          </ul>
        ` : ''}
      `;
    })
    .catch(err => {
      console.error('Помилка при завантаженні рецепту:', err);
      container.innerHTML = '<h2>Помилка при завантаженні рецепту</h2>';
    });
}
function renderUserNav() {
  const user = getCurrentUser();
  const nav = document.getElementById('nav-menu');
  const loginLink = document.getElementById('login-link');

  if (user && nav && loginLink) {
    loginLink.textContent = 'Мій профіль';
    loginLink.href = 'account.html';
  } else if (loginLink) {
    loginLink.textContent = 'Вхід';
    loginLink.href = 'login.html';
  }
}
function loadAccountPage() {
  const user = getCurrentUser();
  const section = document.getElementById('account-section');
  if (!user || !section) return;

  section.innerHTML = `
    <h2>Вітаємо, ${user.username}</h2>
    <div class="profile-info">
      <p><strong>Логін (email):</strong> ${user.username}</p>
    </div>
    <div class="profile-buttons" style="margin-top: 20px;">
      <button id="edit-profile">Редагувати профіль</button>
      <button id="logout">Вийти</button>
    </div>
    <h3 style="margin-top:40px;">Мої рецепти</h3>
    <div id="my-recipes"></div>
  `;

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });

  document.getElementById('edit-profile').addEventListener('click', () => {
    section.innerHTML = `
      <h2>Редагування профілю</h2>
      <form id="edit-profile-form" style="max-width:400px;">
        <label for="username">Новий логін (email):</label>
        <input type="text" id="username" value="${user.username}" required>
        <button type="submit">Зберегти зміни</button>
      </form>
    `;

    document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newUsername = document.getElementById('username').value.trim();
      if (!newUsername) return;

      fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      })
        .then(res => {
          if (!res.ok) throw new Error('Помилка при оновленні профілю');
          return res.json();
        })
        .then(updatedUser => {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          alert('Профіль оновлено');
          location.reload();
        })
        .catch(err => {
          console.error('Помилка:', err);
          alert('Не вдалося оновити профіль');
        });
    });
  });

  // Підвантажити рецепти користувача
  fetch('/api/recipes')
    .then(res => res.json())
    .then(recipes => {
      const myRecipes = recipes.filter(r => String(r.userId) === String(user.id));
      const container = document.getElementById('my-recipes');

      if (!container) return;

      if (myRecipes.length === 0) {
        container.innerHTML = '<p>У вас ще немає рецептів.</p>';
      } else {
        container.innerHTML = myRecipes.map(r => `
          <div class="recipe-card" style="margin-bottom:20px; padding:10px; border:1px solid #ddd; border-radius:8px;">
            <h4>${r.title}</h4>
            <p>${r.ingredients.substring(0, 100)}...</p>
            <a href="recipe.html?id=${r.id}">Переглянути рецепт</a>
          </div>
        `).join('');
      }
    })
    .catch(err => {
      console.error('Помилка при завантаженні моїх рецептів:', err);
    });
}

function searchRecipes() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const container = document.getElementById('recipes-list');
  if (!container) return;

  fetch('/api/recipes')
    .then(res => res.json())
    .then(recipes => {
      const filtered = recipes.filter(r =>
        r.title.toLowerCase().includes(query)
      );

      container.innerHTML = '';

      if (filtered.length === 0) {
        container.innerHTML = '<p>Немає рецептів за вашим запитом.</p>';
        return;
      }

      filtered.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
          <img src="${recipe.image || 'images/default.jpg'}" alt="${recipe.title}">
          <div class="recipe-card-content">
            <h3>${recipe.title}</h3>
            <p>${recipe.ingredients.substring(0, 60)}...</p>
            <a href="recipe.html?id=${recipe.id}">Переглянути</a>
          </div>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Помилка при пошуку рецептів:', err);
    });
}


function checkAuthRender(containerId) {
  const user = getCurrentUser();
  if (user) return true;

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div style="text-align:center; margin-top: 50px;">
        <p style="font-size: 18px; color: #444;">Для додавання рецепту необхідно увійти в акаунт.</p>
        <a href="login.html">
          <button style="
            padding: 12px 24px;
            background: linear-gradient(90deg, #ff8a00, #e52e71);
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          ">Увійти</button>
        </a>
      </div>
    `;
  }

  return false;
}
 
document.addEventListener('DOMContentLoaded', () => {
  renderUserNav();
  const path = window.location.pathname;

  // === Авторизація на сторінці "Мій профіль"
  if (path.includes('account.html')) {
    checkAuth(true);
    loadAccountPage();
  }

  // === Авторизація на сторінці "Додати рецепт"
  if (path.includes('add-recipe.html')) {
    const allowed = checkAuthRender('auth-check-container');
    if (allowed) {
      document.getElementById('add-recipe-form').style.display = 'block';
      handleAddRecipe();
    }
    return; // інші load-функції не потрібні на цій сторінці
  }

  // === Для всіх інших сторінок
  loadNews();
  loadNewsDetail();
  loadCategories();
  loadRecipes();
  loginUser();
  registerUser();
  loadRecipeDetail();
});
