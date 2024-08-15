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

router.get('/destinationInfo1/:id', is_auth, generalController.destinationInfo1);

router.get('/destinationInfo2/:id',is_auth,generalController.destinationInfo2);

router.get('/destinationInfo3/:id',is_auth,generalController.destinationInfo3);

router.get('/attractionInfo1/:id',is_auth,generalController.attractionInfo1);

router.get('/attractionInfo2/:id',is_auth,generalController.attractionInfo2);

router.get('/Attraction_full_review/:id',is_auth,generalController.full_review_Attraction);

router.get('/destenation_full_review/:id', is_auth, generalController.full_review_destenation)

router.get('/trip_full_review/:id', is_auth, generalController.full_review_trip)

router.get('/tripInfo1/:id',generalController.TripInfo1);

router.get('/tripInfo2/:id', generalController.TripInfo2);

router.get('/tripInfo3/:id',is_auth, generalController.TripInfo3);

router.get('/check_before_delete_destination/:id',is_auth, generalController.check_before_delete_destination);

router.get('/check_before_delete_attraction/:id',is_auth, generalController.check_before_delete_attraction);

router.get('/overview_users',is_auth, generalController.overview_users);

router.get('/top_trips',is_auth, generalController.top_trips);

router.get('/top_destinations',is_auth, generalController.top_destinations);

router.get('/profile_pic/:id', is_auth, generalController.id_profile_pic);

router.delete('/delete_reservation_by_id/:id', is_auth, generalController.delete_reservation_by_id);

router.get('/delete_profile_requests',is_auth, generalController.delete_profile_requests);

router.get('/delete_user_directly/:id',is_auth, generalController.delete_user_directly);

router.get('/empty_then_delete/:id',is_auth, generalController.empty_then_delete);

module.exports = router;