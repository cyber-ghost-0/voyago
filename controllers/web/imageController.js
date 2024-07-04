const BP = require('body-parser');
const Image = require('../../models/image');
const Attraction = require('../../models/Attraction'); 
const Trip = require('../../models/Trip');
const Destination = require('../../models/Destenation');
const multer = require('multer');
const path = require('path');
const Destenation = require('../../models/Destenation');
const upload = multer({ dest: 'uploads/' });

module.exports.add_image = async (req, res, next) => {
    try {
        const { attractionId, tripId, destinationId } = req.body;
        const files = req.files;
        const imageRecords = await Promise.all(
            files.map(async (file) => {
              const imageUrl = `${req.protocol}://${req.get('host')}/${file.filename}`;
              let image;
      
              if (attractionId) {      
                const attraction = await Attraction.findByPk(attractionId);
                if (attraction !== null && attraction.createImage) {
                  image = await attraction.createImage({ url: imageUrl });
                } 
                else if (tripId) {
                const trip = await Trip.findByPk(tripId);
                if (trip !== null && attraction.createImage) {
                image = await trip.createImage({ url: imageUrl });
                }
              } else if (destinationId) {
                const destination = await Destination.findByPk(destinationId);
                if (Destenation !== null && Destenation.createImage) {
                image = await destination.createImage({ url: imageUrl });
                }
              }
      
              return image;
            }})
          );
   
          res.status(200).json({ message: 'Images uploaded successfully', images: imageRecords });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to upload images' });
        }
      };