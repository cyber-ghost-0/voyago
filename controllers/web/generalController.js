const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mail = require("../../services/Mails");
const services = require("../../services/public");
const BP = require("body-parser");
const Joi = require("joi");
const { Op, INTEGER } = require("sequelize");
const validateImageUpload = require("../../middleware/imageValidation.js");
//const Image = require("../../models/image");
const multer = require("multer");
const path = require("path");
const Admin = require("../../models/Admin");
const User = require("../../models/User");
const Trip = require("../../models/Trip");
const Image = require("../../models/image");
const Features_included = require("../../models/features_included");
const Every_feature = require("../../models/every_feture");
const Event = require("../../models/Event");
const Day_trip = require("../../models/Day_trip");
const Attraction = require("../../models/Attraction");
const db = require("../../util/database");
const Destenation = require("../../models/Destenation");
const image = require("../../models/image");
const Transaction = require("../../models/transaction.js");
const ChargeRequest = require("../../models/chargeRequest");
const Wallet = require("../../models/wallet");
const FCM = require("../../models/FCM_Tokens");
const { use } = require("../../routes/app/auth.js");
const every_user_review = require("../../models/EveryUserReview.js");
const Notification = require("../../services/Notification.js");
const reservation = require("../../models/reservation.js");
const Notification_mod = require("../../models/Notification.js");
const favourites = require("../../models/FCM_Tokens");
const Favourite = require("../../models/Favourites.js");
const DayTrips = require("../../models/Day_trip.js");
const every_feature = require("../../models/every_feture.js");
const features_included = require("../../models/features_included.js");
const { where } = require("sequelize");
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
  return schema.validate(info);
}
function validateUserInfo2(info) {
  const schema = Joi.object({
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
  return schema.validate(info);
}

async function is_unique(name, model, col) {
  const whereClause = {};
  whereClause[col] = name;

  console.log(whereClause);
  let admin = await model.findOne({ where: whereClause });
  return admin;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cd) => {
    cd(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: '100000000' },
  fileFilter: (req, file, cd) => {
    const fileTypes = /jpeg|jpg|png|gif|bmp/
    const mimeType = fileTypes.test(file.mimetype)
    const extname = fileTypes.test(path.extname(file.originalname))
    if (mimeType && extname) {
      return cd(null, true)
    }
    cd('Give  proper files formate to upload')
  }
}).array('image', 30);

module.exports = {
  storage,
  upload
};

module.exports.users = async (req, res, next) => {
  try {
    const users = await User.findAll();
    for (let i = 0; i < users.length; i++) {
      const id = users[i].id;
      let balance = await Wallet.findOne({ where: { UserId: id } });
      balance = balance.balance;
      console.log(balance, users[i]);
      users[i].dataValues.balance = balance;
    }
    return res.json({ msg: "Done!", users: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ msg: "fault", err: "Internal Server Error" });
  }
};

module.exports.add_user = async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    let { error } = validateUserInfo(req.body);
    // console.log(error);

    if (error) {
      return res
        .status(400)
        .json({ msg: "fault", err: error.details[0].message });
    }
    if (
      (await is_unique(email, User, "email")) ||
      (await is_unique(username, User, "username"))
    ) {
      return res
        .status(500)
        .json({ msg: "fault", err: "emai/username isn't unique" });
    }
    let cod = "" + services.generateCod();
    mail(req.body.email, "Admin added you to the app");
    // console.log(cod,req.body.email)
    await bcrypt
      .hash(password, 12)
      .then(async (hashpassword) => {
        await User.create({
          username: username,
          password: hashpassword,
          email: email,
          role: "user",
          cod_ver: cod,
        });
      })
      .catch((err) => {
        return res.json({
          msg: "fault",
          data: {},
        });
        console.log(err);
      });
    let response = { msg: "user added" };
    let id = await services.get_user_by_any(username, User, "username");
    id = id.dataValues.id;
    // console.log('=>'+id+'<=');
    await Wallet.create({ balance: 0, UserId: id });

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "fault", err: "An error occurred while Adding user" });
  }
};

