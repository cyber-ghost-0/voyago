const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mail = require("../../services/Mails");
const services = require("../../services/public");
const BP = require("body-parser");
const Joi = require("joi");
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
  if (is_stripe) nw = parseInt(wallet.balance) - parseInt(cost);
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
  let Atr = await Attraction.findAll();
  let arr = [];
  for (let i = 0; i < Atr.length; i++) {
    let cur = Atr[i].dataValues;
    let all_images = await Atr[i].getImages();
    let URL_images = [];
    all_images.forEach((element) => {
      URL_images.push(element.image);
    });
    cur.images = URL_images;
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
      price,
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
        ],
      });
    }

    if (trips_00.length === 0) {
      return res.status(404).json({ err: "No trips found" });
    }

    if (price) {
      trips_01 = await Trip.findAll({
        where: {
          avilable: { [Op.eq]: 1 },
          trip_price: price,
        },
        include: [
          {
            model: Destenation,
            attributes: ["name"],
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

    const favoriteTripIds = favorites.map((f) => f.TripId);

    trips_1 = trips_1.map((trip) => ({
      ...trip.toJSON(),
      favorites: favoriteTripIds.includes(trip.id),
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

  const charge_req = await ChargeRequest.create({
    UserId: user_id,
    bank_ticket: bank_ticket,
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
  await Notification_mod.create({
    UserId: user_id,
    title: title,
    body: body,
    type: "wallet",
  });
  Notification.notify(fcm.token, title, body, res, next);
  // return res
  //   .status(200)
  //   .json({ data: {}, err: {}, msg: "wait for admin response <3" });
};

module.exports.my_reviwes = async (req, res, next) => {
  const id = req.user_id;
  const user = await User.findByPk(id);
  let trips, attraction, destenation;
  trips = await every_user_review.findAll({
    where: { UserId: id, AttractionId: null, DestenationId: null },
  });
  attraction = await every_user_review.findAll({
    where: { UserId: id, DestenationId: null, TripId: null },
  });
  destenation = await every_user_review.findAll({
    where: { UserId: id, AttractionId: null, TripId: null },
  });
  let trip_n = [],
    attr_n = [],
    dest_n = [];
  for (let i = 0; i < trips.length; i++) {
    let element = trips[i];
    element = await services.removeProperty(element.dataValues, "AttractionId");
    element = await services.removeProperty(element, "TripId");
    element = await services.removeProperty(element, "DestenationId");
    trip_n.push(element);
    console.log("=>", element, "<=");
  }
  for (let i = 0; i < destenation.length; i++) {
    let element = destenation[i];
    element = await services.removeProperty(element.dataValues, "AttractionId");
    element = await services.removeProperty(element, "TripId");
    element = await services.removeProperty(element, "DestenationId");
    dest_n.push(element);
  }
  for (let i = 0; i < attraction.length; i++) {
    let element = attraction[i];

    element = await services.removeProperty(element.dataValues, "AttractionId");
    element = await services.removeProperty(element, "TripId");
    element = await services.removeProperty(element, "DestenationId");
    attr_n.push(element);
  }
  return res
    .status(200)
    .json({ data: { trip_n, dest_n, attr_n }, err: {}, msg: "done" });
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
