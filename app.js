const express = require('express');
const sequelize = require('./util/database');
const appAuth = require('./routes/app/auth');
const webAuth = require('./routes/web/auth');
const app = express();
const BP = require('body-parser');

app.use(BP.json());

app.use('/api', appAuth);
app.use('/web', webAuth);

sequelize
    // .sync({force:true})
    .sync()
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
