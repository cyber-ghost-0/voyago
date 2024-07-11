const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');
const User = require('../../models/User');
const Trip=require('../../models/Trip')
const Image=require('../../models/image');
const { Sequelize, where } = require('sequelize');
const { SequelizeMethod } = require('sequelize/lib/utils');
const Every_user_review =require('../../models/EveryUserReview');
const Attraction = require('../../models/Attraction');
const Destenation = require('../../models/Destenation');
const reservation = require('../../models/reservation');
const Wallet = require('../../models/wallet.js');
const Transaction = require('../../models/transaction.js');
const ChargeRequest = require('../../models/chargeRequest');
const favourites = require('../../models/Favourites.js');
const { use } = require('../../routes/app/auth.js');
const review = require('../../models/review.js');
const every_user_review = require('../../models/EveryUserReview');


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
    const user = await User.findByPk(req.user_id);
    let flag = await bcrypt.compare(password, user.password);
    if (!flag) {
        let response = { data: {}, msg: "fail" ,err:"password is not correct !"};
        return res.json(response).status(500);
    }

    await reservation.create({ fname: fname, lname: lname, adult: adult, child: child, phone: phone, UserId: req.user_id, TripId: trip_id });
    let response = { data: {}, msg: "you have regesterd on this trip !" ,err:{}};
    return res.json(response).status(200);
}


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
    Day_trip.forEach(async element => {
        trips.push(await element.getTrip());
    });
    const uniqueArray = Array.from(new Set(trips));
    
    let response = {
        destenation:destenation,
        attractions:attraction,
        trips:uniqueArray
    };


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

module.exports.charge_wallet    = async (req, res, next) => {
    const user_id = req.user_id;
    const bank_ticket = req.body.bank_ticket;
    const amount = req.body.amount;

    await ChargeRequest.create({ UserId: user_id, bank_ticket: bank_ticket, amount: amount });
    return res.status(200).json({ data: {}, err: {}, msg: 'wait for admin response <3' });
}   


module.exports.add_trip_favourite = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const trip = await Trip.findByPk(req.params.id);

        if (!trip) {
            return res.status(404).json({ err: 'Trip not found',msg:'fault' });
        }

        let fav = await favourites.findOne({ where: { UserId: user_id, TripId: trip.id } });
        
        if (!fav) {
            fav = await favourites.create({ UserId: user_id, TripId: trip.id, is_favourite: false });
        }

        fav.is_favourite = !fav.is_favourite;
        await fav.save();
        
        return res.status(200).json({ msg: 'Favourite status updated', data: {} });
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
            return res.status(404).json({ err: 'Attraction not found',msg:'fault' });
        }

        let fav = await favourites.findOne({ where: { UserId: user_id, AttractionId: attraction.id } });

        if (!fav) {
            fav = await favourites.create({ UserId: user_id, AttractionId: attraction.id, is_favourite: false });
        }
        
        fav.is_favourite = !fav.is_favourite;
        await fav.save();
        
        return res.status(200).json({ msg: 'Favourite status updated', data: {} });
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
            return res.status(404).json({ err: 'Destination not found' });
        }

        let fav = await favourites.findOne({ where: { UserId: user_id, DestenationId: destination.id } });
        
        if (!fav) {
            fav = await favourites.create({ UserId: user_id, DestenationId: destination.id, is_favourite: false });
        }
        
        fav.is_favourite = !fav.is_favourite;
        await fav.save();
        
        return res.status(200).json({ msg: 'Favourite status updated', data: {} });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


module.exports.trending_destenation = async (req, res, next) => {
    try {
        let result = [];
        let destenations = await Destenation.findAll();

        await Promise.all(destenations.map(async (single_dist) => {
            let image = await Image.findOne({ where: { DestenationId: single_dist.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, DestenationId: single_dist.id } });

            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, DestenationId: single_dist.id, is_favourite: false });
            }
    
            let object = {
                id: single_dist.id,
                name: single_dist.name,
                image: image.image,
                is_favourite: fav.is_favourite
            };

            let trips = await Trip.findAll({ where: { DestenationId: single_dist.id } });
            let reservationCount = await Promise.all(trips.map(async (single_trip) => {
                let reservations = await reservation.findAll({ where: { TripId: single_trip.id } });
                return reservations.length;
            }));

            object.cnt = reservationCount.reduce((acc, count) => acc + count, 0);
            result.push(object);
        }));
        result.sort((b, a) => a.cnt - b.cnt);

        result = result.slice(0, 10);
        
        return res.status(200).json({ msg: {}, data: {result} });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

