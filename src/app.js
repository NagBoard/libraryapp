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
    const mainHtmlPath = path.join(publicDirectoryPath, 'index');
    let isUserAuthenticated = req.isAuthenticated(); // Assuming you're using Passport.js
    res.render(mainHtmlPath, { isUserAuthenticated: isUserAuthenticated });
});

app.get('/account', checkAuthenticated, (req, res) => {
    const accountHtmlPath = path.join(publicDirectoryPath, 'account');
    res.render(accountHtmlPath);
});

app.get('/booking', checkAuthenticated, (req, res) => {
    const bookingHtmlPath = path.join(publicDirectoryPath, 'booking');
    res.render(bookingHtmlPath);
});

app.get('/reader_active_borrows', checkAuthenticated, (req, res) => {
    const readerActiveBorrowsHtmlPath = path.join(publicDirectoryPath, 'reader_active_borrows');
    res.render(readerActiveBorrowsHtmlPath);
});

app.get('/reader_closed_borrows', checkAuthenticated, (req, res) => {
    const readerClosedBorrowsHtmlPath = path.join(publicDirectoryPath, 'reader_closed_borrows');
    res.render(readerClosedBorrowsHtmlPath);
});

app.get('/reader_active_reservations', checkAuthenticated, (req, res) => {
    const readerActiveReservationsHtmlPath = path.join(publicDirectoryPath, 'reader_active_reservations');
    res.render(readerActiveReservationsHtmlPath);
});

app.get('/reader_closed_reservations', checkAuthenticated, (req, res) => {
    const readerClosedReservationsHtmlPath = path.join(publicDirectoryPath, 'reader_closed_reservations');
    res.render(readerClosedReservationsHtmlPath);
});

app.get('/dev_menu', checkAuthenticated, (req, res) => {
    const devMenuHtmlPath = path.join(publicDirectoryPath, 'dev_menu');
    res.render(devMenuHtmlPath);
});

app.get('/reader_menu', checkAuthenticated, (req, res) => {
    const readerMenuHtmlPath = path.join(publicDirectoryPath, 'reader_menu');
    res.render(readerMenuHtmlPath);
});

app.get('/librarian_menu', checkAuthenticated, checkIsAdminOrLibrarian, (req, res) => {
    const librarianMenuHtmlPath = path.join(publicDirectoryPath, 'librarian_menu');
    res.render(librarianMenuHtmlPath);
});

app.get('/admin_menu', checkAuthenticated, checkIsAdmin, (req, res) => {
    const adminMenuHtmlPath = path.join(publicDirectoryPath, 'admin_menu');
    res.render(adminMenuHtmlPath);
});


app.use(express.static(publicDirectoryPath));

app.get('/protected', checkAuthenticated, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    const loginHtmlPath = path.join(publicDirectoryPath, 'login');
    res.render(loginHtmlPath);
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    const registerHtmlPath = path.join(publicDirectoryPath, 'register');
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
    res.redirect('/'); 
});

app.get('/redirect', checkAuthenticated, checkUserRole, function(req, res, next) {
    // `req.user.role` is set by the `checkUserRole` middleware
    if (req.user.role === 'admin') {
        res.redirect('/admin_menu');
    } else if (req.user.role === 'reader'){
        res.redirect('/reader_menu');
    } else if (req.user.role === 'librarian'){
        res.redirect('/librarian_menu');
    } else {
        next(new Error('No user with this role found'));
    }
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

function checkLibrarianAccess(req, res, next) {
    const username = req.user.username;                                         // Get username from session
    const query = `SELECT * FROM user WHERE username = ?`;                      // Query to get user id
    db.get(query, [username], (err, row) => {
        if (err) {                                                              // If error, redirect to login page
            console.error(err);
            return res.redirect('/');
        }
        if (row) {                                                              // If user exists, get user id
            const userId = row.id;                                              // Return user id
            const librarianQuery = `SELECT * FROM librarian WHERE id = ?`;      // Query to get librarian with user id
            db.get(librarianQuery, [userId], (err, librarianRow) => {
                if (err) {
                    console.error(err);
                    return res.redirect('/');                                   // If error, redirect to login page
                }
                if (librarianRow) {
                    if (librarianRow.reservation_access === 1) {
                        console.log('Librarian has reservation access');
                        return next();                                          // If librarian has reservation access, return next()
                    }
                    console.log('Librarian does not have reservation access');
                    return res.redirect('/');                                   // If librarian does not have reservation access, redirect to main page
                }
                res.redirect('/');                                              // If librarian does not exist, redirect to login page
            });
        } else {
            res.redirect('/');                                                  // If user does not exist, redirect to login page
        }
    });
}

function checkIsAdmin(req, res, next) {
    const username = req.user.username;
    const query = `SELECT * FROM user WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        if (row) {
            const userId = row.id;
            const adminQuery = `SELECT * FROM admin WHERE id = ?`;
            db.get(adminQuery, [userId], (err, adminRow) => {
                if (err) {
                    console.error(err);
                    return res.redirect('/');
                }
                if (adminRow) {
                    return next();
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
    });
}

function checkIsAdminOrLibrarian(req, res, next) {
    const username = req.user.username;
    const query = `SELECT * FROM user WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        if (row) {
            const userId = row.id;
            const adminQuery = `SELECT * FROM admin WHERE id = ?`;
            const librarianQuery = `SELECT * FROM librarian WHERE id = ?`;
            db.get(adminQuery, [userId], (err, adminRow) => {
                if (err) {
                    console.error(err);
                    return res.redirect('/');
                }
                if (adminRow) {
                    return next();
                } else {
                    db.get(librarianQuery, [userId], (err, librarianRow) => {
                        if (err) {
                            console.error(err);
                            return res.redirect('/');
                        }
                        if (librarianRow) {
                            if (librarianRow.reservation_access === 1) {
                                console.log('Librarian has reservation access');
                                return next();                                          // If librarian has reservation access, return next()
                            }
                            console.log('Librarian does not have reservation access');
                            return res.redirect('/');                                   // If librarian does not have reservation access, redirect to main page
                        } else {
                            res.redirect('/');
                        }
                    });
                }
            });
        } else {
            res.redirect('/');
        }
    });
}

function checkUserRole(req, res, next) {
    const username = req.user.username;
    const query = `SELECT * FROM user WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        if (row) {
            const userId = row.id;
            const adminQuery = `SELECT * FROM admin WHERE id = ?`;
            const librarianQuery = `SELECT * FROM librarian WHERE id = ?`;
            const readerQuery = `SELECT * FROM reader WHERE id = ?`;
            db.get(adminQuery, [userId], (err, adminRow) => {
                if (err) {
                    console.error(err);
                    return res.redirect('/');
                }
                if (adminRow) {
                    req.user.role = 'admin';
                    next();
                } else {
                    db.get(librarianQuery, [userId], (err, librarianRow) => {
                        if (err) {
                            console.error(err);
                            return res.redirect('/');
                        }
                        if (librarianRow) {
                            req.user.role = 'librarian';
                            next();
                        } else {
                            db.get(readerQuery, [userId], (err, readerRow) => {
                                if (err) {
                                    console.error(err);
                                    return res.redirect('/');
                                }
                                if (readerRow) {
                                    req.user.role = 'reader';
                                    next();
                                } else {
                                    res.redirect('/');
                                }
                            });
                        }
                    });
                }
            });
        } else {
            res.redirect('/');
        }
    });
}




server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
