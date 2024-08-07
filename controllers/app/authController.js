const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mail = require("../../services/Mails");
const services = require("../../services/public");
const BP = require("body-parser");
const Joi = require("joi");
const User = require("../../models/User");
const Wallet = require("../../models/wallet");
const FCM = require("../../models/FCM_Tokens");
const reservation = require("../../models/reservation");
const Trip = require("../../models/Trip");
const cron = require("node-cron");
const moment = require("moment");
const stripe = require("stripe")(
  "sk_test_51Pl5wSEVUjNtlvUo4Mklo94tk9tBWXEnIlP7ErbPMglgDc4WFrrm2QfOPVYhIeu3Qb5fItTqMoSmk5TQ61Q2lhtY00BmR8RQJ9"
);
const { Op, INTEGER } = require("sequelize");

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

module.exports.token = async (req, res, next) => {
  const refreshToken = req.body.token;
  if (refreshToken == null)
    return res.status(401).json({ err: {}, data: {}, msg: "fault " });
  if (!services.black_list.includes(refreshToken))
    return res.sendStatus(403).json({ err: {}, data: {}, msg: "fault " });
  jwt.verify(
    refreshToken,
    "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419",
    async (err, user) => {
      if (err)
        return res.sendStatus(403).json({ err: {}, data: {}, msg: "fault " });
      const accessToken = await services.generateAccessToken(user);
      return res
        .status(200)
        .json({ err: {}, data: { accessToken: accessToken }, msg: "success!" });
    }
  );
};

module.exports.register = async (req, res, next) => {
  // console.log('*************');
  try {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    let { error } = validateUserInfo(req.body);
    console.log(error);

    if (error) {
      return res
        .status(400)
        .send({ data: {}, err: error.details[0].message, msg: "fault" });
    }
    if (
      (await is_unique(email, User, "email")) ||
      (await is_unique(username, User, "username"))
    ) {
      return res
        .status(400)
        .json({ data: {}, msg: "fault", err: "emai/username isn't unique" });
    }
    let cod = "" + services.generateCod();

    mail(req.body.email, cod);
    console.log(cod, req.body.email);
    let userr;
    await bcrypt
      .hash(password, 12)
      .then(async (hashpassword) => {
        userr = await User.create({
          username: username,
          password: hashpassword,
          email: email,
          role: "user",
          cod_ver: null,
        });
      })
      .catch((err) => {
        console.log(err);
      });
    console.log(userr);
    await Wallet.create({ balance: 0, UserId: userr.id });

    return res.status(201).json({
      err: {},
      msg: "verification code send to your email",
      data: { correct_code: cod },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      data: {},
      msg: "fault",
      err: "An error occurred while registering user",
    });
  }
};

module.exports.Login = async (req, res, next) => {
  let user = await services.getuser(req.body.username);
  // console.log('=/>', user.cod_ver, '<=');
  if (!user) {
    return res
      .status(406)
      .json({ msg: "fault", err: "Enter a valid username", data: {} });
  }
  let flag = await bcrypt.compare(req.body.password, user.password);
  if (!user.cod_ver) {
    user.destroy();
    return res.status(400).json({ msg: "destroyed", data: {}, err: {} });
  }
  if (!flag) {
    // console.log("NOT _ EQ");
    return res
      .status(401)
      .json({ msg: "fault", err: "Invalid username or password", data: {} });
  }

  const accessToken = await services.generateAccessToken(user.id);
  const refreshToken = await jwt.sign(
    user.id,
    "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419"
  );
  services.black_list.push(refreshToken);
  await FCM.create({ token: req.body.fcm, UserId: user.id });
  console.log(55);

  // cron.schedule("* * * * * *", async () => {
  //   console.log(55);
  //   console.log(user.id);
  //   // if (req.user_id)
  //   try {
  //     const oneHourLater = moment().add(1, "hour").toDate();
  //     const oneHourLaterPlusOneMinute = moment(oneHourLater)
  //       .add(1, "minute")
  //       .toDate();
  //     let trips_id = await reservation.findAll({ where: { UserId: user.id } });
  //     let trips = [];
  //     for (let trip of trips_id) {
  //       trips.push(await Trip.findOne({ where: { id: trip.TripId } }));
  //     }
  //     let tripsStartingInAnHour=[];
  //     for (let trip of trips) {
  //       console.log(trip,'...')
  //       let start = trip.start_date;
  //       if(start >= oneHourLater && start <= oneHourLaterPlusOneMinute){
  //         tripsStartingInAnHour.push(trip);
  //       }
  //     }

  //     for (let trip of tripsStartingInAnHour) {
  //       const fcm = await FCM.findOne({ where: { UserId: req.user_id } });
  //       const title = "Upcoming Trip Reminder";
  //       const body = `Your trip to ${trip.name} is starting in an hour!`;
  //       await Notification_mod.create({
  //         UserId: req.user_id,
  //         title: title,
  //         body: body,
  //         type: "tripReminder",
  //       });
  //       Notification.notify(fcm.token, title, body, res, next, true);
  //       trip.id;
  //     }
  //   } catch (error) {
  //     console.error("Error checking for trips starting in an hour:", error);
  //   }
  // });
  if (!user.customerStripId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
    });
    console.log(customer);
    user.customerStripId=customer.id;
    user.save();
  }
  return res.status(200).json({
    data: { accessToken: accessToken, refreshToken: refreshToken },
    err: {},
    msg: "Done!",
  });
};

