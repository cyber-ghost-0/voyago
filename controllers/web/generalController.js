const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');
const Admin = require('../../models/Admin');
const User = require('../../models/User');
const Trip = require('../../models/Trip');
const Image = require('../../models/Image');
const Features_included = require('../../models/features_included');
const Every_feature = require('../../models/every_feture');
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
function validateUserInfo2(info) {
    const schema = Joi.object({
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
    let admin = await model.findOne({ where: whereClause });
    return admin;
    
}

module.exports.users = async (req, res, next) => {
    try {
        const users = await User.findAll();
        return res.json({msg:'Done!',users:users});
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({msg:'fault',err:'Internal Server Error'});
    }
};


module.exports.add_user = async (req, res, next) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        
        let { error } = validateUserInfo(req.body);
        console.log(error);
        
        if (error) {
            return res.status(400).send({msg:'fault',err:error.details[0].message});
        }
        if (await is_unique(email, User, 'email') ||await is_unique(username, User, 'username')) {
            return res.status(500).json({msg:'fault',err:"emai/username isn\'t unique"});
        }
        let cod = '' + services.generateCod();
        
        mail(req.body.email, "Admin added you to the app");
        // console.log(cod,req.body.email)
        bcrypt.hash(password, 12).then(hashpassword=>{
            
            User.create({ username:username, password: hashpassword  , email : email , role:'user',cod_ver:cod});
        }).catch(err => {
            console.log(err);
        });
        let response = { msg: 'user added' };

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg:'fault',err: 'An error occurred while Adding user' });
    }
};

module.exports.delete_user = async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        return res.status(500).json({ msg: "fault", err: "User is not exist!" });
    }
    user.destroy();
    return res.json({msg:"DONE!"}).status(200);
};


module.exports.admins = async (req, res, next) => {
    try {
        const admins = await Admin.findAll();
        return res.status(200).json({msg:'Done!',admins:admins});
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({msg:'fault',err:'Internal Server Error'});
    }
};


module.exports.add_admin = async (req, res, next) => {
    try {
        const username = req.body.username;
        const role = req.body.role;
        const password =  req.body.password;
        const email = req.body.email;
                
        mail(req.body.email, "you have added as admin in voyago !");
        // console.log(cod,req.body.email)
        bcrypt.hash(password, 12).then(hashpassword=>{
            
            Admin.create({ username:username, password: hashpassword  , email : email , role:role ,cod_ver:null});
        }).catch(err => {
            console.log(err);
        });
        let response = {msg:'new admin added'};

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg:'fault',err: 'An error occurred while Adding admin' });
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
    return res.json({ msg: "DONE!", data: { admin: admin } ,err:""}).status(200);
};

module.exports.show_user = async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
        return res.status(500).json({ msg: "fault", err: "user is not exist!" });
    }
    return res.json({ msg: "DONE!", data: { user: user } ,err:""}).status(200);
};

module.exports.show_features_included = async (req, res, next) => {
    try {
        const features = await Features_included.findAll();
        return res.status(200).json({msg:'Done!',features:features});
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ dat: {},msg:'fault',err:'Internal Server Error'});
    }
};

module.exports.add_features_included = async (req, res, next) => {
    try {
        const feature = req.body.feature,type=req.body.type;
        Features_included.create({ name: feature ,type:type});
        return res.status(200).json({msg:'Added!'});
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ data: {},msg:'fault',err:'Internal Server Error'});
    }
};

module.exports.add_trip = async (req, res, nxt) => {
    try {
        let name = req.body.name, location = req.body.location, start_date = req.body.start_date, price = req.body.price, capacity = req.body.capacity,
            description = req.body.description, images, features, meeting_point_location = req.body.meeting_point_location, TimeLimitCancellation = req.body.TimeLimitCancellation;
        images = req.body.images;
        features = req.body.features;
        Trip.create({ name: "ZZZZAAAANNAASS" });
        const trp = await Trip.findOne({ where: { name: "ZZZZAAAANNAASS" } });
        images.forEach(image => {
            Image.create({ TripId: trp.id, image: image });
        });
        features.forEach(feature => {
            Every_feature.create({ featuresIncludedId: feature, TripId: trp.id });
        });
       
        trp.name = name; trp.location = location; trp.description = description; trp.trip_price = price; trp.start_date = start_date; trp.capacity = capacity, trp.admin_id = req.user_id; trp.meeting_point_location = meeting_point_location;
        trp.TimeLimitCancellation = TimeLimitCancellation; trp.avilable = true;
   
        trp.save();
        return res.status(200).json({ data: {}, err: {},msg:'Added!'});
    } catch(error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ msg: 'fault', err: 'Internal Server Error', data: {} });
    }
};
