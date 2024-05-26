const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mail = require('../../services/Mails');
const services = require('../../services/public');
const BP = require('body-parser');
const Joi = require('joi');
const Admin = require('../../models/Admin');
const User = require('../../models/User');

// require('dotenv').config()

function validateUserInfo (info) {
    const schema = Joi.object({
        phone_number : Joi.string(),
        country : Joi.string(),
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
    if (!services.black_list.includes(refreshToken)) return res.sendStatus(403).json({msg:'fault',err:'err:refreshToken is invalid'});
    jwt.verify(refreshToken, "4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419", async (err, user) => {
        if (err) return res.sendStatus(403).json({msg:'fault',err:err});
        const accessToken = await services.generateAccessToken(user)
        return res.status(200).json({msg:'Done', accessToken: accessToken })
    })
}

module.exports.Login = async (req, res, next) => {
    let user = await services.get_user_by_any(req.body.email,Admin,'email');
    if (!user) {
        return res.status(406).json({msg:fault,err:"Enter a valid Email"});
    }
    let flag = await bcrypt.compare(req.body.password, user.password);
    if (!flag) {
        return res.status(401).json({msg:fault,err:'Invalid password'});
    }    

    const accessToken =await services.generateAccessToken(user.username);
    const refreshToken =await jwt.sign(user.username, '4ed2d50ac32f06d7c8ae6e3ef5919b43e448d2d3b28307e9b08ca93db8a88202735e933819e5fad292396089219903386abeb44be1940715f38e48e9094db419');
    services.black_list.push(refreshToken);
    res.json({msg:'done', accessToken: accessToken, refreshToken: refreshToken });
};

module.exports.Logout = async(req, res, next) => {
    services.black_list = services.black_list.filter(token => token !== req.body.token);
    req.headers['authorization']=undefined;
    return res.status(204).send({msg:"DONE!"});
};

module.exports.forget_password = (req, res, next) => {
    // console.log('=>',req.body.email,'<=');

    return services.get_user_by_any(req.body.email,Admin,'email').then((user) => {
        if (!user) {
            return res.status(400).json({msg:'fault',err:"This email isn\'t exist"});
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
        return res.status(400).json({msg:'fault',err:"Access Denied !"});
    }
    
    const updatedAtTimestamp = new Date(user.updatedAt).getTime();
    // console.log(updatedAtTimestamp , (Date.now()) ,",,,",user.cod_ver);
    if (user.cod_ver === req.body.cod && ( -updatedAtTimestamp + (Date.now())<= 60000)) {
        
        return res.status(200).json({msg:"verified!"});
    } else if(user.cod_ver === req.body.cod){
        return res.status(400).json({msg:'fault',err:"Time expired for the cod"});
    } else {
        return res.status(400).json({msg:'fault',err:"invalid cod"});
    }

}
module.exports.reset_password = async (req, res, next) => {
    let { error } = validateUserInfo2(req.body);
    console.log(error);
    
    if (error) {
        return res.status(400).send({msg:'fault',err:error.details[0].message});
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
        return res.status(400).json({msg:"fault"});
    });
    return res.status(200).json({msg:"changhed"});
};

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
        const phone_number = req.body.phone_number;
        const country = req.body.country;
        const email = req.body.email;
        
        let { error } = validateUserInfo(req.body);
        console.log(error);
        
        if (error) {
            return res.status(400).send({msg:'fault',err:error.details[0].message});
        }
        if (await is_unique(email, User, 'email') ||await is_unique(username, User, 'username')) {
            return res.status(400).json({msg:'fault',err:"emai/username isn\'t unique"});
        }
        let cod = '' + services.generateCod();
        
        mail(req.body.email, "Admin added you to the app");
        // console.log(cod,req.body.email)
        bcrypt.hash(password, 12).then(hashpassword=>{
            
            User.create({ phone_number : phone_number,country :country,username:username, password: hashpassword  , email : email , role:'user',cod_ver:cod});
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
        return res.json({ msg: "fault", err: "User is not exist!" });
    }
    user.destroy();
    return res.json({msg:"DONE|"}).status(200);
};


module.exports.admins = async (req, res, next) => {
    try {
        const admins = await Admin.findAll();
        return res.json({msg:'Done!',admins:admins});
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
        return res.json({ msg: "fault", err: "Admin is not exist!" });
    }
    admin.destroy();
    return res.json({ msg: "DONE|" }).status(200);
};