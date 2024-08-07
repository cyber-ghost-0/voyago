const FCM=require("./models/FCM_Tokens.js")
const express = require("express");
const sequelize = require("./util/database");
const appAuth = require("./routes/app/auth");
const webRoutes = require("./routes/web/general");
const appRoutes = require("./routes/app/general");
const webAuth = require("./routes/web/auth");
const app = express();
const BP = require("body-parser");
const Trip = require("./models/Trip");
const Admin = require("./models/Admin");
const Destenation = require("./models/Destenation");
const Event = require("./models/Event");
const Attraction = require("./models/Attraction");
const Favourites = require("./models/Favourites.js");
const Features_included = require("./models/features_included");
const Every_feature = require("./models/every_feture");
const Image = require("./models/image");
const Day_trip = require("./models/Day_trip");
const Review = require("./models/review.js");
const Every_user_review = require("./models/EveryUserReview.js");
const User = require("./models/User.js");
const reservation = require("./models/reservation.js");
const Wallet = require("./models/wallet.js");
const Transaction = require("./models/transaction.js");
const ChargeRequest = require("./models/chargeRequest");
const every_user_review = require("./models/EveryUserReview.js");
const imageRoutes = require("./models/image.js");
const everyReservationEvent=require("./models/everyResrvationEvent.js");
const charge_request = require("./models/chargeRequest");
const transaction = require("./models/transaction.js");
const Notification_mod=require("./models/Notification.js")
const cors = require("cors");
const cron = require("node-cron");
const moment = require("moment");
const { Op, INTEGER } = require("sequelize");


app.use(BP.json());
app.use('/uploads', express.static('./uploads'));
// trip;
Admin.hasMany(Destenation, { onDelete: "CASCADE" });
Destenation.belongsTo(Admin, { constraints: true, onDelete: "CASCADE" });
Admin.hasMany(Attraction, { onDelete: "CASCADE" });
Attraction.belongsTo(Admin, { constraints: true, onDelete: "CASCADE" });
Destenation.hasMany(Attraction, { onDelete: "CASCADE" });
Attraction.belongsTo(Destenation, { constraints: true, onDelete: "CASCADE" });

Trip.hasMany(Every_feature, { constraints: true, onDelete: "CASCADE" });
Every_feature.belongsTo(Trip, { constraints: true, onDelete: "CASCADE" });
Features_included.hasMany(Every_feature, {
  constraints: true,
  onDelete: "CASCADE",
});
Every_feature.belongsTo(Features_included, {
  constraints: true,
  onDelete: "CASCADE",
});

Trip.hasMany(Image, { onDelete: "CASCADE" });
Image.belongsTo(Trip, { constraints: true, onDelete: "CASCADE" });
Destenation.hasMany(Image, { onDelete: "CASCADE" });
Image.belongsTo(Destenation, { constraints: true, onDelete: "CASCADE" });
Attraction.hasMany(Image, { onDelete: "CASCADE" });
Image.belongsTo(Attraction, { constraints: true, onDelete: "CASCADE" });
Admin.hasMany(Trip, { onDelete: "CASCADE" });
Trip.belongsTo(Admin, { constraints: true, onDelete: "CASCADE" });
Trip.hasMany(Day_trip, { onDelete: "CASCADE" });
Day_trip.belongsTo(Trip, { constraints: true, onDelete: "CASCADE" });
Day_trip.hasMany(Event, { constraints: true, onDelete: "CASCADE" });
Event.belongsTo(Day_trip, { constraints: true, onDelete: "CASCADE" });

reservation.hasMany(everyReservationEvent, { constraints: true, onDelete: "CASCADE" });
everyReservationEvent.belongsTo(reservation, { constraints: true, onDelete: "CASCADE" });
Event.hasMany(everyReservationEvent, { constraints: true, onDelete: "CASCADE" });
everyReservationEvent.belongsTo(Event, { constraints: true, onDelete: "CASCADE" });

Trip.hasMany(Every_user_review, { constraints: true, onDelete: "CASCADE" });
Every_user_review.belongsTo(Trip, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Every_user_review, { constraints: true, onDelete: "CASCADE" });
Every_user_review.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
Destenation.hasMany(Every_user_review, {
  constraints: true,
  onDelete: "CASCADE",
});
Every_user_review.belongsTo(Destenation, {
  constraints: true,
  onDelete: "CASCADE",
});
Attraction.hasMany(Every_user_review, {
  constraints: true,
  onDelete: "CASCADE",
});
Every_user_review.belongsTo(Attraction, {
  constraints: true,
  onDelete: "CASCADE",
});

Trip.belongsTo(Destenation, { constraints: true, onDelete: "CASCADE" });
Destenation.hasMany(Trip, { constraints: true, onDelete: "CASCADE" });
Attraction.hasMany(Event, { constraints: true, onDelete: "CASCADE" });
Event.belongsTo(Attraction, { constraints: true, onDelete: "CASCADE" });

Trip.hasMany(reservation, { constraints: true, onDelete: "CASCADE" });
reservation.belongsTo(Trip, { constraints: true, onDelete: "CASCADE" });
User.hasMany(reservation, { constraints: true, onDelete: "CASCADE" });
reservation.belongsTo(User, { constraints: true, onDelete: "CASCADE" });

User.hasOne(Wallet, { constraints: true, onDelete: "CASCADE" });
Wallet.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
Wallet.hasMany(Transaction, { constraints: true, onDelete: "CASCADE" });
Transaction.belongsTo(Wallet, { constraints: true, onDelete: "CASCADE" });
Admin.hasMany(Transaction, { constraints: true, onDelete: "CASCADE" });
Transaction.belongsTo(Admin, { constraints: true, onDelete: "CASCADE" });
User.hasMany(ChargeRequest, { constraints: true, onDelete: "CASCADE" });
ChargeRequest.belongsTo(User, { constraints: true, onDelete: "CASCADE" });

User.hasMany(Favourites, { constraints: true, onDelete: "CASCADE" });
Favourites.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
Trip.hasMany(Favourites, { constraints: true, onDelete: "CASCADE" });
Favourites.belongsTo(Trip, { constraints: true, onDelete: "CASCADE" });
Destenation.hasMany(Favourites, { constraints: true, onDelete: "CASCADE" });
Favourites.belongsTo(Destenation, { constraints: true, onDelete: "CASCADE" });
Attraction.hasMany(Favourites, { constraints: true, onDelete: "CASCADE" });
Favourites.belongsTo(Attraction, { constraints: true, onDelete: "CASCADE" });

User.hasMany(FCM, { constraints: true, onDelete: "CASCADE" });
FCM.belongsTo(User, { constraints: true, onDelete: "CASCADE" });

charge_request.hasOne(transaction, { constraints: true });
transaction.belongsTo(charge_request, { constraints: true });

User.hasMany(Notification_mod, { constraints: true, onDelete: "CASCADE" });
Notification_mod.belongsTo(User, { constraints: true, onDelete: "CASCADE" });


app.use(cors());
app.use(BP.urlencoded({ extended: true }));
app.use(BP.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.use("/api", appAuth);
app.use("/web", webAuth);
app.use("/api", appRoutes);
app.use("/web", webRoutes);
app.use("/web", imageRoutes);
sequelize
  // .sync({  force:true})
  .sync()
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
