const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mail = require("../../services/Mails");
const services = require("../../services/public");
const BP = require("body-parser");
const Joi = require("joi");
const multer = require("multer");
const path = require("path");
const User = require("../../models/User");
const Trip = require("../../models/Trip");
const Image = require("../../models/image");
const { Op, INTEGER } = require("sequelize");
const { Sequelize, where } = require("sequelize");
const { SequelizeMethod } = require("sequelize/lib/utils");
const Every_user_review = require("../../models/EveryUserReview");
const Attraction = require("../../models/Attraction");
const Destenation = require("../../models/Destenation");
const reservation = require("../../models/reservation");
const Wallet = require("../../models/wallet.js");
const Transaction = require("../../models/transaction.js");
const ChargeRequest = require("../../models/chargeRequest");
const favourites = require("../../models/Favourites.js");
const { use } = require("../../routes/app/auth.js");
const review = require("../../models/review.js");
const every_user_review = require("../../models/EveryUserReview");
const DayTrips = require("../../models/Day_trip");
const Events = require("../../models/Event.js");
const Every_features = require("../../models/every_feture.js");
const every_feature = require("../../models/every_feture.js");
const features_included = require("../../models/features_included.js");
const transaction = require("../../models/transaction.js");
const Notification = require("../../services/Notification");
const FCM = require("../../models/FCM_Tokens");
const Notification_mod = require("../../models/Notification");
const Event = require("../../models/Event.js");
const everyReservationEvent = require("../../models/everyResrvationEvent");
const Reservation = require("../../models/reservation");
const Delete_Request = require("../../models/DeleteRequest.js");
const Personal_trip = require("../../models/PersonalTrip.js");
const Personal_day_trip = require("../../models/PersonalDayTrip.js");
const Personal_event = require("../../models/PersonalEvents.js");
const AttractionForPersonal = require("../../models/AttractionForPersonal.js");
const cron = require("node-cron");
const moment = require("moment");
const e = require("express");
const stripe = require("stripe")(
  "sk_test_51Pl5wSEVUjNtlvUo4Mklo94tk9tBWXEnIlP7ErbPMglgDc4WFrrm2QfOPVYhIeu3Qb5fItTqMoSmk5TQ61Q2lhtY00BmR8RQJ9"
);
// require('dotenv').config()

function validateUserInfo(info) {
  const schema = Joi.object({
    username: Joi.string().alphanum().required(),
    password: Joi.string()
      .min(8)
      .required()
      .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
    confirm_password: Joi.ref("password"),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
  });
  console.log(info);
  return schema.validate(info);
}

async function is_unique(name, model, col) {
  const whereClause = {};
  whereClause[col] = name;

  console.log(whereClause);
  let user = await model.findOne({ where: whereClause });
  return user;
}

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads');
//   },
//   filename: (req, file, cd) => {
//     cd(null, Date.now() + path.extname(file.originalname))
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: '100000000' },
//   fileFilter: (req, file, cd) => {
//     const fileTypes = /jpeg|jpg|png|gif|bmp/
//     const mimeType = fileTypes.test(file.mimetype)
//     const extname = fileTypes.test(path.extname(file.originalname))
//     if (mimeType && extname) {
//       return cd(null, true)
//     }
//     cd('Give  proper files formate to upload')
//   }
// }).single('image');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads'); // Specify the uploads directory
//   },
//   filename: (req, file, cb) => {
//     // Generate a unique filename with the original file extension
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: '100000000' }, // Limit file size to 100MB
//   fileFilter: (req, file, cb) => {
//     const fileTypes = /jpeg|jpg|png|gif|bmp/; // Allowed file types
//     const mimeType = fileTypes.test(file.mimetype);
//     const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimeType && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Invalid file format. Only JPEG, JPG, PNG, GIF, and BMP are allowed.'));
//   }
// }).single('image');

// module.exports = {
//   storage,
//   upload
// };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Specify the uploads directory
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with the original file extension
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 } // Limit file size to 100MB
}).single('image'); // Changed from 'image' to 'file' for flexibility

module.exports = {
  storage,
  upload
};


module.exports.myProfile = async (req, res, next) => {
  let array;
  const user = await User.findOne({ where: { id: req.userID } });
  array = {
    username: user.username,
    email: user.email,
    phone_number: user.phone_number,
    location: user.location,
    profile_pic: user.profile_pic,
  };
  let response = { data: array, msg: "Done!", err: {} };
  return res.json(response).status(200);
};

module.exports.EditMyProfile = async (req, res, next) => {
  let array;
  const user = await User.findOne({ where: { id: req.user_id } });

  let flag =
    req.body.old_password &&
    (await bcrypt.compare(req.body.old_password, user.password));
  if (!flag) {
    return res
      .status(401)
      .json({ msg: "fault", err: "Old password is not correct", data: {} });
  }
  if (req.body.password)
    if (req.body.password != req.body.confirm_password) {
      return res.status(401).json({
        msg: "fault",
        err: "password is not equal confirmation password",
        data: {},
      });
    }
  if (user.username !== req.body.username) {
    console.log(await is_unique(req.body.username, User, "username"));
    if (await is_unique(req.body.username, User, "username")) {
      return res.status(401).json({
        msg: "fault",
        err: "username isnot unique",
        data: {},
      });
    }
  }

  user.username = req.body.username;
  user.phone_number = req.body.phone_number;
  if (req.body.password)
    user.password = await bcrypt.hash(req.body.password, 12);
  user.location = req.body.country;
  await user.save();
  return res.json({ msg: "edited", data: {}, err: {} }).status(200);
};

module.exports.im_t = async (req, res, err) => {
  const TripId = req.params.id;
  let trip = await Trip.findByPk(TripId);
  let reson = await trip.getImages();
  return res.json(reson);
};

module.exports.trip_review = async (req, res, err) => {
  const TripId = req.params.id;
  let trip = await Trip.findByPk(TripId);
  if (!trip) {
    return res
      .status(401)
      .json({ msg: "fault", err: "no such trip with that id", data: {} });
  }
  const user_id = req.user_id;
  const comment = req.body.comment;
  const rate = req.body.rate;
  await Every_user_review.create({
    UserId: user_id,
    TripId: TripId,
    comment: comment,
    rate: rate,
  });
  let response = { data: {}, msg: "Comment submitted succeully!", err: {} };
  return res.json(response).status(200);
};

module.exports.attraction_review = async (req, res, err) => {
  const attractionId = req.params.id;
  let attraction = await Attraction.findByPk(attractionId);
  if (!attraction) {
    return res
      .status(401)
      .json({ msg: "fault", err: "no such Attraction with that id", data: {} });
  }
  const user_id = req.user_id;
  const comment = req.body.comment;
  const rate = req.body.rate;
  await Every_user_review.create({
    UserId: user_id,
    AttractionId: attractionId,
    comment: comment,
    rate: rate,
  });
  let response = { data: {}, msg: "Comment submitted succeully!", err: {} };
  return res.json(response).status(200);
};

module.exports.destenation_review = async (req, res, err) => {
  const DestenationId = req.params.id;
  let destenation = await Destenation.findByPk(DestenationId);
  if (!destenation) {
    return res.status(401).json({
      msg: "fault",
      err: "no such Destenation with that id",
      data: {},
    });
  }
  const user_id = req.user_id;
  const comment = req.body.comment;
  const rate = req.body.rate;
  await Every_user_review.create({
    UserId: user_id,
    DestenationId: DestenationId,
    comment: comment,
    rate: rate,
  });
  let response = { data: {}, msg: "Comment submitted succeully!", err: {} };
  return res.json(response).status(200);
};

module.exports.reserve_on_trip = async (req, res, next) => {
  const trip_id = req.params.id;
  const adult = req.body.adult;
  const child = req.body.child;
  let optional_choices = req.body.optional_choices;
  const email = req.body.email;
  const phone = req.body.phone;
  const password = req.body.password;
  const is_stripe = req.body.type;
  const user = await User.findByPk(req.user_id);
  let flag = await bcrypt.compare(password, user.password);
  const trip = await Trip.findByPk(trip_id);
  const wallet = await Wallet.findOne({ where: { UserId: user.id } });

  if (!trip) {
    return res
      .status(500)
      .json({ data: {}, err: "there is no trip with this id" });
  }
  if (trip.available_capacity < adult + child) {
    return res.status(500).json({ data: {}, err: "No capacity enough!" });
  }
  if (!flag) {
    let response = { data: {}, msg: "fail", err: "password is not correct !" };
    return res.json(response).status(500);
  }
  let cost = (adult + child) * trip.trip_price;
  for (let i = 0; i < optional_choices.length; i++) {
    let event = await Event.findByPk(optional_choices[i].id);
    let day;
    if (event) day = await DayTrips.findByPk(event.DayTripId);
    if (!event || event.type != "optional" || day.TripId != trip.id) {
      return res.status(500).json({ data: {}, err: `No optional event!` });
    }
    cost +=
      event.price_adult * optional_choices[i].adult +
      event.price_child * optional_choices[i].child;
  }
  cost += trip.trip_price;
  console.log(wallet.balance, cost);
  if (!is_stripe)
    if (cost > wallet.balance) {
      return res.status(500).json({ data: {}, err: "No balance enough!" });
    }
  let Available_capacity = trip.available_capacity - (adult + child);
  trip.available_capacity = Available_capacity;

  let reservation = await Reservation.create({
    email: email,
    adult: adult,
    child: child,
    phone: phone,
    UserId: req.user_id,
    TripId: trip_id,
  });
  for (let i = 0; i < optional_choices.length; i++) {
    await everyReservationEvent.create({
      adult: optional_choices[i].adult,
      child: optional_choices[i].child,
      reservationId: reservation.id,
      EventId: optional_choices[i].id,
    });
  }
  let nw = 0;
  if (is_stripe)
    nw = parseInt(wallet.balance) - parseInt(cost);
  else nw = parseInt(wallet.balance);
  console.log(nw);
  await Transaction.create({
    AdminId: null,
    walletId: wallet.id,
    new_balance: nw,
    last_balance: wallet.balance,
    type: "Deposite",
    status: "Success",
    chargeRequestId: null,
  });
  const fcm = await FCM.findOne({ where: { UserId: req.user_id } });
  console.log(fcm);
  let title = "Reserving";
  let body = `Your have regestered on ${trip.name} trip !`;
  if (!is_stripe) wallet.balance -= cost;
  await wallet.save();
  await trip.save();
  await Notification_mod.create({
    UserId: req.user_id,
    title: title,
    body: body,
    type: "Reserving",
  });
  Notification.notify(fcm.token, title, body, res, next);

  // let response = {
  //   data: {},
  //   msg: "you have regesterd on this trip !",
  //   err: {},
  // };
  // return res.json(response).status(200);
};