module.exports.delete_user = async (req, res, next) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(500).json({ msg: "fault", err: "User is not exist!" });
  }
  user.destroy();
  return res.json({ msg: "DONE!" }).status(200);
};

module.exports.admins = async (req, res, next) => {
  try {
    const admins = await Admin.findAll();
    return res.status(200).json({ msg: "Done!", admins: admins });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ msg: "fault", err: "Internal Server Error" });
  }
};

module.exports.add_admin = async (req, res, next) => {
  try {
    const username = req.body.username;
    const role = req.body.role;
    const password = req.body.password;
    const email = req.body.email;
    if (await is_unique(email, Admin, "email")) {
      return res
        .status(500)
        .json({ msg: "fault", err: "There is another admin with this email" });
    }
    mail(req.body.email, "you have added as admin in voyago !");
    // console.log(cod,req.body.email)
    bcrypt
      .hash(password, 12)
      .then(async (hashpassword) => {
        await Admin.create({
          username: username,
          password: hashpassword,
          email: email,
          role: role,
          cod_ver: null,
        });
      })
      .catch((err) => {
        console.log(err);
      });
    let response = { msg: "new admin added" };

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "fault", err: "An error occurred while Adding admin" });
  }
};

module.exports.delete_admin = async (req, res, next) => {
  const admin = await Admin.findByPk(req.params.id);
  if (!admin) {
    return res.status(500).json({ msg: "fault", err: "Admin is not exist!" });
  }
  admin.destroy();
  return res.status(200).json({ msg: "DONE|" }).status(200);
};

module.exports.show_admin = async (req, res, next) => {
  const admin = await Admin.findByPk(req.params.id);
  if (!admin) {
    return res.status(500).json({ msg: "fault", err: "Admin is not exist!" });
  }
  return res
    .json({ msg: "DONE!", data: { admin: admin }, err: "" })
    .status(200);
};

module.exports.show_user = async (req, res, next) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(500).json({ msg: "fault", err: "user is not exist!" });
  }
  const reservations = await reservation.findAll({
    where: {
      UserId: req.params.id,
    },
  })
  return res.json({ msg: "DONE!", data: { user: user, reservations: reservations }, err: "" }).status(200);
};

module.exports.show_features_included = async (req, res, next) => {
  try {
    const features = await Features_included.findAll();
    return res.status(200).json({ msg: "Done!", features: features });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ dat: {}, msg: "fault", err: "Internal Server Error" });
  }
};

module.exports.add_features_included = async (req, res, next) => {
  try {
    const feature = req.body.feature,
      type = req.body.type;
    Features_included.create({ name: feature, type: type });
    return res.status(200).json({ msg: "Added!" });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ data: {}, msg: "fault", err: "Internal Server Error" });
  }
};

