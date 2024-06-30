const express = require('express');
const multer = require('multer');
const sequelize = require('./util/database');
const appAuth = require('./routes/app/auth');
const webRoutes = require('./routes/web/general');
const appRoutes = require('./routes/app/general');
const imageRoutes = require('./routes/web/image');
const webAuth = require('./routes/web/auth');
const app = express();
const upload = multer({dest: 'uploads/'});
const BP = require('body-parser');
const Trip = require('./models/Trip');
const Admin = require('./models/Admin');
const Destenation = require('./models/Destenation');
const Event = require('./models/Event');
const Attraction = require('./models/Attraction');
const fav_users_Attrac = require('./models/fav_users_attrac');
const Features_included=require('./models/features_included');
const Every_feature = require('./models/every_feture');
const Image = require('./models/image');
const Day_trip = require('./models/Day_trip');
const Review=require('./models/review.js')
app.use(BP.json());
const path = require('path');
app.use(express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// trip;
Admin.hasMany(Destenation,{onDelete: 'CASCADE'});
Destenation.belongsTo(Admin, ({ constraints: true, onDelete: 'CASCADE' }));
Admin.hasMany(Attraction,{onDelete: 'CASCADE'});
Attraction.belongsTo(Admin, ({ constraints: true, onDelete: 'CASCADE' }));
Destenation.hasMany(Attraction,{onDelete: 'CASCADE'});
Attraction.belongsTo(Destenation, ({ constraints: true, onDelete: 'CASCADE' }));
Trip.belongsToMany(Features_included, { through: Every_feature },{onDelete: 'CASCADE'});
Features_included.belongsToMany(Trip, { through: Every_feature },{onDelete: 'CASCADE'});
Admin.hasMany(Trip,{onDelete: 'CASCADE'});
Trip.belongsTo(Admin, ({ constraints: true, onDelete: 'CASCADE' }));
Trip.hasMany(Day_trip,{onDelete: 'CASCADE'});
Day_trip.belongsTo(Trip, ({ constraints: true, onDelete: 'CASCADE' }));
Day_trip.hasMany(Event,{onDelete: 'CASCADE'});
Event.belongsTo(Day_trip, ({ constraints: true, onDelete: 'CASCADE' }));
Trip.hasMany(Review,{onDelete: 'CASCADE'});
Review.belongsTo(Trip, ({ constraints: true, onDelete: 'CASCADE' }));
Attraction.hasMany(Review,{onDelete: 'CASCADE'});
Review.belongsTo(Attraction, ({ constraints: true, onDelete: 'CASCADE' }));

Attraction.hasMany(Image,{onDelete: 'CASCADE'});
Image.belongsTo(Attraction,({ constraints: true, onDelete: 'CASCADE'}));
Trip.hasMany(Image,{onDelete: 'CASCADE'});
Image.belongsTo(Trip,({ constraints: true, onDelete: 'CASCADE'}));
Destenation.hasMany(Image,{onDelete: 'CASCADE'});
Image.belongsTo(Destenation,({ constraints: true, onDelete: 'CASCADE'}));



app.use('/api', appAuth);
app.use('/web', webAuth);
app.use('/api', appRoutes);
app.use('/web', webRoutes);
app.use('/web', imageRoutes);

sequelize
    .sync({  force:true})
    //.sync()
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
