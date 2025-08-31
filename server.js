const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Création de la base SQLite pour stocker les messages
const db = new sqlite3.Database('./messages.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Base SQLite connectée');
});

db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// POST endpoint pour le formulaire
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Stocker dans la base SQLite
  db.run(`INSERT INTO messages(name, email, message) VALUES(?, ?, ?)`,
    [name, email, message],
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Erreur base de données' });
      }

      // Envoyer par mail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `Nouveau message de ${name}`,
        text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error(error);
        else console.log('Email envoyé: ' + info.response);
      });

      res.json({ message: 'Message reçu et envoyé par mail' });
    }
  );
});

app.listen(port, () => {
  console
