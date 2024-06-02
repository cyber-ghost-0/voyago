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

module.exports.token =async (req, res, next) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401).json({msg:'fault',err:'err:refreshToken is null'});
    if (!services.black_list.includes(refreshToken)) return res.sendStatus(500).json({msg:'fault',err:'err:refreshToken is invalid'});
    jwt.verify(refreshToken, "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419", async (err, user) => {
        if (err) return res.sendStatus(403).json({msg:'fault',err:err});
        const accessToken = await services.generateAccessToken(user)
        return res.status(200).json({msg:'Done', accessToken: accessToken })
    })
}

module.exports.Login = async (req, res, next) => {
    let user = await services.get_user_by_any(req.body.email,Admin,'email');
    if (!user) {
        return res.status(500).json({msg:'fault',err:"Enter a valid Email"});
    }
    let flag = await bcrypt.compare(req.body.password, user.password);
    if (!flag) {
        return res.status(401).json({msg:'fault',err:'Invalid password'});
    }    

    const accessToken =await services.generateAccessToken(user.id);
    const refreshToken =await jwt.sign(user.username, '4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419');
    services.black_list.push(refreshToken);
    res.json({ msg: 'done', accessToken: accessToken, refreshToken: refreshToken, name: user.username, role: user.role });
};

module.exports.Logout = async(req, res, next) => {
    services.black_list = services.black_list.filter(token => token !== req.body.token);
    req.headers['authorization']=undefined;
    return res.status(200).send({msg:"DONE!"});
};

module.exports.forget_password = (req, res, next) => {
    // console.log('=>',req.body.email,'<=');

    return services.get_user_by_any(req.body.email,Admin,'email').then((user) => {
        if (!user) {
            return res.status(500).json({msg:'fault',err:"This email isn\'t exist"});
        }
        let cod = '' + services.generateCod();
        user.cod_ver = cod;
        user.save();
        mail(req.body.email, cod);
        return res.status(200).json({msg:'Done',code:cod});
    });
};

module.exports.check_verification_code = async(req, res, next) => {
    let user = await services.get_user_by_any(req.body.email, Admin, 'email');
    console.log(user); 
    if (!user) {
        return res.status(500).json({msg:'fault',err:"Access Denied !"});
    }
    
    const updatedAtTimestamp = new Date(user.updatedAt).getTime();
    // console.log(updatedAtTimestamp , (Date.now()) ,",,,",user.cod_ver);
    if (user.cod_ver === req.body.cod && ( -updatedAtTimestamp + (Date.now())<= 60000)) {
        
        return res.status(200).json({msg:"verified!"});
    } else if(user.cod_ver === req.body.cod){
        return res.status(400).json({msg:'fault',err:"Time expired for the cod"});
    } else {
        return res.status(406).json({msg:'fault',err:"invalid cod"});
    }

}
module.exports.reset_password = async (req, res, next) => {
    let { error } = validateUserInfo2(req.body);
    console.log(error);
    
    if (error) {
        return res.status(500).send({msg:'fault',err:error.details[0].message});
    }

    let user = await services.get_user_by_any(req.body.email, Admin, 'email');
    if (!user) {
        return res.status(400).json({msg:'fault',err:"Access Denied !"});
    }
    
    bcrypt.hash(req.body.password, 12).then(hashpassword => {
        user.password = hashpassword;
        // console.log(user.password);
        user.save();
    }).catch(err => {
        console.log(err);
        return res.status(406).json({msg:"fault"});
    });
    return res.status(200).json({msg:"changhed"});
};

