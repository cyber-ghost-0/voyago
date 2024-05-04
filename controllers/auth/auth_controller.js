const Users = require('../../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');

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

function is_unique(name,model,col) {

    const whereClause = {};
    whereClause[col] = name;

    console.log(whereClause);
    return model.findOne({ where: whereClause }).then(user => {
        if (user) {
            return 1;
        }
        return 0;
    });
}

module.exports.token = (req, res, next) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    if (!services.black_list.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419", (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = services.generateAccessToken(user.name)
        res.json({ accessToken: accessToken })
    })
}

module.exports.register =  (req, res, next) => {
    // console.log('*************');
    try {
        const username = req.body.username;
        const password =  req.body.password;
        const email = req.body.email;
        
        let { error } = validateUserInfo(req.body);
        console.log(error);
        // console.log(req.body);
        // return is_unique(email, Users, email);
        if (error || is_unique(email, Users, 'email')) {
            return res.status(400).send(error.details[0].message);
        }
        
        bcrypt.hash(password, 12).then(hashpassword=>{
            
            // console.log('=>',hashpassword,'<=');
            Users.create({ username:username, password: hashpassword  , email : email });
        }).catch(err => {
            console.log(err);
        });

        mail(email,'You\'ve regestered successfully !');

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while registering user' });
    }
};

module.exports.Login = async (req, res, next) => {
    let user =await services.getuser(req.body.name);
    console.log('=/>',user,'<=');
    if (!user) {
        return res.json("Enter a valid name");
    }
    const accessToken =await services.generateAccessToken(user);
    const refreshToken =await jwt.sign(user.name, '4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419');
    services.black_list.push(refreshToken);
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
};

module.exports.Logout = (req, res, next) => {
    services.black_list = services.black_list.filter(token => token !== req.body.token);
    req.headers['authorization'] = undefined;
    return res.status(204).json('LoggedOut');
};

module.exports.forget_password = (req, res, next) => {
    console.log('=>',req.body.name,'<=');

    return services.getuser(req.body.name).then((user) => {
        // console.log(user);
        if (!user) {
            return res.json("username isn\'t exist");
        }
        // console.log(user, "//////////////");
        let cod = '' + services.generateCod();
        user.cod_ver = cod;
        user.last_ver =(Date.now());
        user.save();
        mail(user.dataValues.email, cod);
        req.session.check = true;
        req.session.user =user;
        return res.end(cod);
    });

};

module.exports.check_password = (req, res, next) => {
    if (!req.session.check) {
        return res.json("Access Denied !");
    }
    
    console.log(req.session.user.last_ver , (Date.now()));
    if (req.session.user.cod_ver === req.body.cod && ( - req.session.user.last_ver + (Date.now())<= 60000)) {
        req.session.reset = true;
        req.session.check = false;
        return res.json("verified!");
    } else if(req.session.user.cod_ver === req.body.cod){
        return res.json("Time expired for the cod");
    } else {
        return res.json("invalid cod");
    }

};

module.exports.reset_password = (req, res, next) => {
    if (!req.session.reset) {
        return res.json("Access Denied !");
    }
    req.session.reset = false;
    
    bcrypt.hash(req.body.password, 12).then(hashpassword => {
            
        req.session.user.password = hashpassword;
            Users.
            findByPk(req.session.user.id)
            .then(user => {
                user.password = hashpassword;
                console.log(user.password);
                return user.save();
            }).catch(err => {
                console.log(err);
                return res.end("you cant delete a NULL HOLE SHET!");
            });
    });
    return res.json("changhed");
};