module.exports.top_attractions = async (req, res, next) => {
    try {
        let result = [];
        let attractions = await Attraction.findAll();

        await Promise.all(attractions.map(async (single_attr) => {
            let image = await Image.findOne({ where: { AttractionId: single_attr.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, AttractionId: single_attr.id } });

            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, AttractionId: single_attr.id, is_favourite: false });
            }
    
            let object = {
                id: single_attr.id,
                name: single_attr.name,
                image: image.image,
                is_favourite: fav.is_favourite
            };
            let reviews = await every_user_review.findAll({ where: { AttractionId: single_attr.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                console.log(element.dataValues);
                if (element.rate) {
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            }
            rate = rate.toFixed(1);
            object.rate = rate;
            result.push(object);
        }));
        result.sort((b, a) => a.rate - b.rate);

        result = result.slice(0, 10);
        return res.status(200).json({ msg: {}, data: {result} });

    } catch (err) {
        console.error(err);
        next(err);
    }
};

module.exports.top_trips = async (req, res, next) => {
    try {
        let result = [];
        let trips = await Trip.findAll();

        await Promise.all(trips.map(async (single_trip) => {
            let image = await Image.findOne({ where: { TripId: single_trip.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, TripId: single_trip.id } });

            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, TripId: single_trip.id, is_favourite: false });
            }
    
            let object = {
                id: single_trip.id,
                name: single_trip.name,
                image: image.image,
                is_favourite: fav.is_favourite
            };
            let reviews = await every_user_review.findAll({ where: { TripId: single_trip.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                // console.log(element.dataValues);
                if(element.rate){
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            } 
            rate=rate.toFixed(1);
            object.rate = rate;
            result.push(object);
        }));
        result.sort((b, a) => a.rate - b.rate);

        result = result.slice(0, 10);
        
        return res.status(200).json({ msg: {}, data: {result} });

    } catch (err) {
        console.error(err);
        next(err);
    }
}   

module.exports.popular_trips = async (req, res, next) => {
    try {
        let result = [];
        let trips = await Trip.findAll();

        await Promise.all(trips.map(async (single_trip) => {
            try {
                let image = await Image.findOne({ where: { TripId: single_trip.id } });
                let fav = await favourites.findOne({ where: { UserId: req.user_id, TripId: single_trip.id } });

                if (!fav) {
                    fav = await favourites.create({ UserId: req.user_id, TripId: single_trip.id, is_favourite: false });
                }

                const diffTime = Math.abs(new Date(single_trip.end_date) - new Date(single_trip.start_date));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                let dist = await Destenation.findByPk(single_trip.DestenationId);
                
                let object = {
                    id: single_trip.id,
                    name: single_trip.name,
                    image: image ? image.image : null,
                    is_favourite: fav.is_favourite,
                    duration: diffDays,
                    destenation: dist ? dist.name : null,
                    price: single_trip.price
                };

                let reservationCount = (await reservation.findAll({ where: { TripId: single_trip.id } })).length;
                object.cnt = reservationCount;
                result.push(object);
            } catch (innerErr) {
                console.error(`Error processing trip ID ${single_trip.id}:`, innerErr);
            }
        }));

        result.sort((b, a) => a.cnt - b.cnt);
        result = result.slice(0, 10);
        
        return res.status(200).json({ msg: {}, data: {result} });

    } catch (err) {
        console.error('Error fetching popular trips:', err);
        next(err);
    }
};

module.exports.recommended_attractions_by_destenation = async (req, res, next) => {
    try {
        let result = [];
        let name = req.params.name;
        let destenation = await Destenation.findOne({ where: { name: name } });
        if (!destenation) {
            return res.status(404).json({ err: 'Destination not found' });
        }
        let attractions = await Attraction.findAll({where:{DestenationId:destenation.id}});
        // console.log(destenation_id);
        await Promise.all(attractions.map(async (single_attr) => {
            let image = await Image.findOne({ where: { AttractionId: single_attr.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, AttractionId: single_attr.id } });

            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, AttractionId: single_attr.id, is_favourite: false });
            }
    
            let object = {
                id: single_attr.id,
                name: single_attr.name,
                image: image.image,
                is_favourite: fav.is_favourite
            };
            let reviews = await every_user_review.findAll({ where: { AttractionId: single_attr.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                console.log(element.dataValues);
                if (element.rate) {
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            }
            rate = rate.toFixed(1);
            object.rate = rate;
            result.push(object);
        }));
        result.sort((b, a) => a.rate - b.rate);

        result = result.slice(0, 10);
        return res.status(200).json({ msg: {}, data: {result} });

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
            return res.status(404).json({ err: 'Destination not found' });
        }
        let trips = await Trip.findAll({where:{DestenationId:destenation.id}});

        await Promise.all(trips.map(async (single_trip) => {
            let image = await Image.findOne({ where: { TripId: single_trip.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, TripId: single_trip.id } });

            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, TripId: single_trip.id, is_favourite: false });
            }
    
            let object = {
                id: single_trip.id,
                name: single_trip.name,
                image: image.image,
                is_favourite: fav.is_favourite
            };
            let reviews = await every_user_review.findAll({ where: { TripId: single_trip.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                // console.log(element.dataValues);
                if(element.rate){
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            } 
            rate=rate.toFixed(1);
            object.rate = rate;
            result.push(object);
        }));
        result.sort((b, a) => a.rate - b.rate);

        result = result.slice(0, 10);
        
        return res.status(200).json({ msg: {}, data: {result} });

    } catch (err) {
        console.error(err);
        next(err);
    }
}
   