module.exports.Attractions = async (req, res, next) => {
  let Atr = await Attraction.findAll({
    include: [
      {
        model: image,
        attributes: ['url']
      }
    ],
  });
  let arr = [];
  for (let i = 0; i < Atr.length; i++) {
    // let cur = Atr[i].dataValues;
    // let all_images = await Atr[i].getImages();
    // let URL_images = [];
    // all_images.forEach((element) => {
    //   URL_images.push(element.image);
    // });
    // cur.images = URL_images;
    arr.push(cur);
  }
  return res.status(200).json({ data: arr, err: {}, msg: "success" });
};

module.exports.Destenations = async (req, res, next) => {
  let Dst = await Destenation.findAll();
  let arr = [];
  for (let i = 0; i < Dst.length; i++) {
    let cur = Dst[i].dataValues;
    let all_images = await Dst[i].getImages();
    let URL_images = [];
    all_images.forEach((element) => {
      URL_images.push(element.image);
    });
    cur.images = URL_images;
    arr.push(cur);
  }
  return res.status(200).json({ data: arr, err: {}, msg: "success" });
};

module.exports.single_destination = async (req, res, next) => {
  // try {
  const destinationId = req.params.id;
  const destination = await Destenation.findByPk(destinationId);
  if (!destination) {
    return res
      .status(404)
      .json({ data: {}, err: {}, msg: "Destination not found" });
  }

  const attractions = await destination.getAttractions();
  const trips = await destination.getTrips();
  console.log(attractions);
  let response = {
    destination,
    attractions: [],
    trips: [],
  };

  // Process attractions and their images
  for (const attraction of attractions) {
    const all_images = await attraction.getImages();
    const URL_images = all_images.map((image) => image.dataValues.image);
    attraction.dataValues.images = URL_images;
    response.attractions.push(attraction);
  }

  // Process trips and their images
  for (const trip of trips) {
    const all_images = await trip.getImages();
    const URL_images = all_images.map((image) => image.dataValues.image);
    trip.dataValues.images = URL_images;
    response.trips.push(trip);
  }

  // Get user reviews

  let reviews = await destination.getUsers();

  response.reviews = reviews;

  return res.status(200).json({ data: response, err: {}, msg: "success" });
};

module.exports.single_attraction = async (req, res, next) => {
  const attractionId = req.params.id;
  const attraction = await Attraction.findByPk(attractionId);
  if (!attraction) {
    return res
      .status(404)
      .json({ data: {}, err: {}, msg: "attrraction not found" });
  }

  const destenation = await attraction.getDestenation().name;
  const events = await attraction.getEvents();
  let Day_trip = [];
  events.forEach((element) => {
    Day_trip.push(element.getDayTrips());
  });
  let trips = [];
  Day_trip.forEach(async (element) => {
    trips.push(await element.getTrip());
  });
  const uniqueArray = Array.from(new Set(trips));

  let response = {
    destenation: destenation,
    attractions: attraction,
    trips: uniqueArray,
  };

  // Process trips and their images
  for (const trip of trips) {
    const all_images = await trip.getImages();
    const URL_images = all_images.map((image) => image.dataValues.image);
    trip.dataValues.images = URL_images;
    response.trips.push(trip);
  }

  // Get user reviews

  let reviews = await attraction.getUsers();

  response.reviews = reviews;

  return res.status(200).json({ data: response, err: {}, msg: "success" });
};

