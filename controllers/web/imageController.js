const BP = require("body-parser");
const validateImageUpload = require("../../middleware/imageValidation.js");
const Image = require("../../models/image");
const Attraction = require("../../models/Attraction");
const Trip = require("../../models/Trip");
const Destination = require("../../models/Destenation"); // Corrected typo here
const multer = require("multer");
const path = require("path");

// Define the imageFilter function
const imageFilter = (req, file, cb) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp"]; // Add more extensions if needed
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Invalid file type. Only images are allowed")); // Reject the file
  }
};

// const storage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now();
//     const fileExtension = path.extname(file.originalname);
//     const fileName = `${Date.now()}_${file.originalname}`;
//     cb(null, fileName, fileExtension); // Corrected here to preserve the file extension
//   },
// });

// const storage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now();
//     const fileExtension = path.extname(file.originalname);
//     const fileName = `${Date.now()}_${file.originalname.split('.')[0]}${fileExtension}`; // Corrected to preserve the file extension
//     cb(null, fileName); // Corrected the callback function
//   },
// });

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // const uploadPath = path.join(__dirname, `../../uploads/`);
    const uploadPath = path.join(`/temp`, `../../uploads/`);
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `${file.originalname}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
});

module.exports.add_image = async (req, res, next) => {
  try {
    const { attractionId, tripId, destinationId } = req.body;
    const files = req.files;
    const imageRecords = await Promise.all(
      files.map(async (file) => {
        const fileExtension = path.extname(file.originalname);
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
          file.filename
        }${fileExtension}`; // Changed to use file.path
        let image;

        if (attractionId) {
          const attraction = await Attraction.findByPk(attractionId);
          if (attraction !== null && attraction.createImage) {
            image = await attraction.createImage({ url: imageUrl });
          }
        } else if (tripId) {
          const trip = await Trip.findByPk(tripId);
          if (trip !== null && trip.createImage) {
            image = await trip.createImage({ url: imageUrl });
          }
        } else if (destinationId) {
          const destination = await Destination.findByPk(destinationId);
          if (destination !== null && destination.createImage) {
            image = await destination.createImage({ url: imageUrl });
          }
        }

        return image;
      })
    );

    res
      .status(200)
      .json({ message: "Images uploaded successfully", images: imageRecords });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
};
