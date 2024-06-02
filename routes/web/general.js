const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const authController = require('../../controllers/web/authController');
const generalController = require('../../controllers/web/generalController');
const is_auth = require('../../middleware/is_auth');
const router = express.Router();


router.get('/users', generalController.users);

router.post('/add_user', generalController.add_user);

router.delete('/delete_user/:id', generalController.delete_user);

router.get('/admins', generalController.admins);

router.post('/add_admin', generalController.add_admin);

router.delete('/delete_admin/:id', generalController.delete_admin);

router.get('/admins/:id', generalController.show_admin);

router.get('/users/:id', generalController.show_user);

router.get('/features_included', generalController.show_features_included);

router.post('/add_features_included', generalController.add_features_included);

router.post('/add_trip', is_auth,generalController.add_trip);




//


module.exports = router;