module.exports.add_trip_favourite = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const trip = await Trip.findByPk(req.params.id);

    if (!trip) {
      return res.status(404).json({ err: "Trip not found", msg: "fault" });
    }

    let fav = await favourites.findOne({
      where: { UserId: user_id, TripId: trip.id },
    });

    if (!fav) {
      fav = await favourites.create({
        UserId: user_id,
        TripId: trip.id,
        is_favourite: false,
      });
    }

    fav.is_favourite = !fav.is_favourite;
    await fav.save();

    return res.status(200).json({ msg: "Favourite status updated", data: {} });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.add_attraction_favourite = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const attraction = await Attraction.findByPk(req.params.id);

    if (!attraction) {
      return res
        .status(404)
        .json({ err: "Attraction not found", msg: "fault" });
    }

    let fav = await favourites.findOne({
      where: { UserId: user_id, AttractionId: attraction.id },
    });

    if (!fav) {
      fav = await favourites.create({
        UserId: user_id,
        AttractionId: attraction.id,
        is_favourite: false,
      });
    }

    fav.is_favourite = !fav.is_favourite;
    await fav.save();

    return res.status(200).json({ msg: "Favourite status updated", data: {} });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.add_destination_favourite = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const destination = await Destenation.findByPk(req.params.id);

    if (!destination) {
      return res.status(404).json({ err: "Destination not found" });
    }

    let fav = await favourites.findOne({
      where: { UserId: user_id, DestenationId: destination.id },
    });

    if (!fav) {
      fav = await favourites.create({
        UserId: user_id,
        DestenationId: destination.id,
        is_favourite: false,
      });
    }

    fav.is_favourite = !fav.is_favourite;
    await fav.save();

    return res.status(200).json({ msg: "Favourite status updated", data: {} });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.trending_destenation = async (req, res, next) => {
  try {
    let result = [];
    let destenations = await Destenation.findAll();

    await Promise.all(
      destenations.map(async (single_dist) => {
        let image = await Image.findOne({
          where: { DestenationId: single_dist.id },
        });
        let fav = await favourites.findOne({
          where: { UserId: req.user_id, DestenationId: single_dist.id },
        });

        if (!fav) {
          fav = await favourites.create({
            UserId: req.user_id,
            DestenationId: single_dist.id,
            is_favourite: false,
          });
        }

        let object = {
          id: single_dist.id,
          name: single_dist.name,
          is_favourite: fav.is_favourite,
        };

        let trips = await Trip.findAll({
          where: { DestenationId: single_dist.id },
        });
        let reservationCount = await Promise.all(
          trips.map(async (single_trip) => {
            let reservations = await Reservation.findAll({
              where: { TripId: single_trip.id },
            });
            return reservations.length;
          })
        );

        object.cnt = reservationCount.reduce((acc, count) => acc + count, 0);
        result.push(object);
      })
    );
    result.sort((b, a) => a.cnt - b.cnt);

    result = result.slice(0, 10);

    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.top_attractions = async (req, res, next) => {
  try {
    let result = [];
    let attractions = await Attraction.findAll();

    for (let i = 0; i < attractions.length; i++) {
      let single_attr = attractions[i];
      let image = await Image.findOne({
        where: { AttractionId: single_attr.id },
      });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: single_attr.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: single_attr.id,
          is_favourite: false,
        });
      }

      let object = {
        id: single_attr.id,
        name: single_attr.name,
        is_favourite: fav.is_favourite,
      };
      let reviews = await every_user_review.findAll({
        where: { AttractionId: single_attr.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      result.push(object);
    }
    result.sort((b, a) => a.rate - b.rate);

    result = result.slice(0, 10);
    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.top_trips = async (req, res, next) => {
  // try {
  let result = [];
  let trips = await Trip.findAll();

  for (let i = 0; i < trips.length; i++) {
    single_trip = trips[i];
    try {
      let image = await Image.findOne({ where: { TripId: single_trip.id } });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, TripId: single_trip.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          TripId: single_trip.id,
          is_favourite: false,
        });
      }

      const diffTime = Math.abs(
        new Date(single_trip.end_date) - new Date(single_trip.start_date)
      );
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      let dist = await Destenation.findByPk(single_trip.DestenationId);

      let reviews = await every_user_review.findAll({
        where: { TripId: single_trip.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        // console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);

      let object = {
        id: single_trip.id,
        name: single_trip.name,
        // image: image ? image.image : null,
        is_favourite: fav.is_favourite,
        duration: diffDays,
        destenation: dist ? dist.name : null,
        price: single_trip.trip_price,
        rate: rate,
      };
      result.push(object);
    } catch (innerErr) {
      console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
    }
  }
  result.sort((b, a) => a.rate - b.rate);

  result = result.slice(0, 10);

  return res.status(200).json({ msg: {}, data: { result } });
  // } catch (err) {
  //   console.error(err);
  //   next(err);
  // }
};

module.exports.popular_trips = async (req, res, next) => {
  try {
    let result = [];
    let trips = await Trip.findAll();

    for (let i = 0; i < trips.length; i++) {
      single_trip = trips[i];
      try {
        let image = await Image.findOne({ where: { TripId: single_trip.id } });
        let fav = await favourites.findOne({
          where: { UserId: req.user_id, TripId: single_trip.id },
        });

        if (!fav) {
          fav = await favourites.create({
            UserId: req.user_id,
            TripId: single_trip.id,
            is_favourite: false,
          });
        }

        const diffTime = Math.abs(
          new Date(single_trip.end_date) - new Date(single_trip.start_date)
        );
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let dist = await Destenation.findByPk(single_trip.DestenationId);

        let reviews = await every_user_review.findAll({
          where: { TripId: single_trip.id },
        });
        let rate = 0.0;
        let cnt = 0;
        reviews.forEach((element) => {
          // console.log(element.dataValues);
          if (element.rate) {
            cnt++;
            rate += element.rate;
            console.log(element.rate);
          }
        });
        if (!cnt) rate = 0;
        else {
          rate = (rate * 1.0) / cnt;
        }
        rate = rate.toFixed(1);

        let object = {
          id: single_trip.id,
          name: single_trip.name,
          is_favourite: fav.is_favourite,
          duration: diffDays,
          destenation: dist ? dist.name : null,
          price: single_trip.trip_price,
          rate: rate,
        };

        let reservationCount = (
          await Reservation.findAll({ where: { TripId: single_trip.id } })
        ).length;
        object.cnt = reservationCount;
        result.push(object);
      } catch (innerErr) {
        console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
      }
    }

    result.sort((b, a) => a.cnt - b.cnt);
    result = result.slice(0, 10);

    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error("Error fetching popular trips:", err);
    next(err);
  }
};

module.exports.recommended_attractions_by_destenation = async (
  req,
  res,
  next
) => {
  try {
    let result = [];
    let name = req.params.name;
    let destenation = await Destenation.findOne({ where: { name: name } });
    if (!destenation) {
      return res.status(404).json({ err: "Destination not found" });
    }
    let attractions = await Attraction.findAll({
      where: { DestenationId: destenation.id },

      include: [
        {
          model: image,
          attributes: ['url']
        }
      ],

    });
    // console.log(destenation_id);
    for (let i = 0; i < attractions.length; i++) {
      let single_attr = attractions[i];
      let image = await Image.findOne({
        where: { AttractionId: single_attr.id },
      });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: single_attr.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: single_attr.id,
          is_favourite: false,
        });
      }

      let object = {
        id: single_attr.id,
        name: single_attr.name,
        is_favourite: fav.is_favourite,
      };
      let reviews = await every_user_review.findAll({
        where: { AttractionId: single_attr.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      result.push(object);
    }
    result.sort((b, a) => a.rate - b.rate);

    result = result.slice(0, 10);
    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.recommended_trips_by_destenation = async (req, res, next) => {
  try {
    let result = [];
    let name = req.params.name;
    let destenation = await Destenation.findOne({ where: { name: name } });
    if (!destenation) {
      return res.status(404).json({ err: "Destination not found" });
    }
    let trips = await Trip.findAll({
      where: { DestenationId: destenation.id },
    });

    for (let i = 0; i < trips.length; i++) {
      single_trip = trips[i];
      try {
        let image = await Image.findOne({ where: { TripId: single_trip.id } });
        let fav = await favourites.findOne({
          where: { UserId: req.user_id, TripId: single_trip.id },
        });

        if (!fav) {
          fav = await favourites.create({
            UserId: req.user_id,
            TripId: single_trip.id,
            is_favourite: false,
          });
        }
        const diffTime = Math.abs(
          new Date(single_trip.end_date) - new Date(single_trip.start_date)
        );
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let dist = await Destenation.findByPk(single_trip.DestenationId);

        let reviews = await every_user_review.findAll({
          where: { TripId: single_trip.id },
        });
        let rate = 0.0;
        let cnt = 0;
        reviews.forEach((element) => {
          // console.log(element.dataValues);
          if (element.rate) {
            cnt++;
            rate += element.rate;
            console.log(element.rate);
          }
        });
        if (!cnt) rate = 0;
        else {
          rate = (rate * 1.0) / cnt;
        }
        rate = rate.toFixed(1);

        let object = {
          id: single_trip.id,
          name: single_trip.name,
          is_favourite: fav.is_favourite,
          duration: diffDays,
          destenation: dist ? dist.name : null,
          price: single_trip.trip_price,
          rate: rate,
        };
        result.push(object);
      } catch (innerErr) {
        console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
      }
    }
    result.sort((b, a) => a.rate - b.rate);

    result = result.slice(0, 10);

    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.all_trips_by_destenation = async (req, res, next) => {
  try {
    let result = [];
    let name = req.params.name;
    let destenation = await Destenation.findOne({ where: { name: name } });
    if (!destenation) {
      return res.status(404).json({ err: "Destination not found" });
    }
    let trips = await Trip.findAll({
      where: { DestenationId: destenation.id },
    });

    for (let i = 0; i < trips.length; i++) {
      single_trip = trips[i];
      let image = await Image.findOne({ where: { TripId: single_trip.id } });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, TripId: single_trip.id },
      });
      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          TripId: single_trip.id,
          is_favourite: false,
        });
      }
      const diffTime = Math.abs(
        new Date(single_trip.end_date) - new Date(single_trip.start_date)
      );
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const reservations = await Reservation.findAll({
        where: { TripId: single_trip.id },
      });
      let regestered = 0;
      reservations.forEach((element) => {
        regestered += element.adult + element.child;
      });

      let trpID = single_trip.id;
      if (!single_trip) {
        return res
          .status(404)
          .json({ err: ("trip ", trpID, " is not completed") });
      }
      let object = {
        id: single_trip.id,
        name: single_trip.name,
        is_favourite: fav.is_favourite,
        start_date: single_trip.start_date,
        end_date: single_trip.end_date,
        duration: diffDays,
        is_avilable: single_trip.avilable,
        maxcapacity: single_trip.capacity,
        regestered: regestered,
      };
      let reviews = await every_user_review.findAll({
        where: { TripId: single_trip.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        // console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      result.push(object);
    }

    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
module.exports.all_attractions_by_destenation = async (req, res, next) => {
  try {
    let result = [];
    let name = req.params.name;
    let destenation = await Destenation.findOne({ where: { name: name } });
    if (!destenation) {
      return res.status(404).json({ err: "Destination not found" });
    }
    let attractions = await Attraction.findAll({
      where: { DestenationId: destenation.id },
    });
    // console.log(destenation_id);
    for (let i = 0; i < attractions.length; i++) {
      let single_attr = attractions[i];
      let image = await Image.findOne({
        where: { AttractionId: single_attr.id },
      });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: single_attr.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: single_attr.id,
          is_favourite: false,
        });
      }
      let object = {
        id: single_attr.id,
        name: single_attr.name,
        is_favourite: fav.is_favourite,
      };
      let reviews = await every_user_review.findAll({
        where: { AttractionId: single_attr.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      result.push(object);
    }
    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.TripImages = async (req, res, next) => {
  let Trip_id = req.params.id;
  let images = await Image.findAll({ where: { TripId: Trip_id } });
  return res.status(200).json({ msg: {}, data: images });
};

module.exports.TripInfo1 = async (req, res, next) => {
  let Trip_id = req.params.id;
  const trip = await Trip.findByPk(Trip_id);
  if (!trip) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no trip with this id" });
  }
  let destenation = await Destenation.findByPk(trip.DestenationId);
  let reviews = await every_user_review.findAll({ where: { TripId: trip.id } });
  let rate = 0.0;
  let cnt = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      cnt++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!cnt) rate = 0;
  else {
    rate = (rate * 1.0) / cnt;
  }
  rate = rate.toFixed(1);
  let result = {
    name: trip.name,
    location: destenation.name,
    rate: rate,
    reviews: cnt,
    price: trip.trip_price,
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.TripInfo2 = async (req, res, next) => {
  let Trip_id = req.params.id;
  const trip = await Trip.findByPk(Trip_id);
  if (!trip) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no trip with this id" });
  }
  const price = trip.price;
  const diffTime = Math.abs(
    new Date(trip.end_date) - new Date(trip.start_date)
  );
  const duration = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const start_date = trip.start_date;
  const capacity = trip.capacity;
  let reservs = await Reservation.findAll({ where: { TripId: Trip_id } });
  let cnt = 0;
  reservs.forEach((element) => {
    cnt += element.adult + element.child;
  });
  const available = capacity - cnt;
  let Days = await DayTrips.findAll({ where: { TripId: Trip_id } });
  let ATTRACTIONS = [];
  for (let j = 0; j < Days.length; j++) {
    let DAY = Days[j];
    let events = await Events.findAll({ where: { DayTripId: DAY.id } });
    events.forEach((element) => {
      if (element.AttractionId) ATTRACTIONS.push(element.AttractionId);
    });
  }
  ATTRACTIONS = Array.from(new Set(ATTRACTIONS));
  const cnt_att = ATTRACTIONS.length;
  const description = trip.description;
  let features = await every_feature.findAll({ where: { TripId: Trip_id } });
  let my_features = [];
  for (let i = 0; i < features.length; i++) {
    let fea = features[i];
    let featur = await features_included.findByPk(fea.featuresIncludedId);
    my_features.push({ type: featur.type, name: featur.name });
  }
  const meet_point = trip.meeting_point_location;
  const time_canellation = trip.TimeLimitCancellation;
  let result = {
    price: price,
    duration: duration,
    start_date: start_date,
    capacity: capacity,
    available: available,
    ATTRACTIONS: cnt_att,
    description: description,
    features: my_features,
    meet_point: meet_point,
    time_canellation: time_canellation,
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.TripInfo3 = async (req, res, next) => {
  let Trip_id = req.params.id;
  const trip = await Trip.findByPk(Trip_id);
  if (!trip) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no trip with this id" });
  }

  let Days = await DayTrips.findAll({ where: { TripId: Trip_id } });
  let ATTRACTIONS = [];
  for (let j = 0; j < Days.length; j++) {
    let DAY = Days[j];
    let events = await Events.findAll({ where: { DayTripId: DAY.id } });
    for (let i = 0; i < events.length; i++) {
      if (events[i].AttractionId) ATTRACTIONS.push(events[i].AttractionId);
    }
  }
  let resu = [];
  ATTRACTIONS = Array.from(new Set(ATTRACTIONS));
  console.log(ATTRACTIONS);
  for (let i = 0; i < ATTRACTIONS.length; i++) {
    let att = ATTRACTIONS[i];
    // console.log(att,'**');
    element = await Attraction.findByPk(att);
    if (element) {
      let image = await Image.findOne({ where: { AttractionId: element.id } });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: element.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: element.id,
          is_favourite: false,
        });
      }

      let object = {
        id: element.id,
        name: element.name,
        is_favourite: fav.is_favourite,
      };
      let reviews = await every_user_review.findAll({
        where: { AttractionId: element.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((elemet) => {
        // console.log(elemet.dataValues);
        if (elemet.rate) {
          cnt++;
          rate += elemet.rate;
          // console.log(elemet.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      resu.push(object);
    }
  }

  let destenation = await Destenation.findByPk(trip.DestenationId);
  let fav = await favourites.findOne({
    where: { UserId: req.user_id, DestenationId: destenation.id },
  });

  if (!fav) {
    fav = await favourites.create({
      UserId: req.user_id,
      DestenationId: destenation.id,
      is_favourite: false,
    });
  }
  destenation.dataValues.is_favourite = fav.is_favourite;
  let result = {
    Destenation: destenation,
    Attraction: resu,
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.reviews_trip = async (req, res, next) => {
  let Trip_id = req.params.id;
  const trip = await Trip.findByPk(Trip_id);
  if (!trip) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no trip with this id" });
  }
  let reviews = await every_user_review.findAll({ where: { TripId: Trip_id } });
  // let reviews = await destination.getEveryuserreviews();
  let cnt = 0;
  let rate = 0.0;

  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    console.log(element);
    cnt++;
  }
  reviews.sort((b, a) => a.comment - b.comment);

  reviews = reviews.slice(0, 3);

  let CNT = 0;
  rate = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      CNT++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!CNT) rate = 0;
  else {
    rate = (rate * 1.0) / CNT;
  }
  rate = rate.toFixed(1);

  return res.status(200).json({
    data: { cnt_reviews: cnt, reviews, rate: rate },
    err: {},
    msg: "success",
  });
};
module.exports.itenerary = async (req, res, next) => {
  let Trip_id = req.params.id;
  const trip = await Trip.findByPk(Trip_id);
  if (!trip) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no trip with this id" });
  }
  let result = [];
  let DAYS = await DayTrips.findAll({ where: { TripId: Trip_id } });
  // console.log(DAYS,Trip_id);
  for (let i = 0; i < DAYS.length; i++) {
    let object = {};
    let day = DAYS[i];
    // day=day.Day_Trip
    day = day.dataValues;
    console.log(day);
    object.order_of_day = day.num;
    let events = await Events.findAll({ where: { DayTripId: day.id } });
    console.log(events);
    object.events = events;
    result.push(object);
  }

  return res.status(200).json({ msg: {}, data: result });
};
module.exports.destenationInfo1 = async (req, res, next) => {
  let destenation_id = req.params.id;
  const destenation = await Destenation.findByPk(destenation_id);
  if (!destenation) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no destenation with this id" });
  }
  // let destenation = await Destenation.findByPk(trip.DestenationId);
  let reviews = await every_user_review.findAll({
    where: { DestenationId: destenation_id },
  });
  let rate = 0.0;
  let cnt = 0;
  let cnt2 = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      cnt++;
      rate += element.rate;
      console.log(element.rate);
    }
    cnt2++;
  });
  if (!cnt) rate = 0;
  else {
    rate = (rate * 1.0) / cnt;
  }
  rate = rate.toFixed(1);
  let result = {
    name: destenation.name,
    location: destenation.location,
    rate: rate,
    reviews: cnt2,
    description: destenation.description,
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.destenationInfo2 = async (req, res, next) => {
  try {
    let result = [];
    let name = req.params.id;
    let destenation = await Destenation.findOne({ where: { id: name } });
    if (!destenation) {
      return res.status(404).json({ err: "Destination not found" });
    }
    let attractions = await Attraction.findAll({
      where: { DestenationId: destenation.id },
    });
    // console.log(destenation_id);
    for (let i = 0; i < attractions.length; i++) {
      let single_attr = attractions[i];
      let image = await Image.findOne({
        where: { AttractionId: single_attr.id },
      });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: single_attr.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: single_attr.id,
          is_favourite: false,
        });
      }

      let object = {
        id: single_attr.id,
        name: single_attr.name,
        is_favourite: fav.is_favourite,
      };
      let reviews = await every_user_review.findAll({
        where: { AttractionId: single_attr.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      result.push(object);
    }
    result.sort((b, a) => a.rate - b.rate);

    result = result.slice(0, 10);
    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.destenationInfo3 = async (req, res, next) => {
  try {
    let result = [];
    let name = req.params.id;
    let destenation = await Destenation.findOne({ where: { id: name } });
    if (!destenation) {
      return res.status(404).json({ err: "Destination not found" });
    }
    let trips = await Trip.findAll({
      where: { DestenationId: destenation.id },
    });

    for (let i = 0; i < trips.length; i++) {
      single_trip = trips[i];
      try {
        let image = await Image.findOne({ where: { TripId: single_trip.id } });
        let fav = await favourites.findOne({
          where: { UserId: req.user_id, TripId: single_trip.id },
        });

        if (!fav) {
          fav = await favourites.create({
            UserId: req.user_id,
            TripId: single_trip.id,
            is_favourite: false,
          });
        }

        const diffTime = Math.abs(
          new Date(single_trip.end_date) - new Date(single_trip.start_date)
        );
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let dist = await Destenation.findByPk(single_trip.DestenationId);

        let reviews = await every_user_review.findAll({
          where: { TripId: single_trip.id },
        });
        let rate = 0.0;
        let cnt = 0;
        reviews.forEach((element) => {
          // console.log(element.dataValues);
          if (element.rate) {
            cnt++;
            rate += element.rate;
            console.log(element.rate);
          }
        });
        if (!cnt) rate = 0;
        else {
          rate = (rate * 1.0) / cnt;
        }
        rate = rate.toFixed(1);

        let object = {
          id: single_trip.id,
          name: single_trip.name,
          is_favourite: fav.is_favourite,
          duration: diffDays,
          destenation: dist ? dist.name : null,
          price: single_trip.trip_price,
          rate: rate,
        };
        result.push(object);
      } catch (innerErr) {
        console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
      }
    }
    result.sort((b, a) => a.rate - b.rate);

    result = result.slice(0, 10);
    return res.status(200).json({ msg: {}, data: { result } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports.reviews_destenation = async (req, res, next) => {
  let destenation_id = req.params.id;
  const destenation = await Destenation.findByPk(destenation_id);
  if (!destenation) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no destenation with this id" });
  }
  let reviews = await every_user_review.findAll({
    where: { DestenationId: destenation_id },
  });
  // let reviews = await destination.getEveryuserreviews();
  let cnt = 0;
  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    console.log(element);
    cnt++;
  }
  reviews.sort((b, a) => a.comment - b.comment);

  reviews = reviews.slice(0, 3);

  let CNT = 0;
  rate = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      CNT++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!CNT) rate = 0;
  else {
    rate = (rate * 1.0) / CNT;
  }
  rate = rate.toFixed(1);
  return res.status(200).json({
    data: { cnt_reviews: cnt, reviews: reviews, rate: rate },
    err: {},
    msg: "success",
  });
};
module.exports.full_review_destenation = async (req, res, next) => {
  let destenation_id = req.params.id;
  const destenation = await Destenation.findByPk(destenation_id);
  if (!destenation) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no destenation with this id" });
  }
  let reviews = await every_user_review.findAll({
    where: { DestenationId: destenation_id },
  });
  // let reviews = await destination.getEveryuserreviews();
  let cnt_rates = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let cnt2 = 0;
  for (let i = 0; i < reviews.length; i++) {
    cnt2++;
    let element = reviews[i];
    console.log(element.rate);
    if (element.rate) {
      cnt_rates[element.rate]++;
    }
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    // console.log(element);
  }
  let CNT = 0;
  rate = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      CNT++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!CNT) rate = 0;
  else {
    rate = (rate * 1.0) / CNT;
  }
  rate = rate.toFixed(1);

  return res.status(200).json({
    data: { cnt_rates, reviews, cnt_reviews: cnt2, rate: rate },
    err: {},
    msg: "success",
  });
};
module.exports.full_review_trip = async (req, res, next) => {
  let trip_id = req.params.id;
  const trip = await Trip.findByPk(trip_id);
  if (!trip) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no trip with this id" });
  }
  let reviews = await every_user_review.findAll({ where: { TripId: trip_id } });
  // let reviews = await destination.getEveryuserreviews();
  let cnt_rates = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let cnt2 = 0;
  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    console.log(element.rate);
    if (element.rate) {
      cnt_rates[element.rate]++;
    }
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    cnt2++;
    // console.log(element);
  }
  let CNT = 0;
  rate = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      CNT++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!CNT) rate = 0;
  else {
    rate = (rate * 1.0) / CNT;
  }
  rate = rate.toFixed(1);
  return res.status(200).json({
    data: { cnt_rates, reviews, cnt_reviews: cnt2, rate: rate },
    err: {},
    msg: "success",
  });
};

module.exports.AttractionInfo1 = async (req, res, next) => {
  let attraction_id = req.params.id;
  const attraction = await Attraction.findByPk(attraction_id);
  if (!attraction) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no attraction with this id" });
  }
  // let destenation = await Destenation.findByPk(trip.DestenationId);
  let reviews = await every_user_review.findAll({
    where: { AttractionId: attraction_id },
  });
  let rate = 0.0;
  let cnt = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      cnt++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!cnt) rate = 0;
  else {
    rate = (rate * 1.0) / cnt;
  }
  rate = rate.toFixed(1);
  const destenation = (await attraction.getDestenation()).name;
  let events = await Events.findAll({ where: { AttractionId: attraction_id } });
  let days = [],
    trips = [];
  for (let i = 0; i < events.length; i++) {
    days.push(events[i].DayTripId);
  }
  days = Array.from(new Set(days));
  // console.log(days);
  for (let i = 0; i < days.length; i++) {
    trips.push((await DayTrips.findByPk(days[i])).TripId);
  }
  trips = Array.from(new Set(trips));
  console.log(trips);
  let result = {
    name: attraction.name,
    location: destenation,
    rate: rate,
    reviews: cnt,
    description: attraction.description,
    trips_included: trips.length,
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.AttractionInfo2 = async (req, res, next) => {
  let attraction_id = req.params.id;
  const attraction = await Attraction.findByPk(attraction_id);
  if (!attraction) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no attraction with this id" });
  }
  // let destenation = await Destenation.findByPk(trip.DestenationId);

  let events = await Events.findAll({ where: { AttractionId: attraction_id } });
  let days = [],
    trips = [];
  for (let i = 0; i < events.length; i++) {
    days.push(events[i].DayTripId);
  }
  days = Array.from(new Set(days));
  // console.log(days);
  for (let i = 0; i < days.length; i++) {
    trips.push((await DayTrips.findByPk(days[i])).TripId);
  }
  trips = Array.from(new Set(trips));
  console.log(trips);
  let result = [];
  for (let i = 0; i < trips.length; i++) {
    let single_trip = await Trip.findByPk(trips[i]);
    console.log(req.user_id);
    let image = await Image.findOne({ where: { TripId: single_trip.id } });
    let fav = await favourites.findOne({
      where: { UserId: req.user_id, TripId: single_trip.id },
    });

    if (!fav) {
      fav = await favourites.create({
        UserId: req.user_id,
        TripId: single_trip.id,
        is_favourite: false,
      });
    }
    const diffTime = Math.abs(
      new Date(single_trip.end_date) - new Date(single_trip.start_date)
    );
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let dist = await Destenation.findByPk(single_trip.DestenationId);

    let reviews = await every_user_review.findAll({
      where: { TripId: single_trip.id },
    });
    let rate = 0.0;
    let cnt = 0;
    reviews.forEach((element) => {
      // console.log(element.dataValues);
      if (element.rate) {
        cnt++;
        rate += element.rate;
        console.log(element.rate);
      }
    });
    if (!cnt) rate = 0;
    else {
      rate = (rate * 1.0) / cnt;
    }
    rate = rate.toFixed(1);

    let object = {
      id: single_trip.id,
      name: single_trip.name,
      is_favourite: fav.is_favourite,
      duration: diffDays,
      destenation: dist ? dist.name : null,
      price: single_trip.trip_price,
      rate: rate,
    };
    result.push(object);
  }

  return res.status(200).json({ msg: {}, data: result });
};

module.exports.reviews_Attraction = async (req, res, next) => {
  let attraction_id = req.params.id;
  const attrraction = await Attraction.findByPk(attraction_id);
  if (!attrraction) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no attraction with this id" });
  }
  let reviews = await every_user_review.findAll({
    where: { AttractionId: attraction_id },
  });
  let cnt = 0;
  // let reviews = await destination.getEveryuserreviews();
  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    console.log(element);
    cnt++;
  }
  reviews = reviews.slice(0, 3);
  let CNT = 0;
  rate = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      CNT++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!CNT) rate = 0;
  else {
    rate = (rate * 1.0) / CNT;
  }
  rate = rate.toFixed(1);
  return res.status(200).json({
    data: { reviews, cnt_reviews: cnt, rate: rate },
    err: {},
    msg: "success",
  });
};

module.exports.full_review_Attraction = async (req, res, next) => {
  let attraction_id = req.params.id;
  const attraction = await Attraction.findByPk(attraction_id);
  if (!attraction) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no attraction with this id" });
  }
  let reviews = await every_user_review.findAll({
    where: { AttractionId: attraction_id },
  });
  // let reviews = await destination.getEveryuserreviews();
  let cnt_rates = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let cnt2 = 0;
  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    cnt2++;
    console.log(element.rate);
    if (element.rate) {
      cnt_rates[element.rate]++;
    }
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    // console.log(element);
  }
  let CNT = 0;
  rate = 0;
  reviews.forEach((element) => {
    console.log(element.dataValues);
    if (element.rate) {
      CNT++;
      rate += element.rate;
      console.log(element.rate);
    }
  });
  if (!CNT) rate = 0;
  else {
    rate = (rate * 1.0) / CNT;
  }
  rate = rate.toFixed(1);

  return res.status(200).json({
    data: { cnt_rates, reviews, cnt_reviews: cnt2, rate: rate },
    err: {},
    msg: "success",
  });
};

