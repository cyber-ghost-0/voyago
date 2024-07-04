const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const authController = require('../../controllers/app/authController');
const generalController = require('../../controllers/app/generalController');
const is_auth = require('../../middleware/is_auth');
const router = express.Router();

router.get('/myProfile', is_auth, generalController.myProfile);

router.post('/EditMyProfile', is_auth, generalController.EditMyProfile);

router.get('/im/:id', generalController.im_t);

router.post('/trip_review/:id', is_auth, generalController.trip_review)

router.post('/destenation_review/:id', is_auth, generalController.destenation_review)

router.post('/attraction_review/:id', is_auth, generalController.attraction_review)

router.post('/reservation/:id', is_auth, generalController.reserve_on_trip)

router.post('/charge_wallet', is_auth, generalController.charge_wallet)

router.get('/trending_destenation',is_auth, generalController.trending_destenation)

router.put('/add_trip_favourite/:id', is_auth,generalController.add_trip_favourite)

router.put('/add_destenation_favourite/:id',is_auth, generalController.add_destination_favourite)

router.put('/add_attraction_favourite/:id',is_auth, generalController.add_attraction_favourite)


module.exports = router;