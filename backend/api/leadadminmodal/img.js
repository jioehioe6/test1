const mongoose = require('mongoose');

const LeadadminbannerSchema = new mongoose.Schema({
  images: {
    type: [String], // Array of image URLs
    required: true,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});



const LeadAdminBanner = mongoose.model('LeadAdminBanner', LeadadminbannerSchema);

module.exports = LeadAdminBanner;