module.exports.search = async (req, res, next) => {
  try {
    let {
      destination,
      // price,
      minPrice,
      maxPrice,
      travelers,
      checkIn,
      checkOut,
      priceLtoH,
      priceHtoL,
      topRated,
    } = req.query;
    let trips = [],
      trips_1 = [],
      trips_00 = [],
      trips_01 = [],
      trips_02 = [],
      trips_03 = [],
      trips_04 = [];

    const userId = req.user_id;

    if (destination) {
      let destenations = await Destenation.findAll({
        where: {
          name: {
            [Op.like]: `${destination}%`,
          },
        },
      });

      trips_00 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
          DestenationId: destenations.map((d) => d.id),
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    } else {
      trips_00 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    }

    if (trips_00.length === 0) {
      return res.status(404).json({ err: "No trips found" });
    }

    if (minPrice && maxPrice) {
      trips_01 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
          trip_price: { [Op.between]: [minPrice, maxPrice] },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    } else if (minPrice || maxPrice) {
      const priceCondition = minPrice
        ? { [Op.gte]: minPrice }
        : { [Op.lte]: maxPrice };

      trips_01 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
          trip_price: priceCondition,
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    } else {
      trips_01 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    }

    if (trips_01.length === 0) {
      return res.status(404).json({ err: "No trips found" });
    }

    if (travelers) {
      trips_02 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
          available_capacity: { [Op.gte]: travelers },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    } else {
      trips_02 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    }
    if (trips_02.length === 0) {
      return res.status(404).json({ err: "No trips found" });
    }

    let startDateMap = {};
    if (checkIn) {
      checkInDate = new Date(Date.parse(checkIn));
      checkInDateString = `${checkInDate.getFullYear()}-${String(
        checkInDate.getMonth() + 1
      ).padStart(2, "0")}-${String(checkInDate.getDate()).padStart(2, "0")}`;

      trips = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });

      trips.forEach((trip) => {
        let startDate = new Date(Date.parse(trip.start_date));
        let startDateString = `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
        startDateMap[trip.id] = startDateString;

        if (startDateString === checkInDateString) {
          trips_03.push(trip);
        }
      });
    } else {
      trips_03 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    }
    if (trips_03.length === 0) {
      return res.status(404).json({ err: "No trips found" });
    }

    let endDateMap = {};
    if (checkOut) {
      let checkOutDate = new Date(Date.parse(checkOut));
      let checkOutDateString = `${checkOutDate.getFullYear()}-${String(
        checkOutDate.getMonth() + 1
      ).padStart(2, "0")}-${String(checkOutDate.getDate()).padStart(2, "0")}`;

      trips = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });

      trips.forEach((trip) => {
        let endDate = new Date(Date.parse(trip.end_date));
        let endDateString = `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
        endDateMap[trip.id] = endDateString;

        if (endDateString === checkOutDateString) {
          trips_04.push(trip);
        }
      });
    } else {
      trips_04 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
          },
          {
            model: Image,
            attributes: ["url"],
            limit: 1,
            order: [["id", "ASC"]],
          },
        ],
      });
    }
    if (trips_04.length === 0) {
      return res.status(404).json({ err: "No trips found" });
    }

    trips_1 = trips_00.filter(
      (trip) =>
        trips_01.some((t) => t.id === trip.id) &&
        trips_02.some((t) => t.id === trip.id) &&
        trips_03.some((t) => t.id === trip.id) &&
        trips_04.some((t) => t.id === trip.id)
    );

    const favorites = await favourites.findAll({
      where: {
        TripId: trips_1.map((t) => t.id),
        UserId: userId,
      },
    });

    const favoritesMap = {};
    favorites.forEach((f) => {
      favoritesMap[f.TripId] = f.is_favourite;
    });

    trips_1 = trips_1.map((trip) => ({
      ...trip.toJSON(),
      favorites: favoritesMap.hasOwnProperty(trip.id) ? favoritesMap[trip.id] : false,
    }));


    if (priceLtoH == 1) {
      trips_1.sort((a, b) => a.trip_price - b.trip_price);
    } else if (priceHtoL == 1) {
      trips_1.sort((a, b) => b.trip_price - a.trip_price);
    } else if (topRated == 1) {
      for (let i = 0; i < trips_1.length; i++) {
        let single_trip = trips_1[i];

        let reviews = await every_user_review.findAll({
          where: { TripId: single_trip.id },
        });
        let rate = 0.0;
        let cnt = 0;

        reviews.forEach((element) => {
          if (element.rate) {
            cnt++;
            rate += element.rate;
          }
        });

        if (cnt > 0) {
          rate = (rate / cnt).toFixed(1);
        }

        trips_1[i].rate = parseFloat(rate);
      }
      console.log(trips_1);

      trips_1.sort((a, b) => b.rate - a.rate);
      trips_1 = trips_1.slice(0, 10);
    }

    return res.status(200).json({ msg: {}, data: { trips_1 } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};
module.exports.getOptionalEvents = async (req, res, next) => {
  const trip = await Trip.findByPk(req.params.id);
  if (!trip) {
    return res.status(500).json("There is no trip with this id");
  }
  let list = [];
  let days = await DayTrips.findAll({ where: { TripId: trip.id } });
  for (let i = 0; i < days.length; i++) {
    let element = days[i];
    let temp = await Events.findAll({
      where: { DayTripId: element.id, type: "optional" },
    });
    if (temp.length) {
      temp.forEach((element) => {
        delete element.dataValues.createdAt;
        delete element.dataValues.DayTripId;
        delete element.dataValues.AttractionId;
        delete element.dataValues.type;

        // element=services.removeProperty(element,'updatedAt')
        // element=services.removeProperty(element,'DayTripId')
        // element=services.removeProperty(element,'AttractionId')
        // element=services.removeProperty(element,'type')
        list.push(element);
      });
    }
  }
  return res.status(200).json({ data: list, err: {}, msg: "Done" });
};

module.exports.profile_main = async (req, res, next) => {
  const id = req.user_id;
  const user = await User.findByPk(id);
  let data = { name: user.username, email: user.email };
  return res.status(200).json({ data: data, msg: "Done!" });
};

module.exports.profile_personal_information = async (req, res, next) => {
  const id = req.user_id;
  const user = await User.findByPk(id);
  let data = {
    username: user.username,
    email: user.email,
    phone: user.phone_number,
    location: user.location,
  };
  return res.status(200).json({ data: data, msg: "Done!" });
};

module.exports.wallet = async (req, res, next) => {
  const id = req.user_id;
  const user = await User.findByPk(id);
  const wallet = await Wallet.findOne({ where: { UserId: id } });
  return res
    .status(200)
    .json({ data: { balance: wallet.balance }, msg: "Done!" });
};

module.exports.charge_wallet = async (req, res, next) => {
  const user_id = req.user_id;
  const bank_ticket = req.body.bank_ticket;
  let amount = req.body.amount;
  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded.", data: null });
  }
  const charge_req = await ChargeRequest.create({
    UserId: user_id,
    bank_ticket: `http://localhost:3000/uploads/${req.file.filename}`,
    amount: amount,
  });
  let wallet = await Wallet.findOne({ where: { UserId: user_id } });
  let nw = parseInt(wallet.balance) + parseInt(amount);
  console.log(nw);
  await Transaction.create({
    AdminId: null,
    walletId: wallet.id,
    new_balance: nw,
    last_balance: wallet.balance,
    type: "credit",
    status: "pending",
    chargeRequestId: charge_req.id,

  });
  const fcm = await FCM.findOne({ where: { UserId: user_id } });
  console.log(fcm);
  let title = "crediting";
  let body = "Your requist is pending ... we will respond as soon as possible!";
  // await Notification_mod.create({
  //   UserId: user_id,
  //   title: title,
  //   body: body,
  //   type: "wallet",
  // });
  // Notification.notify(fcm.token, title, body, res, next);
  return res
    .status(200)
    .json({ data: {}, err: {}, msg: "wait for admin response <3" });
};

