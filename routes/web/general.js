const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const authController = require('../../controllers/web/authController');
const generalController = require('../../controllers/web/generalController');
const is_auth = require('../../middleware/is_auth');
const multer = require('multer');
const validateImageUpload = require('../../middleware/imageValidation');
const upload = multer({ dest: 'uploads/' });
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

router.post('/add_trip', is_auth, generalController.upload, generalController.add_trip);

router.get('/trip_cards',generalController.trips_card);

router.delete('/delete_trip/:id',generalController.delete_trip);

router.post('/add_destenation', is_auth, generalController.upload, generalController.add_destenation);

router.post('/add_attraction', is_auth, generalController.upload, generalController.add_attraction);

router.get('/destenations', generalController.Destenations);

router.get('/attractions', generalController.Attractions);

router.delete('/delete_attraction/:id', generalController.delete_attraction);

router.delete('/delete_destenation/:id', generalController.delete_destenation);

router.get('/destenation/:id', generalController.single_destination);

router.get('/attraction/:id', generalController.single_attraction);

router.get('/charge_requests',is_auth, generalController.charge_requests);

router.get('/approve_charge/:id', is_auth,generalController.approve_charge);

router.get('/reject_charge/:id', is_auth,generalController.reject_charge);

router.get('/show_all_transactions', is_auth, generalController.show_all_transactions);

router.get('/show_all_reservations', is_auth, generalController.show_all_reservations);

router.post('/upload_trip_images', is_auth, generalController.upload, generalController.upload_trip_images);
//


module.exports = router;