module.exports.add_trip = async (req, res, nxt) => {
  await Trip.create({ name: "ZZZZAAAANNAASS" });
  const trp = await Trip.findOne({ where: { name: "ZZZZAAAANNAASS" } });

  try {
    let name = req.body.name,
      DestenationId = req.body.destenation_id,
      start_date = req.body.start_date,
      price = req.body.price,
      capacity = req.body.capacity,
      description = req.body.description,
      //images,
      features,
      meeting_point_location = req.body.meeting_point_location,
      TimeLimitCancellation = req.body.TimeLimitCancellation;
    let end_date = new Date(start_date);

    // Add the duration in days
    //images = req.body.images;
    features = req.body.features;
    let days = [];
    days = req.body.days || [];
    console.log(days);
    end_date.setDate(end_date.getDate() + days.length);
    let err = await Destenation.findByPk(DestenationId);
    if (!err) {
      await trp.destroy();

      return res
        .status(500)
        .json({ msg: "fault", err: "Destenation is not exist" });
    }
    err = await is_unique(name, Trip, "name");
    if (err) {
      await trp.destroy();

      return res.status(500).json({ msg: "fault", err: "name is not unique" });
    }
    // for (let i = 0; i < images.length; i++) {
    //   let image = images[i];
    //   console.log(trp.id);
    //   await Image.create({ image: image, TripId: trp.id });
    // }
    for (let i = 0; i < features.length; i++) {
      let feature = features[i];
      err = await Features_included.findByPk(feature);
      if (!err) {
        await trp.destroy();
        return res
          .json({ msg: "fault", err: "featureId not exist" })
          .status(500);
      }
    }

    features.forEach(async (feature) => {
      await Every_feature.create({
        featuresIncludedId: feature,
        TripId: trp.id,
      });
    });
    let dur = 2;
    let cnt = 0;
    for (let i = 0; i < days.length; i++) {
      let day = days[i];
      cnt++;
      await Day_trip.create({ num: -1 });
      let DAY = await Day_trip.findOne({ where: { num: -1 } });

      for (let j = 0; j < day.length; j++) {
        let event = day[j];
        let action = event.action;
        let title;
        if (event.attraction_id != null) {
          const attr = await Attraction.findByPk(event.attraction_id);
          if (!attr) {
            await trp.destroy();
            return res
              .json({ msg: "fault", err: "Attraction is not exist" })
              .status(500);
          }
          title = attr.title;
        } else title = event.title;
        let Start_event = event.start_date;
        let duration_event = event.duration;
        let description_event = event.description;
        let type = event.type;
        let price_adult = event.price_adult;
        let price_child = event.price_child;
        let additional_note = event.additional_note;
        await Event.create({
          AttractionId: event.attraction_id,
          action: action,
          title: title,
          start_date: Start_event,
          duration: duration_event,
          description: description_event,
          type: type,
          price_adult: price_adult,
          price_child: price_child,
          additional_note: additional_note,
          DayTripId: DAY.id,
        });
      }
      DAY.num = cnt;
      DAY.TripId = trp.id;
      await DAY.save();
    }


    trp.name = name;
    trp.DestenationId = DestenationId;
    trp.description = description;
    trp.trip_price = price;
    trp.start_date = start_date;
    (trp.end_date = end_date),
      (trp.capacity = capacity),
      (trp.AdminId = req.user_id);
    trp.meeting_point_location = meeting_point_location;
    trp.TimeLimitCancellation = TimeLimitCancellation;
    trp.avilable = 1;
    trp.available_capacity = capacity;
    await trp.save();
    return res.json({ data: {}, msg: "Added!" }).status(200);
  } catch (error) {
    await trp.destroy();
    console.log("Error fetching data:", error);
    return res
      .json({ msg: "fault", err: "Internal Server Error", data: {} })
      .status(500);
  }
};