module.exports.my_reviwes = async (req, res, next) => {
  try {
    const id = req.user_id;
    const user = await User.findByPk(id);
    const trips = await every_user_review.findAll({
      where: { UserId: id, AttractionId: null, DestenationId: null },
    });

    const attractions = await every_user_review.findAll({
      where: { UserId: id, DestenationId: null, TripId: null },
    });

    const destinations = await every_user_review.findAll({
      where: { UserId: id, AttractionId: null, TripId: null },
    });

    const extractId = (element, idKey) => {
      return {
        [idKey]: element[idKey],
        ...element,
      };
    };

    const trip_n = await Promise.all(trips.map(async (element) => {
      element = element.dataValues;
      element = await services.removeProperty(element, "AttractionId");
      element = await services.removeProperty(element, "DestenationId");
      return extractId(element, "TripId");
    }));

    const dest_n = await Promise.all(destinations.map(async (element) => {
      element = element.dataValues;
      element = await services.removeProperty(element, "AttractionId");
      element = await services.removeProperty(element, "TripId");
      return extractId(element, "DestenationId");
    }));

    const attr_n = await Promise.all(attractions.map(async (element) => {
      element = element.dataValues;
      element = await services.removeProperty(element, "TripId");
      element = await services.removeProperty(element, "DestenationId");
      return extractId(element, "AttractionId");
    }));

    return res
      .status(200)
      .json({ data: { trip_n, dest_n, attr_n }, err: {}, msg: "done" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};



module.exports.wallet_history = async (req, res, next) => {
  const user = await User.findByPk(req.user_id);
  const wallet = await Wallet.findOne({ where: { UserId: user.id } });
  let history = await Transaction.findAll({ where: { walletId: wallet.id } });
  console.log(history, "<=");
  let data = [];
  for (let i = 0; i < history.length; i++) {
    let object = {};
    object.amount = Math.abs(history[i].last_balance - history[i].new_balance);
    object.status = history[i].status;
    object.type = history[i].type;
    object.date = history[i].createdAt;
    object.id = history[i].id;
    data.push(object);
  }
  return res.status(200).json({ data, err: {}, msg: "done" });
};

module.exports.every_wallet_history = async (req, res, next) => {
  const user = await User.findByPk(req.user_id);
  const wallet_id = (await Wallet.findOne({ where: { UserId: user.id } })).id;

  const trans = await transaction.findOne({
    where: { id: req.params.id, WalletId: wallet_id },
  });
  if (!trans) {
    return res.status(500).json({
      data: {},
      err: "there is no transiction with this parametars",
      msg: "failed",
    });
  }
  console.log(trans);
  let object = {};
  object.amount = Math.abs(trans.last_balance - trans.new_balance);
  object.status = trans.status;
  object.type = trans.type;
  object.date = trans.createdAt;
  object.new_balance = trans.new_balance;
  object.last_balance = trans.last_balance;

  return res.status(200).json({ data: object, err: {}, msg: "done" });
};

module.exports.my_favourites = async (req, res, next) => {
  const id = req.user_id;
  let result1 = [],
    result2 = [],
    result3 = [];
  const user = await User.findByPk(id);
  let trips, attraction, destenation;
  trips = await favourites.findAll({
    where: {
      UserId: id,
      AttractionId: null,
      DestenationId: null,
      is_favourite: true,
    },
  });
  attraction = await favourites.findAll({
    where: {
      UserId: id,
      DestenationId: null,
      TripId: null,
      is_favourite: true,
    },
  });
  destenation = await favourites.findAll({
    where: { UserId: id, AttractionId: null, TripId: null, is_favourite: true },
  });

  await Promise.all(
    destenation.map(async (single_dist) => {
      console.log(single_dist);
      single_dist = await Destenation.findByPk(single_dist.DestenationId);
      let image = await Image.findOne({
        where: { DestenationId: single_dist.id },
      });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, DestenationId: single_dist.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          DestenationId: single_dist.id,
          is_favourite: false,
        });
      }
      let dstID = single_dist.id;

      let object = {
        id: single_dist.id,
        name: single_dist.name,
        is_favourite: fav.is_favourite,
      };

      let trips = await Trip.findAll({
        where: { DestenationId: single_dist.id },
      });
      let reservationCount = await Promise.all(
        trips.map(async (single_trip) => {
          let reservations = await Reservation.findAll({
            where: { TripId: single_trip.id },
          });
          return reservations.length;
        })
      );

      object.cnt = reservationCount.reduce((acc, count) => acc + count, 0);
      result3.push(object);
    })
  );

  for (let i = 0; i < attraction.length; i++) {
    let single_attr = await Attraction.findByPk(attraction[i].AttractionId);
    let image = await Image.findOne({
      where: { AttractionId: single_attr.id },
    });
    let fav = await favourites.findOne({
      where: { UserId: req.user_id, AttractionId: single_attr.id },
    });

    if (!fav) {
      fav = await favourites.create({
        UserId: req.user_id,
        AttractionId: single_attr.id,
        is_favourite: false,
      });
    }
    let trpID = single_attr.id;

    let object = {
      id: single_attr.id,
      name: single_attr.name,
      is_favourite: fav.is_favourite,
    };
    let reviews = await every_user_review.findAll({
      where: { AttractionId: single_attr.id },
    });
    let rate = 0.0;
    let cnt = 0;
    reviews.forEach((element) => {
      console.log(element.dataValues);
      if (element.rate) {
        cnt++;
        rate += element.rate;
        console.log(element.rate);
      }
    });
    if (!cnt) rate = 0;
    else {
      rate = (rate * 1.0) / cnt;
    }
    rate = rate.toFixed(1);
    object.rate = rate;
    result2.push(object);
  }

  for (let i = 0; i < trips.length; i++) {
    let single_trip = await Trip.findByPk(trips[i].TripId);
    try {
      let image = await Image.findOne({ where: { TripId: single_trip.id } });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, TripId: single_trip.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          TripId: single_trip.id,
          is_favourite: false,
        });
      }
      let trpID = single_trip.id;

      const diffTime = Math.abs(
        new Date(single_trip.end_date) - new Date(single_trip.start_date)
      );
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      let dist = await Destenation.findByPk(single_trip.DestenationId);

      let reviews = await every_user_review.findAll({
        where: { TripId: single_trip.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        // console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);

      let object = {
        id: single_trip.id,
        name: single_trip.name,
        is_favourite: fav.is_favourite,
        duration: diffDays,
        destenation: dist ? dist.name : null,
        price: single_trip.trip_price,
        rate: rate,
      };
      result1.push(object);
    } catch (innerErr) {
      console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
    }
  }
  result1 = Array.from(new Set(result1));
  result2 = Array.from(new Set(result2));
  result3 = Array.from(new Set(result3));

  return res.status(200).json({
    data: { trips: result1, attraction: result2, destenation: result3 },
    msg: "Done",
  });
};

