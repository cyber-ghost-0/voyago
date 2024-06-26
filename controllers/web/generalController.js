const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');
const Admin = require('../../models/Admin');
const User = require('../../models/User');
const Trip = require('../../models/Trip');
//const Image = require('../../models/image');
const Features_included = require('../../models/features_included');
const Every_feature = require('../../models/every_feture');
const Event = require('../../models/Event');
const Day_trip = require('../../models/Day_trip');
const Attraction = require('../../models/Attraction');
const db = require('../../util/database')
const Destenation = require('../../models/Destenation');
const image = require('../../models/image');
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
        let name = req.body.name, DestenationId = req.body.destenation_id, start_date = req.body.start_date, price = req.body.price, capacity = req.body.capacity,
            description = req.body.description, images, features, meeting_point_location = req.body.meeting_point_location, TimeLimitCancellation = req.body.TimeLimitCancellation;
        let end_date = new Date(start_date);

        // Add the duration in days
        images = req.body.images;
        features = req.body.features;
        let days = [];
        days = req.body.days;
        console.log(days);
        end_date.setDate(end_date.getDate() +  days.length);
        if (await is_unique(name, Trip, 'name')) {
            return res.status(500).json({ msg: 'fault', err: 'name is not unique' });
        }
        await Trip.create({ name: "ZZZZAAAANNAASS" });
        const trp = await Trip.findOne({ where: { name: "ZZZZAAAANNAASS" } });
        
        images.forEach(async image => {
            console.log(trp.id);
            await Image.create({ image: image,TripId: trp.id});
        });
        features.forEach(async feature => {
            await Every_feature.create({ featuresIncludedId: feature, TripId: trp.id });
        });
        let dur = 2;
        let cnt = 0;
        days.forEach(async day => {
            cnt++;
            await Day_trip.create({ num: -1 });
            let DAY = await Day_trip.findOne({ where: { num: -1 } });
        
            day.forEach(async event => {
                let action = event.action;
                let title;
                if (event.attraction_id != null) {
                    const attr = await Attraction.findByPk(event.attraction_id);
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
                    AttractionId:event.attraction_id,action: action,title:title,start_date:Start_event,duration:duration_event,description:description_event,type:type,price_adult:price_adult,price_child:price_child,additional_note:additional_note,DayTripId:DAY.id
                })
            })
            DAY.num = cnt;
            DAY.TripId = trp.id;
            await DAY.save();
        });
        trp.name = name; trp.DestenationId = DestenationId; trp.description = description; trp.trip_price = price; trp.start_date = start_date;trp.end_date=end_date, trp.capacity = capacity, trp.AdminId = req.user_id; trp.meeting_point_location = meeting_point_location;
        trp.TimeLimitCancellation = TimeLimitCancellation; trp.avilable = true;
        await trp.save();
        return res.status(200).json({ data: {}, err: {},msg:'Added!'});
    } catch(error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ msg: 'fault', err: 'Internal Server Error', data: {} });
    }
};

module.exports.trips_card = async (req, res, next) => {
    let cards = [];
    const trips = await Trip.findAll({
        limit: 10,
        order: [['id', 'ASC']],
    });
    // return res.json(trips);
    for (let i = 0; i < 10; i++) {
        let single = {};
        let trip = trips[i];
        if (!trip) continue;
        let IMg1 = await trip.getImages();
        single.image = [];
        IMg1.forEach(element => {
            single.image.push(element.image);
        });
        single.title = trip.name;
        single.Destenation = await trip.getDestenation();
        single.Destenation=single.Destenation.name
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
    return res.status(200).json({ data: {cards}, err: {},msg:'Added!'});
};

module.exports.delete_trip = async (req,res, next)=>{
    const TripId = req.params.id;
    const trip = (await Trip.findByPk(TripId));
    if (trip) {
        trip.destroy();
        return res.status(200).json({ data: {}, err: {}, msg: 'Deleted!' });
    }
    else
        return res.status(500).json({ data: {}, err: 'No trip with this id!', msg: 'error' });
};  

module.exports.add_destenation = async (req,res, next)=>{
    let name = req.body.name;
    let images = req.body.images;
    try {
        await Destenation.create({ name: name, AdminId:req.user_id });
        const Dst = await Destenation.findOne({ where: { name: name } });
        images.forEach(async (element) => {
            await image.create({ DestenationId: Dst.id, image: element });
        });
        return res.status(200).json({ data: {}, err: {}, msg: 'Destenation has added successfully !' });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ data: {}, err: err, msg: 'error' });
    }
};  

module.exports.add_destenation = async (req,res, next)=>{
    let name = req.body.name;
    let images = req.body.images;
    try {
        await Destenation.create({ name: name, AdminId:req.user_id });
        const Dst = await Destenation.findOne({ where: { name: name } });
        images.forEach(async (element) => {
            await image.create({ DestenationId: Dst.id, image: element });
        });
        return res.status(200).json({ data: {}, err: {}, msg: 'Destenation has added successfully !' });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ data: {}, err: err, msg: 'error' });
    }
}; 

