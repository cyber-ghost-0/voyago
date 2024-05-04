const express = require('express');
const sequelize = require('./util/database');
const authRoutes = require('./routes/auth/auth');
const app = express();
const BP = require('body-parser');
const session = require('express-session');

app.use(BP.json());

app.use(
    session({ secret: 'my secret', resave: false, saveUninitialized: false })
);
app.use('/api', authRoutes);

sequelize
    //.sync({force:true})
    .sync()
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
