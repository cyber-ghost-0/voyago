const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');
const User = require('../../models/User');
const Trip=require('../../models/Trip')
//const Image=require('../../models/image');
const { Sequelize } = require('sequelize');
const { SequelizeMethod } = require('sequelize/lib/utils');
const Every_user_review =require('../../models/EveryUserReview');
const Attraction = require('../../models/Attraction');
const Destenation = require('../../models/Destenation');
const reservation = require('../../models/reservation');
// require('dotenv').config()

function validateUserInfo (info) {
    const schema = Joi.object({
        username: Joi.string().alphanum().required(),
        password: Joi.string().min(8).required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
        confirm_password: Joi.ref('password'),
        email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    }) 
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

module.exports.myProfile = async(req, res, next) => {
    let array;
    const user = await User.findOne({ where: { id: req.userID } });
    array = { username: user.username, email: user.email, phone_number: user.phone_number, location: user.location, profile_pic: user.profile_pic };
    let response = { data: array, msg: "Done!" ,err:{}};
    return res.json(response).status(200);
};

module.exports.EditMyProfile = async(req, res, next) => {
    let array;
    const user = await User.findOne({ where: { id: req.userID } });

    let flag = await bcrypt.compare(req.body.old_password, user.password);
    if (!flag) {
        return res.status(401).json({msg:"fault",err:'Old password is not correct',data:{}});
    }
    if (req.body.password != req.body.confirm_password) {
        return res.status(401).json({msg:'fault',err:'password is not equal confirmation password',data:{}});
    }

    user.username = req.body.username;
    user.email = req.body.email;
    user.phone_number = req.body.phone_number;
    user.profile_pic = req.body.profile_pic;
    user.password = await bcrypt.hash(req.body.password, 12);
    user.save();
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
        return res.status(401).json({msg:'fault',err:'no such trip with that id',data:{}});
    }
    const user_id = req.user_id;
    const comment = req.body.comment;
    const rate = req.body.rate;
    await Every_user_review.create({ UserId: user_id, TripId: TripId, comment: comment, rate: rate });
    let response = { data: {}, msg: "Comment submitted succeully!" ,err:{}};
    return res.json(response).status(200);
};

module.exports.attraction_review = async (req, res, err) => {
    
    const attractionId = req.params.id;
    let attraction = await Attraction.findByPk(attractionId);
    if (!attraction) {
        return res.status(401).json({msg:'fault',err:'no such Attraction with that id',data:{}});
    }
    const user_id = req.user_id;
    const comment = req.body.comment;
    const rate = req.body.rate;
    await Every_user_review.create({ UserId: user_id, AttractionId: attractionId, comment: comment, rate: rate });
    let response = { data: {}, msg: "Comment submitted succeully!" ,err:{}};
    return res.json(response).status(200);
};

module.exports.destenation_review = async (req, res, err) => {
    
    const DestenationId = req.params.id;
    let destenation = await Destenation.findByPk(DestenationId);
    if (!destenation) {
        return res.status(401).json({msg:'fault',err:'no such Destenation with that id',data:{}});
    }
    const user_id = req.user_id;
    const comment = req.body.comment;
    const rate = req.body.rate;
    await Every_user_review.create({ UserId: user_id, DestenationId: DestenationId, comment: comment, rate: rate });
    let response = { data: {}, msg: "Comment submitted succeully!" ,err:{}};
    return res.json(response).status(200);
};

module.exports.reserve_on_trip = async (req, res, next) => {
    const trip_id = req.params.id;
    const adult = req.body.adult;
    const child = req.body.child;
    const optional_choices = req.body.optional_choices;
    const fname = req.body.first_name;
    const lname = req.body.last_name;
    const phone = req.body.phone;
    const password = req.body.password;
    const user = User.findByPk(req.userID);
    let flag = await bcrypt.compare(req.body.password, user.password);
    if (!flag) {
        let response = { data: {}, msg: "fail" ,err:"password is not correct !"};
        return res.json(response).status(500);
    }

    reservation.create({ fname: fname, lname: lname, adult: adult, child: child, phone: phone, UserId: user_id, TripId: trip_id });
    let response = { data: {}, msg: "you have regesterd on this trip !" ,err:{}};
    return res.json(response).status(200);
}