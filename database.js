const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'db.json');

function readDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
    getRecipes() {
        const db = readDB();
        return db.recipes;
    },
    addRecipe(recipe) {
        const db = readDB();
        db.recipes.push(recipe);
        writeDB(db);
    },
    getUsers() {
        const db = readDB();
        return db.users;
    },
    addUser(user) {
        const db = readDB();
        db.users.push(user);
        writeDB(db);
    }
};
