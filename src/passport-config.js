const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function initialize(passport) {
    const dbFilePath = path.join(__dirname, '..', 'db', 'main.db');
    const db = new sqlite3.Database(dbFilePath);

    const authenticateUser = async (username, password, done) => {
        db.get('SELECT * FROM user WHERE username = ?', username, async (err, row) => {
            if (err) {
                return done(err);
            }
    
            if (!row) {
                return done(null, false, { message: 'No user with that username' });
            }
    
            try {
                if (await bcrypt.compare(password, row.password)) {
                    return done(null, row);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (e) {
                return done(e);
            }
        });
    };

    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        db.get('SELECT * FROM user WHERE id = ?', id, (err, row) => {
            if (err) {
                return done(err);
            }
            done(null, row);
        });
    });
}

module.exports = initialize;