module.exports.upload_trip_images = async (req, res, next) => {
  try {
    const { tripId } = req.body;
    console.log(tripId);
    const trip = await Trip.findByPk(tripId);
    if (trip) {
      //image = await trip.createImage({ url: imageUrl });
      for (const file of req.files) {
        await Image.create({
          url: `http://localhost:3000/uploads/${file.filename}`,
          TripId: tripId
        });
      }
      return res.status(200).json({ msg: "Added!", data: {} });
    }
    else {
      return res.status(404).json({ msg: "The trip does not exists!", data: null });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.trips_card = async (req, res, next) => {
  let cards = [];
  const trips = await Trip.findAll({
    limit: 10,
    order: [["id", "ASC"]],
  });
  // return res.json(trips);
  for (let i = 0; i < 10; i++) {
    let single = {};
    let trip = trips[i];
    if (!trip) continue;
    let IMg1 = await trip.getImages();
    single.image = [];
    IMg1.forEach((element) => {
      single.image.push(element.image);
    });
    single.title = trip.name;
    single.Destenation = await trip.getDestenation();
    single.Destenation = single.Destenation.name;
    single.start_date = trip.start_date;
    single.end_date = trip.end_date;
    let date1 = new Date(trip.start_date); // Example start time
    let date2 = new Date(trip.end_date); // Example end time
    // Calculate the difference in milliseconds
    let diffInMilliseconds = date2 - date1;
    let diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    console.log(trip.start_date, " ", date2, " ", diffInDays);
    single.duration = diffInDays;
    single.avilable = trip.avilable;
    single.price = trip.price;
    cards.push(single);
  }
  return res.status(200).json({ data: { cards }, err: {}, msg: "Added!" });
};

module.exports.delete_trip = async (req, res, next) => {
  const TripId = req.params.id;
  const trip = await Trip.findByPk(TripId);
  if (trip) {
    trip.destroy();
    return res.status(200).json({ data: {}, err: {}, msg: "Deleted!" });
  } else
    return res
      .status(500)
      .json({ data: {}, err: "No trip with this id!", msg: "error" });
};

module.exports.add_destenation = async (req, res, next) => {
  await Destenation.create({ name: "ZZZZAAAANNAASS" });
  const dest = await Destenation.findOne({ where: { name: "ZZZZAAAANNAASS" } });
  try {
    let name = req.body.name,
      images,
      desc = req.body.description,
      location = req.body.location,
      AdminId = req.user_id;

    err = await is_unique(name, Destenation, "name");
    if (err) {
      await dest.destroy();

      return res.status(500).json({ msg: "fault", err: "name is not unique" });
    }

    for (const file of req.files) {
      await Image.create({
        url: `http://localhost:3000/uploads/${file.filename}`,
        DestenationId: dest.id
      });
    }
    //}
    dest.name = name;
    dest.AdminId = AdminId;
    dest.description = desc;
    dest.location = location;
    dest.images = images;
    await dest.save();

    return res
      .status(200)
      .json({ data: {}, err: {}, msg: "Destenation has added successfully !" });
  } catch (err) {
    await dest.destroy();
    console.log(err);
    return res.status(500).json({ data: {}, err: err, msg: "error" });
  }
};

module.exports.add_attraction = async (req, res, next) => {
  await Attraction.create({ name: "ZZZZAAAANNAASS" });
  const atr = await Attraction.findOne({ where: { name: "ZZZZAAAANNAASS" } });

  try {

    let name = req.body.name,
      //images = req.body.images,
      description = req.body.description,
      DestenationId = req.body.destenation_id,
      AdminId = req.user_id;

    let err = await is_unique(name, Attraction, "name");
    if (err) {
      await atr.destroy();
      return res.status(500).json({ msg: "fault", err: "name is not unique" });
    }

    err = await Destenation.findByPk(DestenationId);
    if (!err) {
      await atr.destroy();

      return res
        .status(500)
        .json({ msg: "fault", err: "Destenation is not exist" });
    }

    for (const file of req.files) {
      await Image.create({
        url: `http://localhost:3000/uploads/${file.filename}`,
        AttractionId: atr.id
      });
    }

    atr.name = name;
    atr.description = description;
    atr.AdminId = AdminId;
    atr.DestenationId = DestenationId;

    await atr.save();

    return res
      .status(200)
      .json({ data: {}, err: {}, msg: "Attraction has added successfully !" });
  } catch (err) {
    await atr.destroy();
    console.log(err);
    return res.status(500).json({ data: {}, err: err, msg: "error" });
  }
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
    let cur = Atr[i].dataValues;
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
  let Dst = await Destenation.findAll({
    include: [
      {
        model: image,
        attributes: ["url"],
      },
    ],
  });
  let arr = [];
  for (let i = 0; i < Dst.length; i++) {
    let cur = Dst[i].dataValues;
    // let all_images = await Dst[i].getImages();
    //let URL_images = [];
    // all_images.forEach((element) => {
    //   URL_images.push(element.image);
    // });
    // cur.images = URL_images;
    let reviews = await every_user_review.findAll({
      where: { DestenationId: Dst[i].id },
    });
    let images = await image.findAll({
      where: { DestenationId: Dst[i].id },
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
    cur.rate = rate.toFixed(1);
    arr.push(cur);
  }
  return res.status(200).json({ data: arr, err: {}, msg: "success" });
};

module.exports.delete_attraction = async (req, res, next) => {
  const trpId = req.params.id;
  const trp = Trip.findByPk(trpId);
  if (!trp) {
    return res.status(500).json({ data: {}, err: {}, msg: "there is no attraction" });
  }
  try {
    await trp.destroy();
    return res
      .status(200)
      .json({ data: {}, err: {}, msg: "trip deleted successfully" });
  } catch (err) {
    return res.status(500).json({ data: {}, err: err, msg: "error" });
  }
};

module.exports.delete_destenation = async (req, res, next) => {
  const dstId = req.params.id;
  const dst = Destenation.findByPk(dstId);
  if (!dst) {
    return res.status(500).json({ data: {}, err: {}, msg: "there is no destination" });
  }
  try {
    await dst.destroy();
    return res
      .status(200)
      .json({ data: {}, err: {}, msg: "trip deleted successfully" });
  } catch (err) {
    return res.status(500).json({ data: {}, err: err, msg: "error" });
  }
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

  let reviews = await every_user_review.findAll({
    where: { DestenationId: destinationId },
  });
  // let reviews = await destination.getEveryuserreviews();
  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    console.log(element);
  }
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

  // Process attractions and their images

  // Process trips and their images
  for (const trip of trips) {
    const all_images = await trip.getImages();
    const URL_images = all_images.map((image) => image.dataValues.image);
    trip.dataValues.images = URL_images;
    response.trips.push(trip);
  }

  // Get user reviews

  let reviews = await every_user_review.findAll({
    where: { AttractionId: attractionId },
  });

  for (let i = 0; i < reviews.length; i++) {
    let element = reviews[i];
    let user = await User.findByPk(element.UserId);
    element.dataValues.username = user.dataValues.username;
    reviews[i] = element;
    console.log(element);
  }
  response.reviews = reviews;

  return res.status(200).json({ data: response, err: {}, msg: "success" });
};

module.exports.charge_requests = async (req, res, next) => {
  let requests = await ChargeRequest.findAll();
  return res.status(200).json({ data: requests, err: {}, msg: "success" });
};

module.exports.approve_charge = async (req, res, next) => {
  const request_id = req.params.id;
  const chargeRequest = await ChargeRequest.findByPk(request_id);
  if (!chargeRequest) {
    return res
      .status(500)
      .json({ data: {}, err: {}, msg: "request not found" });
  }
  let wallet = chargeRequest.UserId;
  wallet = await User.findByPk(wallet);
  wallet = await wallet.getWallet();
  if (!wallet) {
    return res.status(500).json({ data: {}, err: {}, msg: "wallet not found" });
  }
  wallet.balance += chargeRequest.amount;
  await wallet.save();
  console.log(wallet.id, req.user_id);
  let walletid = wallet.id;
  let temp = await Transaction.findOne({
    where: {
      chargeRequestId: chargeRequest.id,
    },
  });
  console.log(chargeRequest.id);
  if (!temp) {
    return res.status(500).json("there is no ");
  }
  temp.status = "Success";
  temp.save();
  const fcm = await FCM.findOne({ where: { UserId: req.user_id } });
  console.log(fcm);
  await chargeRequest.destroy();
  let title = "crediting";
  let body = "Your request is Accepted !";
  await Notification_mod.create({ UserId: req.user_id, title: title, body: body, type: "wallet" });
  Notification.notify(
    fcm.token,
    title,
    body,
    res,
    next
  );

  // return res.status(200).json({ data: {}, err: {}, msg: "success" });
};

module.exports.reject_charge = async (req, res, next) => {
  const request_id = req.params.id;
  const chargeRequest = await ChargeRequest.findByPk(request_id);
  if (!chargeRequest) {
    return res
      .status(500)
      .json({ data: {}, err: {}, msg: "request not found" });
  }
  let wallet = chargeRequest.UserId;
  wallet = await User.findByPk(wallet);
  wallet = await wallet.getWallet();
  let walletid = wallet.id;
  let temp = await Transaction.findOne({
    where: {
      chargeRequestId: chargeRequest.id,
    },
  });
  console.log(temp);
  if (!temp) {
    return res.status(500).json("there is no ");
  }
  temp.status = "Failed";
  temp.save();
  const fcm = await FCM.findOne({ where: { UserId: req.user_id } });
  console.log(fcm);
  await chargeRequest.destroy();
  let title = "crediting";
  let body = "Your request is denied ... for more information contact us !";
  await Notification_mod.create({ UserId: req.user_id, title: title, body: body, type: "wallet" });
  Notification.notify(
    fcm.token,
    title,
    body,
    res,
    next
  );

  // return res.status(200).json({ data: {}, err: {}, msg: "success" });
};

module.exports.transactions = async (req, res, next) => {
  let transactions = await Transaction.findAll();
  return res.status(200).json({ data: transactions, err: {}, msg: {} });
};

module.exports.show_all_transactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: Wallet,
          include: [
            {
              model: User,
              attributes: ["username"],
            },
          ],
        },
        {
          model: Admin,
          attributes: ["username"],
        },
      ],
    });

    return res.status(200).json({ data: transactions, err: {}, msg: {} });
  } catch (err) {
    return res.status(500).json({ data: {}, err: err, msg: "error" });
  }
};

