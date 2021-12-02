import express from 'express';
import methodOverride from 'method-override';
import pg from 'pg';

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

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// Route to index page
app.get('/', (req, res) => {
  const sqlQuery = 'SELECT * FROM notes';

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
  res.render('addNotes');
});

// Route to add note entry to database
app.post('/note', (req, res) => {
  const inputData = Object.values(req.body);

  const insertQuery = 'INSERT INTO notes (habitat, date, appearance, behaviour, vocalisations, flock_size, create_time) VALUES ($1, $2, $3, $4, $5, $6, $7);';

  pool.query(insertQuery, inputData, (err, result) => {
    if (err) {
      console.log('Insert query error', err.stack);
      res.status(503).send('Error');
      return;
    }
    res.send('good');
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

app.listen(3004);
