const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');
const User = require('../../models/User');

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

module.exports.token =async (req, res, next) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.status(401).json({ err: {}, data: {},msg : "fault "});
    if (!services.black_list.includes(refreshToken)) return res.sendStatus(403).json({ err: {}, data: {},msg : "fault "});
    jwt.verify(refreshToken, "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419", async (err, user) => {
        if (err) return res.sendStatus(403).json({ err: {}, data: {}, msg: "fault " });
        const accessToken = await services.generateAccessToken(user)
        return res.status(200).json({ err: {}, data: { accessToken: accessToken }, msg: "success!" });
    })
}

module.exports.register = async (req, res, next) => {
    // console.log('*************');
    try {
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        
        let { error } = validateUserInfo(req.body);
        console.log(error);
        
        if (error) {
            return res.status(400).send({ data: {}, err: error.details[0].message, msg: "fault" });
        }
        if (await is_unique(email, User, 'email') ||await is_unique(username, User, 'username')) {
            return res.status(400).json({ data: {},msg: "fault", err: "emai/username isn\'t unique" });
        }
        let cod = '' + services.generateCod();
        
        mail(req.body.email, cod);
        console.log(cod,req.body.email)
        bcrypt.hash(password, 12).then(hashpassword=>{
            
            User.create({ username:username, password: hashpassword  , email : email , role:'user', cod_ver:null});
        }).catch(err => {
            console.log(err);
        });

        return res.status(201).json({ err: {}, msg: 'verification code send to your email', data: { correct_code: cod } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ data: {}, msg:'fault',err :'An error occurred while registering user' });
    }
};

module.exports.Login = async (req, res, next) => {
    let user = await services.getuser(req.body.username);
    // console.log('=/>', user.cod_ver, '<=');
    if (!user) {
        return res.status(406).json({msg:'fault',err:"Enter a valid username",data:{}});
    }
    let flag = await bcrypt.compare(req.body.password, user.password);
    if (!user.cod_ver) {
        user.destroy();
        return res.status(400).json({ msg: "destroyed", data: {}, err: {} });
    }
    if (!flag) {
        // console.log("NOT _ EQ");
        return res.status(401).json({msg:'fault',err:'Invalid username or password',data:{}});
    }    

    const accessToken =await services.generateAccessToken(user.id);
    const refreshToken =await jwt.sign(user.id, '4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419');
    services.black_list.push(refreshToken);
    return res.status(200).json({ data: { accessToken: accessToken, refreshToken: refreshToken }, err: {} ,msg:"Done!"});
};

module.exports.Logout = async(req, res, next) => {
    services.black_list = services.black_list.filter(token => token !== req.body.token);
    req.headers['authorization']=undefined;
    return res.status(204).send({ msg: "DONE!", data: {}, err: {} });
};


module.exports.check_regesteration_code = (req, res, next) => {
    console.log(req.body.in_code,"  ",req.body.correct_code)
    if (req.body.correct_code === req.body.in_code) {
        
        services.get_user_by_any(req.body.email,User,'email').then((user) => {
            user.cod_ver = req.body.correct_code;
            user.save();
            return user;
        });

        return res.status(200).json({ msg: "verified!", data: {}, err: {} });
    } else {
        return res.status(400).json({msg:'fault',err:"invalid cod",data:{}});
    }
    
};

module.exports.forget_password = (req, res, next) => {
    // console.log('=>',req.body.email,'<=');

    return services.get_user_by_any(req.body.email,User,'email').then((user) => {
        if (!user) {
            return res.status(400).json({ msg: 'fault', err: "This email isn\'t exist",data:{} });
        }
        let cod = '' + services.generateCod();
        user.cod_ver = cod;
        user.save();
        mail(req.body.email, cod);
        return res.status(200).json({ msg: 'Done!', data: { code: cod } ,err:{}});
    });
};

module.exports.check_verification_code = async(req, res, next) => {
    let user = await services.get_user_by_any(req.body.email, User, 'email');
    console.log(user); 
    if (!user) {
        return res.status(400).json({msg:'fault',err:"Access Denied !",data:{}});
    }
    
    const updatedAtTimestamp = new Date(user.updatedAt).getTime();
    console.log(updatedAtTimestamp , (Date.now()) ,",,,",user.cod_ver);
    if (user.cod_ver === req.body.cod && ( -updatedAtTimestamp + (Date.now())<= 60000)) {
        
        return res.status(200).json({ msg: "verified!", data: {} ,err:{}});
    } else if(user.cod_ver === req.body.cod){
        return res.status(400).json({msg:'fault',err:"Time expired for the cod",data:{}});
    } else {
        return res.status(400).json({msg:'fault',err:"invalid cod",data:{}});
    }

}
module.exports.reset_password = async(req, res, next) => {
    let user = await services.get_user_by_any(req.body.email, User, 'email');
    if (!user) {
        return res.status(400).json({msg:'fault',err:"Access Denied !",data:{}});
    }
    
    bcrypt.hash(req.body.password, 12).then(hashpassword => {
        user.password = hashpassword;
        // console.log(user.password);
        user.save();
    }).catch(err => {
        console.log(err);
        return res.status(400).json({ msg: "fault", data: {} ,err:{}});
    });
    return res.status(200).json({msg:"changhed",data: {} ,err:{}});
};

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
