const express = require('express');
const is_exsists = require('../../middleware/is_exsists');
const multer = require('multer');
const imageController = require('../../controllers/web/imageController');
const is_auth = require('../../middleware/is_auth');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });


router.post('/upload', upload.array('images', 10), imageController.add_image);


module.exports = router;