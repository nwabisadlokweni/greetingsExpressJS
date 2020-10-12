const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const greetFactory = require('./greetings');
//const flash = require('express-flash');
//const session = require('express-session');
const _ = require("lodash")

const pg = require("pg");
const Pool = pg.Pool;

const app = express();

// which db connection to use
const connectionString = process.env.DATABASE_URL || 'postgresql://codex:pg123@localhost:5432/greeting';

const pool = new Pool({
    connectionString
});

const greetings = greetFactory(pool);

app.engine('handlebars', exphbs({ layoutsDir: './views/layouts' }));
app.set('view engine', 'handlebars');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// app.use(session({
//     secret: "please enter your name",
//     resave: false,
//     saveUninitialized: true
// }))
// // initialise the flash middleware
// app.use(flash());

app.get('/', async function (req, res) {
    res.render('index', { count: await greetings.counter() });
});

app.post('/', async function (req, res) {
    // greetings.setTheName(req.body.nameEntered);
    const name = _.capitalize(req.body.nameEntered)

    console.log({ name });

    if (req.body.nameEntered && req.body.language) {
        var nameGreeted = await greetings.theLanguage(req.body.language, name);
        // await greetings.insert(req.body.nameEntered)
    } else {
        var error = greetings.errorMessage(req.body.language, req.body.nameEntered)
    }

    res.render('index', {
        // message: (error === '') ? await greetings.theLanguage(req.body.language, req.body.nameEntered) : error,
        error: error,
        count: await greetings.counter(),
        // reset: greetings.reset()
        message: nameGreeted
    })
});

// app.get('/', function (req, res) {
//     req.flash('info', 'Welcome');
//     res.render('index', {
//       title: 'Home'
//     })
//   });

//   app.get('/addFlash', function (req, res) {
//     req.flash('info', 'please enter your name');
//     res.redirect('/');
//   });

// app.get('/the-route', function (req, res) {
//     req.flash('info', 'Flash Message Added');
//     res.redirect('/');
// });

app.get('/greeted', async function (req, res) {

    const theNames = await greetings.getTheNames();

    console.log(theNames);

    res.render('greeted', { greeted: theNames });
});

app.get('/greeted/:username', async function (req, res) {
    const username = req.params.username;
    var counting = await greetings.update(username);

    res.render('greeted', await { greetedName: `${username} has been greeted ${counting} times` });
});

app.get('/reset', async function (req, res) {
    await greetings.reset()
    res.redirect('/');
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, function () {
    console.log("App started at port", PORT)
});
