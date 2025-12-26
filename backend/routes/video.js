const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');
const { 
  uploadVideo, 
  getAllVideos, 
  streamVideo,
  deleteVideo // ✅ Added this import
} = require('../controllers/videoController');

// 1. Upload Route (Protected)
router.post('/upload', protect, upload.single('video'), uploadVideo);

// 2. Get All Videos (Protected)
router.get('/', protect, getAllVideos);

// 3. Stream Video (Temporarily Public for Browser Testing)
router.get('/:id/stream', streamVideo);

// 4. Delete Video (Protected)
router.delete('/:id', protect, deleteVideo); // ✅ Added this route

module.exports = router;