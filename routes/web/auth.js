const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const authController = require('../../controllers/web/authController');
const is_auth = require('../../middleware/is_auth');
const router = express.Router();


router.post('/register',/* is_exsists, */authController.register);

router.post('/login', authController.Login);

router.delete('/logout',/* is_auth,*/ authController.Logout);

router.post('/token', authController.token);

router.post('/forget_password', authController.forget_password);

router.post('/check_password', authController.check_password);

router.post('/reset_password', authController.reset_password);

//


module.exports = router;