module.exports.get_Notifications = async (req, res, next) => {
  const user = await User.findByPk(req.user_id);
  let notif = await Notification_mod.findAll({ where: { UserId: user.id } });
  return res.status(200).json({ data: notif, err: {}, msg: {} });
};
module.exports.get_reserved_trips = async (req, res, next) => {
  const user = await User.findByPk(req.user_id);

  let result = [];
  let rrr = await Reservation.findAll({ where: { UserId: user.id } });
  let trips = [];
  rrr.forEach((element) => {
    trips.push(element.TripId);
  });

  trips = Array.from(new Set(trips));
  for (let i = 0; i < trips.length; i++) {
    single_trip = await Trip.findByPk(trips[i]);
    let reservation = await Reservation.findOne({
      where: {
        UserId: user.id,
        TripId: single_trip.id,
      },
    });
    console.log(reservation);
    try {
      let dist = await Destenation.findByPk(single_trip.DestenationId);

      let object = {
        id: reservation.id,
        name: single_trip.name,
        destenation: dist ? dist.name : null,
        adult: reservation.adult,
        child: reservation.child,
        start_date: single_trip.start_date,
      };

      result.push(object);
    } catch (innerErr) {
      console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
    }
  }
  return res.status(200).json({ data: result, err: {}, msg: {} });
};

module.exports.every_reserved_trip = async (req, res, next) => {
  let data = {};

  try {
    const reservation = await Reservation.findByPk(req.params.id);
    const user = await User.findByPk(req.user_id);
    const trip = await Trip.findByPk(reservation.TripId);
    let optionalEvents = await everyReservationEvent.findAll({
      where: { reservationId: reservation.id },
    });
    let events = [];
    for (let i = 0; i < optionalEvents.length; i++) {
      let optional = optionalEvents[i];
      let event = await Event.findByPk(optional.EventId);
      let name = event.action;
      let object = {};
      if (optional.title) name += " " + event.title;
      else {
        name += " " + (await Attraction.findByPk(event.AttractionId)).name;
      }
      object.name = name;
      object.adult = optional.adult;
      object.child = optional.child;
      object.price_adult = event.price_adult;
      object.price_child = event.price_child;
      events.push(object);
    }
    data.events = events;
    data.bookingId = reservation.id;
    data.name = trip.name;
    data.destenation = await Destenation.findByPk(trip.DestenationId).name;
    data.meetingPoint = trip.meeting_point_location;
    data.startDate = trip.start_date;
    data.endDate = trip.end_date;
    data.adult = reservation.adult;
    data.child = reservation.child;
    data.phone_number = reservation.phone;
    data.tripId = trip.id;
  } catch (err) {
    return res.status(500).json({ data: {}, err: "err", msg: "failed" });
  }
  return res.status(200).json({ data, err: {}, msg: "done" });
};

module.exports.remaining_time = async (req, res, next) => {
  const user = await User.findByPk(req.user_id);
  let trips_id = await reservation.findAll({ where: { UserId: user.id } });
  let name = null;
  let trips = [];
  for (let trip of trips_id) {
    let curTrip = await Trip.findByPk(trip.TripId);
    // console.log(curTrip.start_date,moment().toDate());
    if (curTrip.start_date > moment().toDate()) {
      trips.push(curTrip);
    }
  }
  trips.sort((a, b) => a.start_date - b.start_date);
  let obj = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (trips.length > 0) {
    const now = moment().toDate();
    const start = trips[0].start_date;
    // console.log(now, start);
    obj = await services.getTimeDifference(now, start);
    console.log(obj);
  }
  return res.json(obj);
};

