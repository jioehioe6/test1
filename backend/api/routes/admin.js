const express = require('express');
const router = express.Router();
const AdminGallery = require('../adminmodals/content'); // gallery images
const AdminNews = require('../adminmodals/news');       // news items
const AdminToggle = require('../adminmodals/button');   // toggle button
const AdminBanner = require('../adminmodals/img');      // banner images
const authMiddleware = require("../controler/Auth");    // authentication middleware
const Gallery = require('../models/content');
const News = require('../models/news');
const Toggle = require('../models/button');
const Galleryy = require('../models/img');
const leadAdminToggle = require('../leadadminmodal/button');
const leadAdminGallery = require('../leadadminmodal/content');
const leadAdminNews = require('../leadadminmodal/news');
const leadAdminBanner = require('../leadadminmodal/img');
// ------------------- GALLERY ROUTES -------------------

// PUT /gallery - replace the gallery images array

router.put('/restore', async (req, res) => {
  try {
    // Fetch data from normal collections
    const galleryData = await Gallery.find();
    const newsData = await News.find();
    const toggleData = await Toggle.find();
    const bannerData = await Galleryy.find();

    // Replace admin collections with normal data
    await AdminGallery.deleteMany();
    await AdminGallery.insertMany(galleryData);

    await AdminNews.deleteMany();
    await AdminNews.insertMany(newsData);

    await AdminToggle.deleteMany();
    await AdminToggle.insertMany(toggleData);

    await AdminBanner.deleteMany();
    await AdminBanner.insertMany(bannerData);

    res.status(200).json({ message: 'Admin data restored from normal collections successfully' });
  } catch (error) {
    console.error('Error restoring admin data:', error);
    res.status(500).json({ error: 'Failed to restore admin data' });
  }
}),