module.exports.Logout = async (req, res, next) => {
  services.black_list = services.black_list.filter(
    (token) => token !== req.body.token
  );
  req.headers["authorization"] = undefined;
  return res.status(204).send({ msg: "DONE!", data: {}, err: {} });
};

module.exports.check_regesteration_code = (req, res, next) => {
  console.log(req.body.in_code, "  ", req.body.correct_code);
  if (req.body.correct_code === req.body.in_code) {
    services.get_user_by_any(req.body.email, User, "email").then((user) => {
      if (!user) {
        return res
          .status(400)
          .json({ msg: "fault", err: "invalid user", data: {} });
      }
      user.cod_ver = req.body.correct_code;
      user.save();
      return user;
    });

    return res.status(200).json({ msg: "verified!", data: {}, err: {} });
  } else {
    return res.status(400).json({ msg: "fault", err: "invalid cod", data: {} });
  }
};

module.exports.forget_password = (req, res, next) => {
  // console.log('=>',req.body.email,'<=');

  return services
    .get_user_by_any(req.body.email, User, "email")
    .then((user) => {
      if (!user) {
        return res
          .status(400)
          .json({ msg: "fault", err: "This email isn't exist", data: {} });
      }
      let cod = "" + services.generateCod();
      user.cod_ver = cod;
      user.save();
      mail(req.body.email, cod);
      return res
        .status(200)
        .json({ msg: "Done!", data: { code: cod }, err: {} });
    });
};

module.exports.check_verification_code = async (req, res, next) => {
  let user = await services.get_user_by_any(req.body.email, User, "email");
  console.log(user);
  if (!user) {
    return res
      .status(400)
      .json({ msg: "fault", err: "Access Denied !", data: {} });
  }

  const updatedAtTimestamp = new Date(user.updatedAt).getTime();
  console.log(updatedAtTimestamp, Date.now(), ",,,", user.cod_ver);
  if (
    user.cod_ver === req.body.cod &&
    -updatedAtTimestamp + Date.now() <= 60000
  ) {
    return res.status(200).json({ msg: "verified!", data: {}, err: {} });
  } else if (user.cod_ver === req.body.cod) {
    return res
      .status(400)
      .json({ msg: "fault", err: "Time expired for the cod", data: {} });
  } else {
    return res.status(400).json({ msg: "fault", err: "invalid cod", data: {} });
  }
};
module.exports.reset_password = async (req, res, next) => {
  let user = await services.get_user_by_any(req.body.email, User, "email");
  if (!user) {
    return res
      .status(400)
      .json({ msg: "fault", err: "Access Denied !", data: {} });
  }

  bcrypt
    .hash(req.body.password, 12)
    .then((hashpassword) => {
      user.password = hashpassword;
      // console.log(user.password);
      user.save();
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({ msg: "fault", data: {}, err: {} });
    });
  return res.status(200).json({ msg: "changhed", data: {}, err: {} });
};
