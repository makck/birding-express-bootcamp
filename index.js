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
    res.render('index', { data });
  });
});

// Route to create a new note
app.get('/note', (req, res) => {
  const { loggedInHash, userId } = req.cookies;

  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  const unhashedCookieString = `${userId}-${SALT}`;
  shaObj.update(unhashedCookieString);
  const hashedCookieString = shaObj.getHash('HEX');

  if (hashedCookieString !== req.cookies.loggedInHash) {
    res.status(403).render('login');
    return;
  }

  const userID = [req.cookies.userId, req.cookies.username];

  pool.query('SELECT id, name FROM species', (speciesErr, speciesResult) => {
    const speciesData = { species: speciesResult.rows };

    pool.query('SELECT * FROM behaviours', (behaviourErr, behaviourResults) => {
      const behaviourData = { behaviours: behaviourResults.rows };

      res.render('addNotes', { userID, speciesData, behaviourData });
    });
  });
});

// Route to add note entry to database
app.post('/note', (req, res) => {
  // eslint-disable-next-line max-len
  const inputNotesData = [req.body.species_id, req.body.habitat, req.body.date, req.body.appearance, req.body.vocalisations, req.body.flock_size, req.body.create_time, req.body.username];

  const insertQuery = 'INSERT INTO notes (species_id, habitat, date, appearance, vocalisations, flock_size, create_time, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';

  pool.query(insertQuery, inputNotesData, (notesErr, notesResult) => {
    if (notesErr) {
      console.log('Insert query error', notesErr.stack);
      res.status(503).send('Error');
      return;
    }

    const notesId = notesResult.rows[0].id;

    const insertRelationQuery = 'INSERT INTO notes_behaviours (notes_id, behaviour_id) VALUES ($1, $2)';

    let queryDoneCounter = 0;
    req.body.behaviour_id.forEach((behavioudId, index) => {
      const relationValues = [notesId, behavioudId];

      pool.query(insertRelationQuery, relationValues, (relationError, relationResult) => {
        queryDoneCounter += 1;

        if (queryDoneCounter === req.body.behaviour_id.length) {
          res.redirect('/');
        }
      });
    });
  });
});

// Route to single note page
app.get('/note/:id', (req, res) => {
  const { loggedInHash, userId } = req.cookies;

  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  const unhashedCookieString = `${userId}-${SALT}`;
  shaObj.update(unhashedCookieString);
  const hashedCookieString = shaObj.getHash('HEX');

  if (hashedCookieString !== req.cookies.loggedInHash) {
    res.status(403).render('login');
    return;
  }

  const inputData = req.params.id;

  const sqlQuery = `
  SELECT 
    notes.*,
    species.name species_name,
    cte.description
  FROM notes
  JOIN species
    ON notes.species_id = species.id 
  JOIN (SELECT notes_behaviours.*, behaviours.description from notes_behaviours JOIN behaviours ON notes_behaviours.behaviour_id = behaviours.id) AS cte
    ON notes.id = cte.notes_id
  WHERE notes.id ='${inputData}'`;

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Select query error', err.stack);
      res.status(503).send('Error');
      return;
    }

    const noteData = result.rows;

    const commentsQuery = `
    SELECT 
      comments.id,
      comments.content,
      comments.user_id,
      comments.notes_id,
      to_char(date(comments.create_time), 'DD Mon YYYY') create_time,
      users.username
    FROM comments 
    JOIN users
      ON comments.user_id = users.id
    WHERE comments.notes_id=${inputData} 
    ORDER BY date(create_time) DESC 
    LIMIT 4`;

    pool.query(commentsQuery, (commentsErr, commentsResult) => {
      if (commentsErr) {
        console.log('Comments Query Error', commentsErr.stack);
        res.status(503).send('Error');
        return;
      }
      const commentsData = commentsResult.rows;
      const userName = req.cookies.username;
      const selectedNote = req.params.id;

      console.log('comments data', commentsData);
      res.render('singleNote', {
        noteData, commentsData, userName, selectedNote,
      });
    });
  });
});

// Route to user signup
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Route to post user signup
app.post('/signup', (req, res) => {
  const allInputs = Object.values(req.body);

  let validSignUp = true;

  allInputs.forEach((element) => {
    if (element.length === 0) {
      validSignUp = false;
    }
  });

  if (validSignUp) {
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
    });
  }
  else {
    // Not working here. To revisit.
    res.send('Sign Up Failed');
  }
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
      res.status(403).send('login failed');
      return;
    }

    const user = result.rows[0];
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    shaObj.update(req.body.password);
    const hashedPassword = shaObj.getHash('HEX');

    if (user.password !== hashedPassword) {
      res.status(403).send('login failed');
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

// Route for user to input a comment
app.post('/note/:id/comment', (req, res) => {
  const today = new Date();
  const dateToday = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  const inputComment = [req.body.content, req.cookies.userId, req.params.id, dateToday];

  const sqlQuery = `
  INSERT INTO comments (content, user_id, notes_id, create_time) VALUES ($1, $2, $3, $4)`;

  pool.query(sqlQuery, inputComment, (insertErr, insertResult) => {
    if (insertErr) {
      console.log('Error executing query', insertErr.stack);
      res.status(503).send('Error');
      return;
    }
    res.redirect(`/note/${req.params.id}`);
  });
});

app.listen(3004);
