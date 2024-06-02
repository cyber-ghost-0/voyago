const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const authController = require('../../controllers/app/authController');
const generalController = require('../../controllers/app/generalController');
const is_auth = require('../../middleware/is_auth');
const router = express.Router();

router.get('/myProfile', is_auth, generalController.myProfile);

router.post('/EditMyProfile',is_auth, generalController.EditMyProfile);

module.exports = router;