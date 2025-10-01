const express = require('express');
const router = express.Router();

const SuperAdminToggle = require('../superadmin/button');  
const SuperAdminGallery = require('../superadmin/content'); 
const SuperAdminNews = require('../superadmin/news'); 
const SuperAdminBanner = require('../superadmin/img'); 

const authMiddleware = require("../controler/Auth"); 


const Gallery = require('../models/content'); // adjust path
const News = require('../models/news'); // adjust path
const Toggle = require('../models/button'); // adjust path
const Galleryy = require('../models/img'); // adjust path


// ------------------ GALLERY ------------------
router.put('/gallery', authMiddleware, async (req, res) => {
  try {
    console.log('[superadmin] PUT /gallery incoming body:', JSON.stringify(req.body));
    const galleryImages = req.body.galleryImages;

    if (!Array.isArray(galleryImages)) {
      return res.status(400).json({ error: "galleryImages must be an array" });
    }

    let gallery = await SuperAdminGallery.findOne();
    if (gallery) {
      gallery.galleryImages = galleryImages;  
      await gallery.save();
    } else {
      gallery = new SuperAdminGallery({ galleryImages });
      await gallery.save();
    }

    res.json({ message: "Gallery updated successfully", gallery });
  } catch (err) {
    console.error('[superadmin] PUT /gallery error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/gallery', authMiddleware, async (req, res) => {
  try {
    let gallery = await SuperAdminGallery.findOne();
    if (!gallery) {
      gallery = new SuperAdminGallery({ galleryImages: [] });
      await gallery.save();
    }
    res.json({ galleryImages: gallery.galleryImages, _id: gallery._id });
  } catch (err) {
    console.error('[superadmin] GET /gallery error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// ------------------ NEWS ------------------
router.put('/news', authMiddleware, async (req, res) => {
  try {
    const newsItems = req.body.newsItems;

    if (!Array.isArray(newsItems)) {
      return res.status(400).json({ error: "newsItems must be an array" });
    }

    let newsDoc = await SuperAdminNews.findOne();
    if (newsDoc) {
      newsDoc.newsItems = [...(newsDoc.newsItems || []), ...newsItems];
      await newsDoc.save();
    } else {
      newsDoc = new SuperAdminNews({ newsItems });
      await newsDoc.save();
    }

    res.json({ message: "News updated successfully", news: newsDoc });
  } catch (err) {
    console.error('[superadmin] PUT /news error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/news', async (req, res) => {
  try {
    const newsDoc = await SuperAdminNews.findOne();
    const items = newsDoc ? newsDoc.newsItems : [];
    res.json({ newsItems: items });
  } catch (err) {
    console.error('[superadmin] GET /news error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const newsDoc = await SuperAdminNews.findOne();
    if (!newsDoc || !Array.isArray(newsDoc.newsItems)) {
      return res.status(404).json({ message: 'No news found' });
    }
    const item = newsDoc.newsItems.find(n => n && (n._id?.toString?.() === id || n.id === id));
    if (!item) {
      return res.status(404).json({ message: 'News item not found' });
    }
    return res.json(item);
  } catch (err) {
    console.error('[superadmin] GET /news/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// ------------------ TOGGLE ------------------
router.put('/toggle', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body; 

    let toggle = await SuperAdminToggle.findOne();
    if (!toggle) {
      toggle = new SuperAdminToggle({ isActive });
    } else {
      toggle.isActive = isActive;
    }
    await toggle.save();

    res.json({ isActive: toggle.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/toggle', authMiddleware, async (req, res) => {
  try {
    let toggle = await SuperAdminToggle.findOne();
    if (!toggle) {
      toggle = new SuperAdminToggle({ isActive: false });
      await toggle.save();
    }
    const message = toggle.isActive ? "Independence Day" : "Normal Day";
    res.json({ isActive: toggle.isActive, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------ BANNER ------------------
router.put('/banner', authMiddleware, async (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) {
      return res.status(400).json({ message: 'Images should be an array' });
    }

    let banner = await SuperAdminBanner.findOne();
    if (!banner) {
      banner = new SuperAdminBanner({ images });
    } else {
      banner.images = images;
    }
    await banner.save();

    res.json(banner);
  } catch (err) {
    console.error('[superadmin] PUT /banner error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// ------------------ ALL CONTENT ------------------
router.get('/all-content', async (req, res) => {
  try {
    const newsDoc = await SuperAdminNews.findOne();      
    const galleryDoc = await SuperAdminGallery.findOne(); 
    let toggle = await SuperAdminToggle.findOne();
    let banner = await SuperAdminBanner.findOne();

    res.json({
      newsItems: newsDoc ? newsDoc.newsItems : [],
      galleryImages: galleryDoc ? galleryDoc.galleryImages : [],
      banner: banner ? banner.images : [],
      toggle: toggle ? toggle.isActive : false
    });
  } catch (error) {
    console.error('[superadmin] GET /all-content error:', error);
    res.status(500).json({ message: 'Server error fetching content' });
  }
});


router.put('/forward', async (req, res) => {
  try {
    // Fetch data from super admin collections
    const superAdminGalleryData = await SuperAdminGallery.find();
    const superAdminNewsData = await SuperAdminNews.find();
    const superAdminToggleData = await SuperAdminToggle.find();
    const superAdminBannerData = await SuperAdminBanner.find();

    // Replace normal collections with super admin data
    await Gallery.deleteMany();
    await Gallery.insertMany(superAdminGalleryData);

    await News.deleteMany();
    await News.insertMany(superAdminNewsData);

    await Toggle.deleteMany();   // normal toggle collection
    await Toggle.insertMany(superAdminToggleData);

    await Banner.deleteMany();
    await Banner.insertMany(superAdminBannerData);

    res.status(200).json({ message: 'Normal collections restored from super admin data successfully' });
  } catch (error) {
    console.error('Error restoring normal collections:', error);
    res.status(500).json({ error: 'Failed to restore normal collections' });
  }
});


module.exports = router;
