const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const authController = require('../../controllers/web/authController');
const is_auth = require('../../middleware/is_auth');
const router = express.Router();


router.post('/login', authController.Login);

router.delete('/logout',is_auth, authController.Logout);

router.post('/token', authController.token);

router.post('/forget_password', authController.forget_password);

router.post('/check_verification_code', authController.check_verification_code);

router.post('/reset_password', authController.reset_password);

//


module.exports = router;