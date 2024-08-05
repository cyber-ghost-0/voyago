const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mail = require("../../services/Mails");
const services = require("../../services/public");
const BP = require("body-parser");
const Joi = require("joi");
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
const { use } = require("../../routes/app/auth.js");
const every_user_review = require("../../models/EveryUserReview.js");
const reservation = require("../../models/reservation.js");

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

const imageFilter = (req, file, cb) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp"]; 
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true); 
  } else {
    cb(new Error("Invalid file type. Only images are allowed")); 
  }
};

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, `../../uploads/`);
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cd) => {
  cd(null, Date.now() + path.extname(file.originalname))
  }
  });

const upload = multer({
    storage: storage,
    limits: { fileSize: '100000000'},
    fileFilter: (req, file, cd) => {
    const fileTypes = /jpeg|jpg|png|gif|bmp/
    const mimeType = fileTypes.test(file.mimetype)
    const extname = fileTypes.test(path.extname(file.originalname))
    if(mimeType && extname) {
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
  return res.json({ msg: "DONE!", data: { user: user }, err: "" }).status(200);
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
  try{
    const {tripId} = req.body;
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
  }catch(error){
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

    const files = req.files;
    const imageRecords = await Promise.all(
      files.map(async (file) => {
        const fileExtension = path.extname(file.originalname);
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
          file.filename
        }${fileExtension}`;
        images = await dest.createImage({ url: imageUrl });
      })
    );
    
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
        attributes: ['url']
      }
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
      where: { DestenationId: Dst[i].id},
    })
    
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
    return res.status(500).json({ data: {}, err: {}, msg: "there is no trip" });
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
    return res.status(500).json({ data: {}, err: {}, msg: "there is no trip" });
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
  if(!wallet){
    return res
      .status(500)
      .json({ data: {}, err: {}, msg: "wallet not found" });
  }
  wallet.balance += chargeRequest.amount;
  await wallet.save();
  console.log(wallet.id, req.user_id);
  let walletid = wallet.id;
  await Transaction.create({
    AdminId: req.user_id,
    walletId: walletid,
    new_balance: wallet.balance,
    last_balance: wallet.balance - chargeRequest.amount,
    type: "credit",
    status: "Success",
  });

  await chargeRequest.destroy();
  return res.status(200).json({ data: {}, err: {}, msg: "success" });
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
  await Transaction.create({
    AdminId: req.user_id,
    walletId: walletid,
    new_balance: wallet.balance,
    last_balance: wallet.balance,
    type: "credit",
    status: "Failed",
  });

  await chargeRequest.destroy();
  return res.status(200).json({ data: {}, err: {}, msg: "success" });
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
              attributes: ['username']              }
          ]
        },
        {
          model: Admin,
          attributes: ['username']
        }
      ],
    });

    return res.status(200).json({ data: transactions, err: {}, msg: {} });
    
  } catch (err){
    return res.status(500).json({ data: {}, err: err, msg: "error" });
  }
};

module.exports.show_all_reservations = async (req, res, nest) => {
  try{
    const reservations = await reservation.findAll({
          //model: Wallet,
          include: [
            {
              model: User,
              attributes: ['username']            
          
            },
            {
              model: Trip,
              attributes: ['name']
           }
          ],
         });

    return res.status(200).json({ data: reservations, err: {}, msg: {} });
    
  }catch(error){
    console.error(error);
    return res.status(500).json({ msg: "Internal server error.", data: null });
  }
};