module.exports.show_all_reservations = async (req, res, nest) => {
  try {
    const reservations = await reservation.findAll({
      //model: Wallet,
      include: [
        {
          model: User,
          attributes: ["username"],
        },
        {
          model: Trip,
          attributes: ["name"],
        },
      ],
    });

    return res.status(200).json({ data: reservations, err: {}, msg: {} });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};

module.exports.destinationInfo1 = async (req, res, next) => {
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
  let images = await Image.findAll({
    where: {
      DestenationId: destenation_id
    },
    attributes: ['url'],
  })
  let result = {
    name: destenation.name,
    location: destenation.location,
    rate: rate,
    reviews: cnt2,
    description: destenation.description,
    images: images
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.destinationInfo2 = async (req, res, next) => {
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
      let images = await Image.findOne({
        where: {
          attractionId: single_attr.id
        },
        attributes: ['url'],
      })
      let fav = await Favourite.findOne({
        where: { UserId: req.user_id, AttractionId: single_attr.id },
      });

      if (!fav) {
        fav = await Favourite.create({
          UserId: req.user_id,
          AttractionId: single_attr.id,
          is_favourite: false,
        });
      }
      let trpID = single_attr.id;
      if (!image) {
        return res
          .status(404)
          .json({ err: ("attraction ", trpID, " is not completed") });
      }
      let object = {
        id: single_attr.id,
        name: single_attr.name,
        image: images,
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

module.exports.destinationInfo3 = async (req, res, next) => {
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
        let images = await Image.findOne({
          where: {
            tripId: single_trip.id
          },
          attributes: ['url'],
        });
        let fav = await Favourite.findOne({
          where: { UserId: req.user_id, TripId: single_trip.id },
        });

        if (!fav) {
          fav = await Favourite.create({
            UserId: req.user_id,
            TripId: single_trip.id,
            is_favourite: false,
          });
        }
        let trpID = single_trip.id;
        // if (!image) {
        //   return res
        //     .status(404)
        //     .json({ err: ("trip ", trpID, " is not completed") });
        // }
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

        let image = await Image.findOne({
          where: {
            tripId: single_trip.id
          },
          attributes: ['url'],
        });

        let object = {
          id: single_trip.id,
          name: single_trip.name,
          image: image,
          is_favourite: fav.is_favourite,
          duration: diffDays,
          destenation: dist ? dist.name : null,
          price: single_trip.trip_price,
          rate: rate,
          image: image
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

module.exports.attractionInfo1 = async (req, res, next) => {
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
  let events = await Event.findAll({ where: { AttractionId: attraction_id } });
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

  let image = await Image.findAll({
    where: {
      attractionId: attraction.id
    },
    attributes: ['url'],
  });

  trips = Array.from(new Set(trips));
  console.log(trips);
  let result = {
    name: attraction.name,
    location: destenation,
    images: image,
    rate: rate,
    reviews: cnt,
    description: attraction.description,
    trips_included: trips.length,
  };
  return res.status(200).json({ msg: {}, data: result });
};

module.exports.attractionInfo2 = async (req, res, next) => {
  let attraction_id = req.params.id;
  const attraction = await Attraction.findByPk(attraction_id);
  if (!attraction) {
    return res
      .status(500)
      .json({ msg: "fault", err: "there is no attraction with this id" });
  }
  // let destenation = await Destenation.findByPk(trip.DestenationId);

  let events = await Event.findAll({ where: { AttractionId: attraction_id } });
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
    //let image = await Image.findOne({ where: { TripId: single_trip.id } });
    let fav = await Favourite.findOne({
      where: { UserId: req.user_id, TripId: single_trip.id },
    });

    if (!fav) {
      fav = await Favourite.create({
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

    let image = await Image.findOne({
      where: {
        tripId: single_trip.id
      },
      attributes: ['url'],
    });

    if (!image) {
      return res
        .status(404)
        .json({ err: ("trip ", trpID, " is not completed") });
    }

    let object = {
      id: single_trip.id,
      name: single_trip.name,
      image: image,
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

  let image = await Image.findAll({
    where: {
      tripId: trip.id
    },
    attributes: ['url'],
  });

  let result = {
    name: trip.name,
    location: destenation.name,
    images: image,
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
  let reservs = await reservation.findAll({ where: { TripId: Trip_id } });
  let cnt = 0;
  reservs.forEach((element) => {
    cnt += element.adult + element.child;
  });
  const available = capacity - cnt;
  let Days = await DayTrips.findAll({ wher: { TripId: Trip_id } });
  let ATTRACTIONS = [];
  for (let j = 0; j < Days.length; j++) {
    let DAY = Days[j];
    let events = await Event.findAll({ where: { DayTripId: DAY.id } });
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

  let Days = await DayTrips.findAll({ wher: { TripId: Trip_id } });
  let ATTRACTIONS = [];
  for (let j = 0; j < Days.length; j++) {
    let DAY = Days[j];
    let events = await Event.findAll({ where: { DayTripId: DAY.id } });
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
      let image = await Image.findOne({
        where: {
          AttractionId: element.id
        },
        attributes: ['url'],
      });
      // let image = await Image.findOne({ where: { AttractionId: element.id } });
      let fav = await Favourite.findOne({
        where: { UserId: req.user_id, AttractionId: element.id },
      });

      if (!fav) {
        fav = await Favourite.create({
          UserId: req.user_id,
          AttractionId: element.id,
          is_favourite: false,
        });
      }
      let trpID = element.id;
      if (!image) {
        return res
          .status(404)
          .json({ err: ("attraction ", trpID, " is not completed") });
      }

      let object = {
        id: element.id,
        name: element.name,
        image: image,
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

  let destenation = await Destenation.findByPk(trip.DestenationId, {
    include: [
      {
        model: Image,
        attributes: ["url"],
        limit: 1,
        order: [["id", "ASC"]],
      },
    ],
  });
  let fav = await Favourite.findAll({
    where: { UserId: req.user_id, DestenationId: destenation.id }
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

module.exports.check_before_delete_destination = async (req, res, next) => {
  const destination_id = req.params.id;

  try {
    let attractions = [], trips = [];
    attractions = await Attraction.findAll({
      where: {
        DestenationId: destination_id,
      },
    });

    trips = await Trip.findAll({
      where: {
        DestenationId: destination_id,
      },
    });

    if (attractions.length === 0 && trips.length === 0) {
      return res.status(200).json({ msg: "You can delete the destination safely", data: null });
    }

    return res.status(200).json({ msg: "Attention: there are attractions or trips related to this destination", data: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error", error });
  }
};

module.exports.check_before_delete_attraction = async (req, res, next) => {
  const attraction_id = req.params.id;

  try {
    let trips = [];

    trips = await Event.findAll({
      where: {
        AttractionId: attraction_id,
      },
    });

    if (trips.length === 0) {
      return res.status(200).json({ msg: "You can delete the attraction safely", data: null });
    }

    return res.status(200).json({ msg: "Attention: there are trips related to this attraction", data: null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error", error });
  }
};

module.exports.overview_users = async (req, res, next) => {
  try {
    const total_users = await User.count();
    const total_booking = await reservation.count();

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    const lastMonthUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfLastMonth,
          [Op.lt]: startOfMonth
        }
      }
    });

    const lastMonthBookings = await reservation.count({
      where: {
        createdAt: {
          [Op.gte]: startOfLastMonth,
          [Op.lt]: startOfMonth
        }
      }
    });

    const percentage_change_of_registration = ((total_users - lastMonthUsers) / total_users) * 100;
    const percentage_change_of_booking = ((total_booking - lastMonthBookings) / total_booking) * 100;
    const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday);

    const yesterdayUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfYesterday,
          [Op.lt]: endOfYesterday
        }
      }
    });

    const yesterdayBookings = await reservation.count({
      where: {
        createdAt: {
          [Op.gte]: startOfYesterday,
          [Op.lt]: endOfYesterday
        }
      }
    });

    const todayUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfToday
        }
      }
    });

    const todayBookings = await reservation.count({
      where: {
        createdAt: {
          [Op.gte]: startOfToday
        }
      }
    });

    const today_percentage_change_users = ((todayUsers - yesterdayUsers) / (yesterdayUsers || 1)) * 100;
    const today_percentage_change_bookings = ((todayBookings - yesterdayBookings) / (yesterdayBookings || 1)) * 100;

    const userMessage = percentage_change_of_registration > 0
    ? 'Up from last month'
    : 'Down from last month';

    const bookingMessage = percentage_change_of_booking > 0
      ? 'Up from last month'
      : 'Down from last month';

    const todayUserMessage = today_percentage_change_users > 0
    ? 'Up from yesterday'
    : 'Down from yesterday';

    const todayBookingMessage = today_percentage_change_bookings > 0
      ? 'Up from yesterday'
      : 'Down from yesterday';

    return res.status(200).json({ msg: {}, data: {
      total_users,
      percentage_change_of_registration_from_last_month: percentage_change_of_registration.toFixed(2),
      userMessage,
      total_booking,
      percentage_change_of_booking_from_last_month: percentage_change_of_booking.toFixed(2),
      bookingMessage,
      todayUsers,
      today_percentage_change_users: today_percentage_change_users.toFixed(2),
      todayUserMessage,
      todayBookings,
      today_percentage_change_bookings: today_percentage_change_bookings.toFixed(2),
      todayBookingMessage
    } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Internal server error", error });
  }
};

module.exports.top_trips = async (req, res, next) => {
  let result = [];
  let trips = await Trip.findAll();

  for (let i = 0; i < trips.length; i++) {
    single_trip = trips[i];
    try {
      let trpID = single_trip.id;

      let reviews = await every_user_review.findAll({
        where: { TripId: single_trip.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
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

      let bookings = await reservation.findAll({
        where:{
          tripId: trpID
        }
      });

      let bookingsCount = bookings.length;

      let object = {
        id: single_trip.id,
        name: single_trip.name,
        rate: rate,
        bookings: bookingsCount
      };
      result.push(object);
    } catch (innerErr) {
      console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
    }
  }
  result.sort((b, a) => a.rate - b.rate);

  result = result.slice(0, 10);

  return res.status(200).json({ msg: {}, data: { result } });
};

module.exports.top_destinations = async (req, res, next) => {
  let result = [];
  let dest = await Destenation.findAll();

  for (let i = 0; i < dest.length; i++) {
    single_dest = dest[i];
    try {
      let destId = single_dest.id;

      let reviews = await every_user_review.findAll({
        where: { DestenationId: single_dest.id },
      });
      let rate = 0.0;
      let cnt = 0;
      reviews.forEach((element) => {
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
        id: single_dest.id,
        name: single_dest.name,
        rate: rate,
      };
      result.push(object);
    } catch (innerErr) {
      console.error(`Error processing trip ID ${single_dest.id}:`, innerErr);
    }
  }
  result.sort((b, a) => a.rate - b.rate);

  result = result.slice(0, 10);

  return res.status(200).json({ msg: {}, data: { result } });
};