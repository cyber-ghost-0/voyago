const express = require('express');
const sequelize = require('./util/database');
const appAuth = require('./routes/app/auth');
const webRoutes = require('./routes/web/general');
const appRoutes = require('./routes/app/general');
const webAuth = require('./routes/web/auth');
const app = express();
const BP = require('body-parser');
const Trip = require('./models/Trip');
const Admin = require('./models/Admin');
const Destenation = require('./models/Destenation');
const Att_rev = require('./models/Attractions_review');
const Event = require('./models/Event');
const Trips_review = require('./models/Trips_review');
const Attraction = require('./models/Attraction');
const fav_users_Attrac = require('./models/fav_users_attrac');
const Features_included=require('./models/features_included');
const Every_feature = require('./models/every_feture');
const Image = require('./models/image');
app.use(BP.json());
// trip;
Admin.hasMany(Destenation);
Destenation.belongsTo(Admin, ({ constraints: true, onDelete: 'CASCADE' }));
Admin.hasMany(Attraction);
Attraction.belongsTo(Admin, ({ constraints: true, onDelete: 'CASCADE' }));
Destenation.hasMany(Attraction);
Attraction.belongsTo(Destenation, ({ constraints: true, onDelete: 'CASCADE' }));
Trip.belongsToMany(Features_included, { through: Every_feature });
Features_included.belongsToMany(Trip, { through: Every_feature });
Trip.hasMany(Image);
Image.belongsTo(Trip);
Admin.hasMany(Trip);
Trip.belongsTo(Admin, ({ constraints: true, onDelete: 'CASCADE' }));

app.use('/api', appAuth);
app.use('/web', webAuth);
app.use('/api', appRoutes);
app.use('/web', webRoutes);

sequelize
    // .sync({  force:true})
    .sync()
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