module.exports.get_customer = async (req, res, next) => {
  const user = await User.findByPk(req.user_id);

  return res
    .status(200)
    .json({ data: user.customerStripId, err: "", msg: "done" });
};
module.exports.attraction_search = async (req, res, next) => {
  try {
    const userId = req.user_id;
    let attractions = [];
    let { destination } = req.query
    destination = await Destenation.findAll({
      where: {
        name: {
          [Op.like]: `${destination}%`,
        },
      },
    });

    if (destination.length === 0) {
      return res.status(404).json({ msg: "No result found1", data: null });
    }

    let attr = await Attraction.findAll({
      where: {
        DestenationId: destination.map((d) => d.id),
      },
    });

    if (attr.length === 0) {
      return res.status(404).json({ msg: "No result found2", data: null });
    }

    for (let i = 0; i < attr.length; i++) {
      let single_attr = attr[i];
      let image = await Image.findOne({
        where: { AttractionId: single_attr.id },
        attributes: ["url"],
        limit: 1,
        order: [["id", "ASC"]],
      });
      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: single_attr.id },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: single_attr.id,
          is_favourite: false,
        });
      }

      let object = {
        id: single_attr.id,
        name: single_attr.name,
        image: image,
        is_favourite: fav.is_favourite,
      };
      let reviews = await every_user_review.findAll({
        where: { AttractionId: single_attr.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        console.log(element.dataValues);
        if (element.rate) {
          cnt++;
          rate += element.rate;
          console.log(element.rate);
        }
      });
      if (!cnt) rate = 0;
      else {
        rate = (rate * 1.0) / cnt;
      }
      rate = rate.toFixed(1);
      object.rate = rate;
      attractions.push(object);
    }
    attractions.sort((b, a) => a.rate - b.rate);

    return res.status(200).json({ data: { attractions } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.destination_single_image = async (req, res, next) => {
  const destination_id = req.params.id;
  try {
    let image = await Image.findAll({
      where: {
        DestenationId: destination_id,
      },
      attributes: ['url'],
    });

    let firstImage = image.length > 0 ? image[0] : null;

    return res.status(200).json({ data: { firstImage } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.attraction_single_image = async (req, res, next) => {
  const attraction_id = req.params.id;
  try {
    let image = await Image.findAll({
      where: {
        AttractionId: attraction_id,
      },
      attributes: ['url'],
    });

    let firstImage = image.length > 0 ? image[0] : null;

    return res.status(200).json({ data: { firstImage } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.trip_single_image = async (req, res, next) => {
  const trip_id = req.params.id;
  try {
    let image = await Image.findAll({
      where: {
        TripId: trip_id,
      },
      attributes: ['url'],
    });

    let firstImage = image.length > 0 ? image[0] : null;

    return res.status(200).json({ data: { firstImage } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.all_trip_images = async (req, res, next) => {
  const trip_id = req.params.id;
  try {
    let images = await Image.findAll({
      where: {
        TripId: trip_id,
      },
      attributes: ['url'],
    });

    return res.status(200).json({ data: { images } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.all_attraction_images = async (req, res, next) => {
  const attraction_id = req.params.id;
  try {
    let images = await Image.findAll({
      where: {
        AttractionId: attraction_id,
      },
      attributes: ['url'],
    });

    return res.status(200).json({ data: { images } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.all_destination_images = async (req, res, next) => {
  const destination_id = req.params.id;
  try {
    let images = await Image.findAll({
      where: {
        DestenationId: destination_id,
      },
      attributes: ['url'],
    });

    return res.status(200).json({ data: { images } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.reservation_trip_image = async (req, res, next) => {
  const reservation_id = req.params.id;
  try {
    let reservation0 = await reservation.findByPk(reservation_id,
      {
        attributes: ['TripId']
      }
    );
    let trip_id = reservation0.TripId;

    let image = await Image.findAll({
      where: {
        TripId: trip_id,
      },
      attributes: ['url'],
    });

    let firstImage = image.length > 0 ? image[0] : null;

    return res.status(200).json({ data: { firstImage } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.add_profile_pic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded.", data: null });
    }

    const user = await User.findOne({ where: { id: req.user_id } });
    if (!user) {
      return res.status(404).json({ msg: "User not found.", data: null });
    }

    user.profile_pic = `http://localhost:3000/uploads/${req.file.filename}`;
    await user.save();

    return res.status(200).json({ msg: "Profile picture updated successfully", data: {} });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.token_profile_pic = async (req, res, next) => {
  try {

    const pic = await User.findOne({
      where: {
        id: req.user_id
      },
      attributes: [
        'profile_pic',
      ],
    });

    if (!pic) {
      return res.status(404).json({ msg: "No profile_pic", data: null });
    }

    return res.status(200).json({ msg: {}, data: { pic } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.id_profile_pic = async (req, res, next) => {
  const user_id = req.params.id;
  try {
    const pic = await User.findOne({
      where: {
        id: user_id
      },
      attributes: [
        'profile_pic',
      ],
    });

    if (!pic) {
      return res.status(404).json({ msg: "No profile_pic", data: null });
    }

    return res.status(200).json({ msg: {}, data: { pic } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.personal_reservation = async (req, res, next) => {
  try {
    const rese = await reservation.findAll({
      where: {
        UserId: req.user_id
      },
      attributes: ['id', 'adult', 'child', 'TripId'],
      include: [
        {
          model: Trip,
          attributes: ['name', 'start_date'],
          include: [
            {
              model: Destenation,
              attributes: ['name'],
            }
          ]
        }
      ]
    });

    if (!rese || rese.length === 0) {
      return res.status(404).json({ msg: "No reservations found", data: null });
    }

    return res.status(200).json({ msg: {}, data: rese });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.delete_account_request = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ msg: "User not found", data: null });
    }

    const check = await Delete_Request.findAll({
      where: {
        UserId: user_id,
      },
    });

    if (check.length > 0) {
      return res.status(202).json({ msg: "You have sent the request before, please wait for the response.", data: null });
    }
    console.log(check.lenght);
    await Delete_Request.create({
      UserId: user.id
    });

    return res.status(200).json({ msg: "We will respond to your request soon..", data: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.check_password = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user_id } });

    if (!user) {
      return res.status(404).json({ msg: "User not found", err: "User with the provided ID not found", data: {} });
    }

    if (!req.body.password || !user.password) {
      return res.status(400).json({ msg: "Bad Request", err: "Invalid password data", data: {} });
    }

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ msg: "fault", err: "Invalid password" });
    }

    return res.status(200).json({ msg: "success", data: { authenticated: true } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.reservation_details = async (req, res, next) => {
  try {
    let reservation = await Reservation.findByPk(req.params.id, {
      attributes: [
        'adult',
        'child',
        'phone',
        'email',
        'TripId'
      ],
    });
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found", err: "Reservation with the provided ID not found", data: {} });
    }
    let trip_id = reservation.TripId;
    // console.log(trip_id);
    let trip = await Trip.findByPk(trip_id, {
      attributes: [
        'id',
        'name',
        'start_date',
        'end_date',
        'meeting_point_location',
        'DestenationId',
        'trip_price',
        'TimeLimitCancellation'
      ]
    });
    let dest_id = trip.DestenationId;
    let destination = await Destenation.findByPk(dest_id, {
      attributes: [
        'name',
      ],
    });
    let reserved_events = await everyReservationEvent.findAll({
      where: {
        reservationId: req.params.id,
      },
      attributes: [
        'adult',
        'child',
        'EventId'
      ],
      include: {
        model: Event,
        attributes: ['title', 'price_adult', 'price_child'],
      },
    });

    let events = [];
    let events_price = 0;

    for (let i = 0; i < reserved_events.length; i++) {
      const event = await Event.findOne({
        where: {
          id: reserved_events[i].EventId,
        },
        attributes: ['id', 'price_adult', 'price_child']
      });

      if (event) {
        let event_price = (reserved_events[i].adult * event.price_adult) + (reserved_events[i].child * event.price_child);
        events_price += event_price;
        events.push(event);
      }
    }
    let details = {};
    details.trip_name = trip.name;
    details.destination = destination.name;
    details.meeting_point = trip.meeting_point_location;
    details.from = trip.start_date;
    details.to = trip.end_date;
    details.adults = reservation.adult;
    details.children = reservation.child;
    details.phone_number = reservation.phone;
    details.email = reservation.email;
    details.trip_price = trip.trip_price;
    details.total_price = events_price + trip.trip_price;
    //details.events_price = events_price;

    let start_date = new Date(trip.start_date);

    if (isNaN(start_date)) {
      console.error('Invalid start_date format:', trip.start_date);
      return res.status(400).json({ msg: "Invalid start date format", data: null });
    }

    let time_limit_cancelation = trip.TimeLimitCancellation;

    let last_cancellation_date = new Date(start_date);
    last_cancellation_date.setDate(start_date.getDate() - time_limit_cancelation);

    let date_to_disable_edit_and_cancellation = last_cancellation_date.toISOString().split('T')[0];

    console.log("Last date for cancellation: " + date_to_disable_edit_and_cancellation);
    return res.status(200).json({ msg: "success", data: { details, reserved_events, date_to_disable_edit_and_cancellation } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.delete_reservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ msg: "Reservation not found", err: "Reservation with the provided ID not found", data: {} });
    }
    let trip_id = reservation.TripId;
    let trip = await Trip.findByPk(trip_id);
    let start_date = new Date(trip.start_date);

    if (isNaN(start_date)) {
      console.error('Invalid start_date format:', trip.start_date);
      return res.status(400).json({ msg: "Invalid start date format", data: null });
    }

    let time_limit_cancelation = trip.TimeLimitCancellation;

    let last_cancellation_date = new Date(start_date);
    last_cancellation_date.setDate(start_date.getDate() - time_limit_cancelation);

    let currentDate = new Date();
    console.log(currentDate);
    currentDate.setHours(0, 0, 0, 0);

    last_cancellation_date.setHours(0, 0, 0, 0);

    if (currentDate > last_cancellation_date) {
      return res.status(400).json({ msg: "Cancellation is not allowed after the last cancellation date.", data: null });
    }

    await reservation.destroy();
    return res.status(200).json({ msg: "Your reservation was deleted successfully!", data: null });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};


// module.exports.edit_reservation = async (req, res, next) => {
//   try {
//     let old_total = 0, new_total = 0, price = 0;

//     let reservation = await Reservation.findByPk(req.params.id);
//     if (!reservation) {
//       return res.status(404).json({
//         msg: "Reservation not found",
//         err: "Reservation with the provided ID not found",
//         data: {},
//       });
//     }
//     //////////////////////////////////////////////////////////
//     let req_travelars = (reservation.adult) + (reservation.child);

//     let trip_id = reservation.TripId;
//     let trip = await Trip.findByPk(trip_id);

//     old_total = (reservation.adult + reservation.child) * trip.total_price;

//     let reserved = await everyReservationEvent.findAll({
//       where: {
//         reservationId: req.params.id,
//       },
//     });
//     for (let i = 0; i < reserved.length; i++) {
//       let event = reserved[i];
//       price = (event.child * event.price_child) + (event.adult * event.price_adult);
//       old_total += price;
//     }
//     /////////////////////////////////////////////////////////
//     let availabl_cap = trip.available_capacity + req_travelars;

//     let day = await DayTrips.findAll({
//       where: {
//         TripId: trip_id
//       }
//     });

//     let static_events = [];
//     for (let i = 0; i < day.length; i++) {
//       let event = await Event.findAll({
//         where: {
//           DayTripId: day[i].id,
//         }
//       });
//       static_events.push(event);
//     }

//     let start_date = new Date(trip.start_date);
//     if (isNaN(start_date)) {
//       console.error("Invalid start_date format:", trip.start_date);
//       return res.status(400).json({ msg: "Invalid start date format", data: null });
//     }

//     let time_limit_cancelation = trip.TimeLimitCancellation;
//     let last_cancellation_date = new Date(start_date);
//     last_cancellation_date.setDate(start_date.getDate() - time_limit_cancelation);

//     let currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0);
//     last_cancellation_date.setHours(0, 0, 0, 0);

//     if (currentDate > last_cancellation_date) {
//       return res.status(400).json({
//         msg: "Editing is not allowed after the last cancellation date.",
//         data: null,
//       });
//     }

//     reservation.adult = req.body.adult;
//     reservation.child = req.body.child;
//     reservation.phone = req.body.phone;
//     reservation.email = req.body.email;
//     await reservation.save();

//     const reservedEventCount = req.body.reserved_events.length;

//     new_total = (req.body.adult * trip.total_price) + (req.body.child * trip.total_price);

//     // for (let i = 0; i < reservedEventCount; i++) {
//     //   let event = reserved[i];
//     //   new_total += (req.body.event.adult * trip.total_price) + (req.body.event.adult * trip.total_price);
//     // }
//     for (let i = 0; i < reserved.length; i++) {
//       let event = reserved[i];
//       let updatedEvent = req.body.reserved_events.find(e => e.id === event.EventId);
//       if (updatedEvent) {
//         event.adult = updatedEvent.adult;
//         event.child = updatedEvent.child;
//         await event.save();
//       }
//     }
//     //////////////////////////////////
//     let n_res_travelers = req.body.adult + req.body.child;
//     let new_cap = availabl_cap - n_res_travelers;

//     if (new_cap === 0) {
//       return res.status(400).json({ msg: "No available capacity!", data: null });
//     }

//     trip.available_capacity = new_cap;
//     await trip.save();

//     const existingEventIds = reserved.map(e => e.EventId);
//     for (let i = 0; i < reservedEventCount; i++) {
//       let eventData = req.body.reserved_events[i];
//       if (!existingEventIds.includes(eventData.id)) {
//         await everyReservationEvent.create({
//           reservationId: req.params.id,
//           EventId: eventData.id,
//           adult: eventData.adult,
//           child: eventData.child
//         });
//       }
//     }

//     for (let i = 0; i < reserved.length; i++) {
//       let event = reserved[i];
//       if (!req.body.reserved_events.find(e => e.id === event.EventId)) {
//         await event.destroy();
//       }
//     }

//     return res.status(200).json({ msg: "Your reservation was edited successfully!", data: { new_cap } });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ msg: "Internal server error.", data: null });
//   }
// };

// module.exports.edit_reservation = async (req, res, next) => {
//   try {
//     let old_total = 0;
//     let new_total = 0;

//     const reservation = await Reservation.findByPk(req.params.id);
//     if (!reservation) {
//       return res.status(404).json({
//         msg: "Reservation not found",
//         err: "Reservation with the provided ID not found",
//         data: {},
//       });
//     }

//     const trip = await Trip.findByPk(reservation.TripId);
//     if (!trip) {
//       return res.status(404).json({
//         msg: "Trip not found",
//         err: "Trip associated with the reservation not found",
//         data: {},
//       });
//     }

//     // Calculate old total based on existing reservation and events
//     old_total = (reservation.adult + reservation.child) * trip.total_price;
//     console.log(old_total);
//     const reservedEvents = await everyReservationEvent.findAll({
//       where: { reservationId: req.params.id }
//     });

//     for (const event of reservedEvents) {
//       old_total += (event.child * event.price_child) + (event.adult * event.price_adult);
//     }

//     // Update reservation details
//     reservation.adult = req.body.adult;
//     reservation.child = req.body.child;
//     reservation.phone = req.body.phone;
//     reservation.email = req.body.email;
//     await reservation.save();

//     // Calculate new total based on updated reservation and events
//     new_total = (req.body.adult * trip.total_price) + (req.body.child * trip.total_price);

//     for (const eventData of req.body.reserved_events) {
//       const event = await Event.findByPk(eventData.id);
//       if (event && event.type === "optional") {
//         new_total += (eventData.adult * event.price_adult) + (eventData.child * event.price_child);
//       }
//     }

//     // Update reserved events
//     for (const event of reservedEvents) {
//       const updatedEvent = req.body.reserved_events.find(e => e.id === event.EventId);
//       if (updatedEvent) {
//         event.adult = updatedEvent.adult;
//         event.child = updatedEvent.child;
//         await event.save();
//       }
//     }

//     // Update trip's available capacity
//     const totalTravelers = req.body.adult + req.body.child;
//     const newCapacity = trip.available_capacity - totalTravelers;

//     if (newCapacity < 0) {
//       return res.status(400).json({ msg: "Not enough available capacity!", data: null });
//     }

//     trip.available_capacity = newCapacity;
//     await trip.save();

//     return res.status(200).json({ msg: "Your reservation was edited successfully!", data: { new_total, old_total } });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ msg: "Internal server error.", data: null });
//   }
// };

module.exports.add_personal_trip = async (req, res, next) => {
  await Personal_trip.create({ name: "ZZZZAAAANNAASS" });
  const per = await Personal_trip.findOne({ where: { name: "ZZZZAAAANNAASS" } });

  try {
    let name = req.body.name,
      DestenationId = req.body.DestenationId,
      start_date = req.body.start_date,
      notes = req.body.notes,
      duration = req.body.duration;


    let err = await Destenation.findByPk(DestenationId);

    if (!err) {
      await per.destroy();
      return res.status(500).json({ msg: "fault", err: "Destenation is not exist" });
    }

    for (let i = 1; i <= duration; i++) {
      await Personal_day_trip.create({
        PersonalTripId: per.id,
        num: i
      });
    }

    const attractionPromises = req.body.attractions.map(attraction => {
      return AttractionForPersonal.create({
        PersonalTripId: per.id,
        AttractionId: attraction
      });
    });

    await Promise.all(attractionPromises);
    per.name = name;
    per.DestenationId = DestenationId;
    per.start_date = start_date;
    per.UserId = req.user_id;
    per.duration = duration;
    per.notes = notes;
    await per.save();

    return res.status(200).json({ msg: "Added!", data: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.show_all_personal_trips = async (req, res, next) => {
  try {
    let trips = [];
    const personal_trip = await Personal_trip.findAll({
      where: {
        UserId: req.user_id,
      },
      attributes: [
        'name', 'duration', 'DestenationId', 'start_date'
      ],
      include: {
        model: Destenation,
        attributes: [
          'name',
        ],
      }
    });

    return res.status(200).json({ msg: {}, data: { personal_trip } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.add_personal_events = async (req, res, next) => {
  try {
    let action = req.body.action,
      title = req.body.title,
      duration = req.body.duration,
      PersonalDayId = req.body.PersonalDayId;

    let err = await Personal_day_trip.findByPk(PersonalDayId);

    if (!err) {
      return res.status(500).json({ msg: "fault", err: "Day is not exist" });
    }

    await Personal_event.create({
      title: title,
      action: action,
      duration: duration,
      PersonalDayId: PersonalDayId
    });

    return res.status(200).json({ msg: "Added!", data: null });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

// module.exports.personalTripInfo1 = async (req, res, next) => {
//   try {
//     let destination = [];
//     const trip_id = req.params.id;
//     let trip = await Personal_trip.findByPk(trip_id, {
//       attributes: ['DestenationId'],
//     })
//     if (!trip) {
//       return res.status(404).json({ msg: "Personal trip not found.", data: null });
//     }
//     destination = await Destenation.findByPk(trip.DestenationId);
//     let fav = await favourites.findOne({
//       where: { UserId: req.user_id, DestenationId: destination.id },
//     });

//     if (!fav) {
//       fav = await favourites.create({
//         UserId: req.user_id,
//         DestenationId: destination.id,
//         is_favourite: false,
//       });
//     }
//     let is_favourite = fav.is_favourite;
//     destination.dataValues.is_favourite = is_favourite;
//     let attractions = await AttractionForPersonal.findAll({
//       where: {
//         PersonalTripId: trip_id,
//       },
//     });

//     let detailedAttractions = await Promise.all(attractions.map(async (att) => {
//       let attraction = await Attraction.findByPk(att.AttractionId);
//       let name = attraction.name;

//       let fav = await favourites.findOne({
//         where: { UserId: req.user_id, AttractionId: att.AttractionId },
//       });

//       if (!fav) {
//         fav = await favourites.create({
//           UserId: req.user_id,
//           AttractionId: att.AttractionId,
//           is_favourite: false,
//         });
//       }

//       let is_favourite = fav.is_favourite;

//       // Return a new object that includes the original data and the new properties
//       return {
//         ...att.dataValues,
//         name,
//         is_favourite
//       };
//     ));

//     let reviews = await every_user_review.findAll({
//       where: { AttractionId: attraction.id },
//     });
//     let rate = 0.0;
//     let cnt = 0;
//     reviews.forEach((element) => {
//       //console.log(element.dataValues);
//       if (element.rate) {
//         cnt++;
//         rate += element.rate;
//         console.log(element.rate);
//       }
//     });
//     if (!cnt) rate = 0;
//     else {
//       rate = (rate * 1.0) / cnt;
//     }
//     rate = rate.toFixed(1);
//     att.rate = rate;
//     attractions.dataValues.is_favourite = is_favourite;
//   }
//   return res.status(200).json({ msg: {}, data: { destination, attractions: detailedAttractions } });

// } catch (error) {
//   console.error(error);
//   return res.status(500).json({ msg: "Internal server error.", data: null });
// }
// };

module.exports.personalTripInfo1 = async (req, res, next) => {
  try {
    const trip_id = req.params.id;

    // Fetch the personal trip and check if it exists
    let trip = await Personal_trip.findByPk(trip_id, {
      attributes: ['DestenationId'],
    });

    if (!trip) {
      return res.status(404).json({ msg: "Personal trip not found.", data: null });
    }

    // Fetch the destination and handle the favorite status
    let destination = await Destenation.findByPk(trip.DestenationId);

    if (!destination) {
      return res.status(404).json({ msg: "Destination not found.", data: null });
    }

    let fav = await favourites.findOne({
      where: { UserId: req.user_id, DestenationId: destination.id },
    });

    if (!fav) {
      fav = await favourites.create({
        UserId: req.user_id,
        DestenationId: destination.id,
        is_favourite: false,
      });
    }

    destination.dataValues.is_favourite = fav.is_favourite;

    // Fetch the attractions for the personal trip
    let attractions = await AttractionForPersonal.findAll({
      where: {
        PersonalTripId: trip_id,
      },
      attributes: ['id', 'AttractionId']
    });

    // Process each attraction
    let detailedAttractions = await Promise.all(attractions.map(async (att) => {
      let attraction = await Attraction.findByPk(att.AttractionId);
      if (!attraction) return null;  // Skip if attraction is not found

      let fav = await favourites.findOne({
        where: { UserId: req.user_id, AttractionId: att.AttractionId },
      });

      if (!fav) {
        fav = await favourites.create({
          UserId: req.user_id,
          AttractionId: att.AttractionId,
          is_favourite: false,
        });
      }

      let reviews = await every_user_review.findAll({
        where: { AttractionId: attraction.id },
      });

      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
        if (element.rate) {
          cnt++;
          rate += element.rate;
        }
      });

      rate = cnt ? (rate / cnt).toFixed(1) : "0.0";

      // Return the detailed attraction object
      return {
        ...att.dataValues,
        name: attraction.name,
        is_favourite: fav.is_favourite,
        rate: rate
      };
    }));

    // Remove any null entries in case an attraction was not found
    detailedAttractions = detailedAttractions.filter(attr => attr !== null);

    return res.status(200).json({ msg: "Success", data: { destination, attractions: detailedAttractions } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.personalTripInfo2 = async (req, res, next) => {
  try {
    const trip_id = req.params.id;
    let days = await Personal_day_trip.findAll({
      where: {
        PersonalTripId: trip_id
      },
      attributes: ['num'],
      include: [{
        model: Personal_event,
        attributes: ['id', 'action', 'title', 'duration'],
      }],
    });
    
    let data = [];
    

    return res.status(200).json({ msg: "Success", data: { days } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }

};

module.exports.personalTripInfo3 = async(req,res,next)=>{
  try{
    const trip_id = req.params.id;
    let trip = await Personal_trip.findByPk(trip_id);
    return res.status(200).json({ msg: "Success", data: { trip } });

  }catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
}