module.exports.add_attraction = async (req,res, next)=>{
    let name = req.body.name;
    let images = req.body.images;
    let description = req.body.description;
    let DestenationId = req.body.destenation_id;

    try {
        await Attraction.create({ name: name, AdminId:req.user_id ,description : description, DestenationId :DestenationId });
        const Atr = await Attraction.findOne({ where: { name: name } });
        images.forEach(async (element) => {
            await image.create({ AttractionId: Atr.id, image: element  });
        });
        return res.status(200).json({ data: {}, err: {}, msg: 'Attraction has added successfully !' });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ data: {}, err: err, msg: 'error' });
    }
}; 

module.exports.Attractions = async (req,res, next)=>{
    let Atr = await Attraction.findAll();
    let arr = [];
    for (let i = 0; i < Atr.length; i++) {
        let cur = Atr[i].dataValues;
        let all_images = await Atr[i].getImages();
        let URL_images = [];
        all_images.forEach(element => {
            URL_images.push( element.image);
        });
        cur.images = URL_images;
        arr.push(cur);
    }
    return res.status(200).json({ data: arr , err: {}, msg: 'success' });
};

module.exports.Destenations = async (req, res, next) => {
    let Dst = await Destenation.findAll();
    let arr = [];
    for (let i = 0; i < Dst.length; i++) {
        let cur = Dst[i].dataValues;
        let all_images = await Dst[i].getImages();
        let URL_images = [];
        all_images.forEach(element => {
            URL_images.push( element.image);
        });
        cur.images = URL_images;
        arr.push(cur);
    }
    return res.status(200).json({ data:  arr , err: {}, msg: 'success' });
}; 

module.exports.delete_attraction = async (req, res, next) => {
    const trpId = req.params.id;
    const trp = Trip.findByPk(trpId);
    if (!trp) {
        return res.status(500).json({ data: {}, err: {}, msg: 'there is no trip' });
    }
    try {
        await trp.destroy();
        return res.status(200).json({ data: {}, err: {}, msg: 'trip deleted successfully' });

    } catch (err) {
        return res.status(500).json({ data: {}, err: err, msg: 'error' });
    }
};

module.exports.delete_destenation = async (req, res, next) => {
    const dstId = req.params.id;
    const dst = Destenation.findByPk(dstId);
    if (!dst) {
        return res.status(500).json({ data: {}, err: {}, msg: 'there is no trip' });
    }
    try {
        await dst.destroy();
        return res.status(200).json({ data: {}, err: {}, msg: 'trip deleted successfully' });

    } catch (err) {
        return res.status(500).json({ data: {}, err: err, msg: 'error' });
    }
};
module.exports.single_destination = async (req, res, next) => {
    // try {
        const destinationId = req.params.id;
        const destination = await Destenation.findByPk(destinationId);
        if (!destination) {
            return res.status(404).json({ data: {}, err: {}, msg: 'Destination not found' });
        }

        const attractions = await destination.getAttractions();
        const trips = await destination.getTrips();
        console.log(attractions)
        let response = {
            destination,
            attractions: [],
            trips: []
        };

        // Process attractions and their images
        for (const attraction of attractions) {
            const all_images = await attraction.getImages();
            const URL_images = all_images.map(image => image.dataValues.image);
            attraction.dataValues.images = URL_images;
            response.attractions.push(attraction);
        }

        // Process trips and their images
        for (const trip of trips) {
            const all_images = await trip.getImages();
            const URL_images = all_images.map(image => image.dataValues.image);
            trip.dataValues.images = URL_images;
            response.trips.push(trip);
        }

    // Get user reviews
    
    let reviews = await destination.getUsers(); 
    
        response.reviews = reviews;

        return res.status(200).json({ data: response, err: {}, msg: 'success' });
    
};

module.exports.single_attraction = async (req, res, next) => {
    const attractionId = req.params.id;
    const attraction = await Attraction.findByPk(attractionId);
    if (!attraction) {
        return res.status(404).json({ data: {}, err: {}, msg: 'attrraction not found' });
    }

    const destenation = await attraction.getDestenation().name;
    const events = await attraction.getEvents();
    let Day_trip=[];
    events.forEach(element => {
        Day_trip.push(element.getDayTrips());
    });
    let trips = [];
    Day_trip_id.forEach(async element => {
        trips.push(await element.getTrip());
    });
    const uniqueArray = Array.from(new Set(trips));
    
    let response = {
        destenation:destenation,
        attractions:attraction,
        trips:uniqueArray
    };

    // Process attractions and their images

    // Process trips and their images
    for (const trip of trips) {
        const all_images = await trip.getImages();
        const URL_images = all_images.map(image => image.dataValues.image);
        trip.dataValues.images = URL_images;
        response.trips.push(trip);
    }

    // Get user reviews
    
    let reviews = await attraction.getUsers(); 

    response.reviews = reviews;

    return res.status(200).json({ data: response, err: {}, msg: 'success' });
    
};
