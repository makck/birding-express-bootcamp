import express from 'express';
import methodOverride from 'method-override';
import pg from 'pg';
import jsSHA from 'jssha';
import cookieParser from 'cookie-parser';

// Initialise DB connection
const { Pool } = pg;
const pgConnectConfigs = {
  user: 'Chan Keet',
  host: 'localhost',
  database: 'birdings',
  port: 5432,
};

const pool = new Pool(pgConnectConfigs);

const app = express();

const SALT = 'password for the win';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Route to index page
app.get('/', (req, res) => {
  const { loggedInHash, userId } = req.cookies;

  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  const unhashedCookieString = `${userId}-${SALT}`;
  shaObj.update(unhashedCookieString);
  const hashedCookieString = shaObj.getHash('HEX');

  if (hashedCookieString !== req.cookies.loggedInHash) {
    res.status(403).render('login');
    return;
  }

  const sqlQuery = 'SELECT notes.*, users.username FROM notes JOIN users ON notes.user_id = users.id';

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Select query error', err.stack);
      res.status(503).send('Error');
      return;
    }

    const data = result.rows;
    console.log(data);
    res.render('index', { data });
  });
});

// Route to create a new note
app.get('/note', (req, res) => {
  const userID = req.cookies.userId;
  res.render('addNotes', { userID });
});

// Route to add note entry to database
app.post('/note', (req, res) => {
  const inputData = Object.values(req.body);

  const insertQuery = 'INSERT INTO notes (habitat, date, appearance, behaviour, vocalisations, flock_size, create_time, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

  pool.query(insertQuery, inputData, (err, result) => {
    if (err) {
      console.log('Insert query error', err.stack);
      res.status(503).send('Error');
      return;
    }
    res.redirect('/');
  });
});

// Route to single note page
app.get('/note/:id', (req, res) => {
  const inputData = req.params.id;

  const sqlQuery = `SELECT * FROM notes WHERE id ='${inputData}'`;

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Select query error', err.stack);
      res.status(503).send('Error');
      return;
    }

    const data = result.rows[0];
    console.log(data);
    res.render('singleNote', { data });
  });
});

// Route to user signup
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Route to post user signup
app.post('/signup', (req, res) => {
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(req.body.password);
  const hashedPassword = shaObj.getHash('HEX');

  const inputData = [req.body.username, req.body.email, hashedPassword];

  const sqlQuery = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';

  pool.query(sqlQuery, inputData, (signupErr, signupResult) => {
    if (signupErr) {
      console.log('Insert query error', signupErr.stack);
      res.status(503).send('Error');
    }

    // res.redirect('/');
  });
});

// Route for user log in
app.get('/login', (req, res) => {
  res.render('login');
});

// Route for post request for user log in
app.post('/login', (req, res) => {
  const values = [req.body.email];
  pool.query('SELECT * from users WHERE email=$1', values, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      res.status(503).send(result.rows);
      return;
    }

    if (result.rows.length === 0) {
      res.status(403).send('login failed!');
      return;
    }

    const user = result.rows[0];
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    shaObj.update(req.body.password);
    const hashedPassword = shaObj.getHash('HEX');

    if (user.password !== hashedPassword) {
      res.status(403).send('login failed!');
      return;
    }

    const shaObj2 = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

    const unhashedCookieString = `${user.id}-${SALT}`;
    shaObj2.update(unhashedCookieString);
    const hashedCookieString = shaObj2.getHash('HEX');

    res.cookie('loggedInHash', hashedCookieString);
    res.cookie('userId', user.id);
    res.cookie('username', user.username);

    res.redirect('/');
  });
});

// Route to log user out
app.get('/logout', (req, res) => {
  res.cookie('loggedInHash', '');
  res.cookie('userId', '');

  res.redirect('/');
});

app.listen(3004);
