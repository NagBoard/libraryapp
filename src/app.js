if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const flash = require('express-flash'); 
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');

const app = express();
const server = http.createServer(app);

const publicDirectoryPath = path.join(__dirname, '..', 'public');
const viewsDirectoryPath = path.join(__dirname, '..', 'views');
app.use(express.static(publicDirectoryPath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', viewsDirectoryPath);

const dbFilePath = path.join(__dirname, '..', 'db', 'main.db');
const db = new sqlite3.Database(dbFilePath);

const initializePassport = require('./passport-config');
initializePassport(
    passport, 
    username => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM user WHERE username = ?', username, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
);


app.get('/', (req, res) => {
    const mainHtmlPath = path.join(viewsDirectoryPath, 'index.html');
    res.render(mainHtmlPath);
});

app.get('/reservations_active', (req, res) => {
    db.all('SELECT userReader.username as reader_username, userLibrarian.username as librarian_username, book.title, book.author, reservation.status, reservation.request_date, reservation.confirmation_date, reservation.last_status_update FROM reservation INNER JOIN reader ON reservation.reader_id = reader.id INNER JOIN user as userReader ON reader.id = userReader.id INNER JOIN user as userLibrarian ON reservation.librarian_id = userLibrarian.id INNER JOIN book ON reservation.book_id = book.id WHERE reservation.is_terminated = 0', [], (err, rows) => {
        if (err) {
            console.log(err.message);
        } else {
            res.send(rows);
        }
    });
});

app.get('/reservations_closed', (req, res) => {
    db.all('SELECT userReader.username as reader_username, userLibrarian.username as librarian_username, book.title, book.author, reservation.status, reservation.request_date, reservation.confirmation_date, reservation.last_status_update FROM reservation INNER JOIN reader ON reservation.reader_id = reader.id INNER JOIN user as userReader ON reader.id = userReader.id INNER JOIN user as userLibrarian ON reservation.librarian_id = userLibrarian.id INNER JOIN book ON reservation.book_id = book.id WHERE reservation.is_terminated = 1', [], (err, rows) => {
        if (err) {
            console.log(err.message);
        } else {
            res.send(rows);
        }
    });
});

app.get('/borrowed_books_active', (req, res) => {
    db.all('SELECT borrowed_book.id, userReader.username as reader_username, userIssuer.username as issuer_username, userReceiver.username as receiver_username, book.title, borrowed_book.status, borrowed_book.borrow_date, borrowed_book.return_date FROM borrowed_book INNER JOIN reader ON borrowed_book.reader_id = reader.id INNER JOIN user as userReader ON reader.id = userReader.id INNER JOIN librarian as issuerLibrarian ON borrowed_book.issuer_id = issuerLibrarian.id INNER JOIN librarian as receiverLibrarian ON borrowed_book.receiver_id = receiverLibrarian.id INNER JOIN user as userIssuer ON issuerLibrarian.id = userIssuer.id INNER JOIN user as userReceiver ON receiverLibrarian.id = userReceiver.id INNER JOIN book ON borrowed_book.book_id = book.id WHERE borrowed_book.status = "Borrowed"', [], (err, rows) => {
        if (err) {
            console.log(err.message);
        } else {
            res.send(rows);
        }
    });
});

app.get('/borrowed_books_closed', (req, res) => {
    db.all('SELECT borrowed_book.id, userReader.username as reader_username, userIssuer.username as issuer_username, userReceiver.username as receiver_username, book.title, borrowed_book.status, borrowed_book.borrow_date, borrowed_book.return_date, borrowed_book.date_returned FROM borrowed_book INNER JOIN reader ON borrowed_book.reader_id = reader.id INNER JOIN user as userReader ON reader.id = userReader.id INNER JOIN librarian as issuerLibrarian ON borrowed_book.issuer_id = issuerLibrarian.id INNER JOIN librarian as receiverLibrarian ON borrowed_book.receiver_id = receiverLibrarian.id INNER JOIN user as userIssuer ON issuerLibrarian.id = userIssuer.id INNER JOIN user as userReceiver ON receiverLibrarian.id = userReceiver.id INNER JOIN book ON borrowed_book.book_id = book.id WHERE borrowed_book.status = "Returned"', [], (err, rows) => {
        if (err) {
            console.log(err.message);
        } else {
            res.send(rows);
        }
    });
});

app.get('/available_books', (req, res) => {
    db.all('SELECT title, author, description, book_type, available_copies FROM book', [], (err, rows) => {
        if (err) {
            console.log(err.message);
        } else {
            res.send(rows);
        }
    });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    const loginHtmlPath = path.join(viewsDirectoryPath, 'login');
    res.render(loginHtmlPath);
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/hi',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    const registerHtmlPath = path.join(viewsDirectoryPath, 'register');
    res.render(registerHtmlPath);
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const userData = {
            username: req.body.username,
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: hashedPassword
        };
        
        db.run('INSERT INTO user (username, name, surname, email, password) VALUES (?, ?, ?, ?, ?)', 
            [userData.username, userData.name, userData.surname, userData.email, userData.password], 
            function(err) {
                if (err) {
                    console.log(err.message);
                    res.redirect('/register');
                } else {
                    console.log(`A new user with id ${this.lastID} has been inserted.`);
                    res.redirect('/login');
                }
            }
        );
    } catch {
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res) => {
    req.logout(() => {});
    res.redirect('/login'); 
});

app.get('/hi', (req, res) => {
    if (req.user) {
        res.render('hi', { username: req.user.username });
    } else {
        res.render('hi', { username: 'guest' });
    }
});


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