router.put('/gallery',  async (req, res) => {
  try {
    const { galleryImages } = req.body;

    if (!Array.isArray(galleryImages)) {
      return res.status(400).json({ error: "galleryImages must be an array" });
    }

    let gallery = await AdminGallery.findOne();
    if (gallery) {
      gallery.galleryImages = galleryImages;  
      await gallery.save();
    } else {
      gallery = new AdminGallery({ galleryImages });
      await gallery.save();
    }

    res.json({ message: "Gallery updated successfully", gallery });
  } catch (err) {
    console.error('PUT /gallery error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /gallery - get gallery images
router.get('/gallery', authMiddleware, async (req, res) => {
  try {
    let gallery = await AdminGallery.findOne();
    if (!gallery) {
      gallery = new AdminGallery({ galleryImages: [] });
      await gallery.save();
    }
    res.json({ galleryImages: gallery.galleryImages, _id: gallery._id });
  } catch (err) {
    console.error('GET /gallery error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ------------------- NEWS ROUTES -------------------

// PUT /news - append news items
router.put('/news', authMiddleware, async (req, res) => {
  try {
    const { newsItems } = req.body;
    if (!Array.isArray(newsItems)) {
      return res.status(400).json({ error: "newsItems must be an array" });
    }

    let newsDoc = await AdminNews.findOne();
    if (newsDoc) {
      newsDoc.newsItems = [...(newsDoc.newsItems || []), ...newsItems];
      await newsDoc.save();
    } else {
      newsDoc = new AdminNews({ newsItems });
      await newsDoc.save();
    }

    res.json({ message: "News updated successfully", news: newsDoc });
  } catch (err) {
    console.error('PUT /news error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /news - all news
router.get('/news', async (req, res) => {
  try {
    const newsDoc = await AdminNews.findOne();
    const items = newsDoc ? newsDoc.newsItems : [];
    res.json({ newsItems: items });
  } catch (err) {
    console.error('GET /news error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /news/:id - single news item
router.get('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const newsDoc = await AdminNews.findOne();
    if (!newsDoc || !Array.isArray(newsDoc.newsItems)) {
      return res.status(404).json({ message: 'No news found' });
    }

    const item = newsDoc.newsItems.find(n => n._id?.toString() === id || n.id === id);
    if (!item) return res.status(404).json({ message: 'News item not found' });

    res.json(item);
  } catch (err) {
    console.error('GET /news/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------- TOGGLE ROUTES -------------------

// PUT /toggle - update toggle state
router.put('/toggle', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    let toggle = await AdminToggle.findOne();
    if (!toggle) {
      toggle = new AdminToggle({ isActive });
    } else {
      toggle.isActive = isActive;
    }
    await toggle.save();
    res.json({ isActive: toggle.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /toggle - get toggle state
router.get('/toggle', authMiddleware, async (req, res) => {
  try {
    let toggle = await AdminToggle.findOne();
    if (!toggle) {
      toggle = new AdminToggle({ isActive: false });
      await toggle.save();
    }
    const message = toggle.isActive ? "Independence Day" : "Normal Day";
    res.json({ isActive: toggle.isActive, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- BANNER ROUTES -------------------

// PUT /banner - update banner images
router.put('/banner', authMiddleware, async (req, res) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images)) {
      return res.status(400).json({ message: 'Images should be an array' });
    }

    let banner = await AdminBanner.findOne();
    if (!banner) {
      banner = new AdminBanner({ images });
    } else {
      banner.images = images;
    }
    await banner.save();

    res.json(banner);
  } catch (err) {
    console.error('PUT /banner error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ------------------- ALL CONTENT -------------------

router.get('/all-content', async (req, res) => {
  try {
    const newsDoc = await AdminNews.findOne();
    const galleryDoc = await AdminGallery.findOne();
    const toggle = await AdminToggle.findOne();
    const banner = await AdminBanner.findOne();

    res.json({
      newsItems: newsDoc ? newsDoc.newsItems : [],
      galleryImages: galleryDoc ? galleryDoc.galleryImages : [],
      banner: banner ? banner.images : [],
      toggle: toggle ? toggle.isActive : false
    });
  } catch (error) {
    console.error('GET /all-content error:', error);
    res.status(500).json({ message: 'Server error fetching content' });
  }
});

// ------------------- LEAD ADMIN RESTORE ROUTE -------------------

router.put('/forward', async (req, res) => {
  try {
    // 1️⃣ Fetch data from admin collections
    const adminGalleryData = await AdminGallery.find();
    const adminNewsData = await AdminNews.find();
    const adminToggleData = await AdminToggle.find();
    const adminBannerData = await AdminBanner.find();

    // If any collection is empty, warn
    if (!adminGalleryData.length && !adminNewsData.length && !adminToggleData.length && !adminBannerData.length) {
      return res.status(400).json({ error: 'No admin data found to forward' });
    }

    // 2️⃣ Clean data to avoid _id conflicts
    const cleanData = (data) => data.map(({ _id, ...rest }) => rest);

    // 3️⃣ Forward data to lead admin collections
    try {
      await leadAdminGallery.deleteMany();
      await leadAdminGallery.insertMany(cleanData(adminGalleryData));

      await leadAdminNews.deleteMany();
      await leadAdminNews.insertMany(cleanData(adminNewsData));

      await leadAdminToggle.deleteMany();
      await leadAdminToggle.insertMany(cleanData(adminToggleData));

      await leadAdminBanner.deleteMany();
      await leadAdminBanner.insertMany(cleanData(adminBannerData));
    } catch (insertError) {
      console.error('Error inserting data into lead admin collections:', insertError);
      return res.status(500).json({ error: 'Failed to insert data into lead admin collections', details: insertError.message });
    }

    // 4️⃣ Optional: Delete admin collections only if forwarding succeeded
    try {
      await AdminGallery.deleteMany();
      await AdminNews.deleteMany();
      await AdminToggle.deleteMany();
      await AdminBanner.deleteMany();
    } catch (deleteError) {
      console.error('Error deleting admin collections:', deleteError);
      return res.status(500).json({ error: 'Forwarded data but failed to delete admin collections', details: deleteError.message });
    }

    res.status(200).json({ message: 'Lead admin data forwarded successfully' });

  } catch (error) {
    console.error('Unexpected error in forwarding:', error);
    res.status(500).json({ error: 'Unexpected error occurred', details: error.message });
  }
});


module.exports = router;