module.exports.all_trips_by_destenation = async (req, res, next) => {
    try {
        let result = [];
        let name = req.params.name;
        let destenation = await Destenation.findOne({ where: { name: name } });
        if (!destenation) {
            return res.status(404).json({ err: 'Destination not found' });
        }
        let trips = await Trip.findAll({where:{DestenationId:destenation.id}});

        await Promise.all(trips.map(async (single_trip) => {
            let image = await Image.findOne({ where: { TripId: single_trip.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, TripId: single_trip.id } });
            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, TripId: single_trip.id, is_favourite: false });
            }
            const diffTime = Math.abs(new Date(single_trip.end_date) - new Date(single_trip.start_date));
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const reservations = await reservation.findAll({ where: { TripId: single_trip.id } });
            let regestered = 0;
            reservations.forEach(element => {
                regestered+=element.adult+element.child
            });
            let object = {
                id: single_trip.id,
                name: single_trip.name,
                image: image.image,
                is_favourite: fav.is_favourite,
                start_date: single_trip.start_date,
                end_date: single_trip.end_date,
                duration: diffDays,
                is_avilable: single_trip.avilable,
                maxcapacity: single_trip.capacity,
                regestered:regestered
                
            };
            let reviews = await every_user_review.findAll({ where: { TripId: single_trip.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                // console.log(element.dataValues);
                if(element.rate){
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            } 
            rate=rate.toFixed(1);
            object.rate = rate;
            result.push(object);
        }));
  
        
        return res.status(200).json({ msg: {}, data: {result} });

    } catch (err) {
        console.error(err);
        next(err);
    }
}
module.exports.all_attractions_by_destenation = async (req, res, next) => {
    try {
        let result = [];
        let name = req.params.name;
        let destenation = await Destenation.findOne({ where: { name: name } });
        if (!destenation) {
            return res.status(404).json({ err: 'Destination not found' });
        }
        let attractions = await Attraction.findAll({where:{DestenationId:destenation.id}});
        // console.log(destenation_id);
        await Promise.all(attractions.map(async (single_attr) => {
            let image = await Image.findOne({ where: { AttractionId: single_attr.id } });
            let fav = await favourites.findOne({ where: { UserId: req.user_id, AttractionId: single_attr.id } });

            if (!fav) {
                fav = await favourites.create({ UserId: req.user_id, AttractionId: single_attr.id, is_favourite: false });
            }
    
            let object = {
                id: single_attr.id,
                name: single_attr.name,
                image: image.image,
                is_favourite: fav.is_favourite
            };
            let reviews = await every_user_review.findAll({ where: { AttractionId: single_attr.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                console.log(element.dataValues);
                if (element.rate) {
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            }
            rate = rate.toFixed(1);
            object.rate = rate;
            result.push(object);
        }));
        return res.status(200).json({ msg: {}, data: {result} });

    } catch (err) {
        console.error(err);
        next(err);
    }
}

module.exports.TripImages = async (req, res, next) => {
    let Trip_id = req.params.id;
    let images = await Image.findAll({ where: { TripId: Trip_id } })
    return res.status(200).json({ msg: {}, data: images });

}

module.exports.TripInfo = async (req, res, next) => {
    let Trip_id = req.params.id;
    const trip = await Trip.findByPk(Trip_id);
    let destenation = await Destenation.findByPk(trip.destinationId);
    let reviews = await every_user_review.findAll({ where: { TripId: trip.id } });
            let rate = 0.0;
            let cnt = 0;
            reviews.forEach(element => {
                console.log(element.dataValues);
                if (element.rate) {
                    cnt++;
                    rate += element.rate;
                    console.log(element.rate);
                }
            });
            if (!cnt) rate = 0;
            else {
                rate = rate * 1.0 / cnt;
            }
            rate = rate.toFixed(1);
    let result = {
        name: trip.name,
        location: destenation.name,
        rate: rate,
        reviews: cnt,
        price:trip.trip_price
    }
    return res.status(200).json({ msg: {}, data: result });
}

