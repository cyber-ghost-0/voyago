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
    if (refreshToken == null) return res.sendStatus(401);
    if (!services.black_list.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419", async (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = await services.generateAccessToken(user)
        return res.status(200).json({ accessToken: accessToken })
    })
}

module.exports.register = async (req, res, next) => {
    // console.log('*************');
    try {
        const username = req.body.username;
        const password =  req.body.password;
        const email = req.body.email;
        
        let { error } = validateUserInfo(req.body);
        console.log(error);
        
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        if (await is_unique(email, User, 'email') ||await is_unique(username, User, 'username')) {
            return res.status(400).json("emai/username isn\'t unique");
        }
        let cod = '' + services.generateCod();
        
        mail(req.body.email, cod);
        console.log(cod,req.body.email)
        bcrypt.hash(password, 12).then(hashpassword=>{
            
            User.create({ username:username, password: hashpassword  , email : email , role:'user',cod_ver:null});
        }).catch(err => {
            console.log(err);
        });

        return res.status(201).json({ message: 'verification code send to your email' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while registering user' });
    }
};

module.exports.Login = async (req, res, next) => {
    let user = await services.getuser(req.body.username);
    console.log('=/>', user.code_ver, '<=');
    if (!user) {
        return res.status(406).json("Enter a valid username");
    }
    let flag = await bcrypt.compare(req.body.password, user.password);
    if (!user.code_ver) {
        user.destroy();
        return res.status(400).json("destroyed");
    }
    if (!flag) {
        // console.log("NOT _ EQ");
        return res.status(401).json('Invalid username or password');
    }    

    const accessToken =await services.generateAccessToken(user.username);
    const refreshToken =await jwt.sign(user.username, '4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419');
    services.black_list.push(refreshToken);
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
};

module.exports.Logout = async(req, res, next) => {
    services.black_list = services.black_list.filter(token => token !== req.body.token);
    req.headers['authorization']=undefined;
    return res.status(204).send("DONE!");
};


module.exports.check_regesteration_code = (req, res, next) => {
    console.log(req.body.in_code,"  ",req.body.correct_code)
    if (req.body.correct_code === req.body.in_code) {
        
        services.get_user_by_any(req.body.email,User,'email').then((user) => {
            user.cod_ver = req.body.correct_code;
            user.save();
            return user;
        });

        return res.status(200).json("verified!");
    } else {
        return res.status(400).json("invalid cod");
    }
    
};

module.exports.forget_password = (req, res, next) => {
    // console.log('=>',req.body.email,'<=');

    return services.get_user_by_any(req.body.email,User,'email').then((user) => {
        if (!user) {
            return res.status(400).json("This email isn\'t exist");
        }
        let cod = '' + services.generateCod();
        user.cod_ver = cod;
        user.save();
        mail(req.body.email, cod);
        return res.status(200).json(cod);
    });
};

module.exports.check_verification_code = async(req, res, next) => {
    let user = await services.get_user_by_any(req.body.email, User, 'email');
    if (!user) {
        return res.status(400).json("Access Denied !");
    }
    
    // console.log(req.session.user.last_ver , (Date.now()));
    if (user.cod_ver === req.body.cod && ( - user.updatedAt + (Date.now())<= 60000)) {
        
        return res.status(200).json("verified!");
    } else if(user.cod_ver === req.body.cod){
        return res.status(400).json("Time expired for the cod");
    } else {
        return res.status(400).json("invalid cod");
    }

}
module.exports.reset_password = async(req, res, next) => {
    let user = await services.get_user_by_any(req.body.email, User, 'email');
    if (!user) {
        return res.status(400).json("Access Denied !");
    }
    
    bcrypt.hash(req.body.password, 12).then(hashpassword => {
        user.password = hashpassword;
        // console.log(user.password);
        user.save();
    }).catch(err => {
        console.log(err);
        return res.status(400).json("you cant delete a NULL HOLE SHET!");
    });
    return res.status(200).json("changhed");
};
