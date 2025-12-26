const fs = require('fs');
const Video = require('../models/Video');
const videoProcessor = require('../services/videoProcessor'); // Import the new service

// Upload Video Controller
exports.uploadVideo = async (req, res) => {
  try {
    // 1. Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video uploaded' 
      });
    }

    // 2. Create Database Entry
    const video = await Video.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      userId: req.user.id,
      status: 'processing' // Initial status
    });

    // 3. Trigger Background Processing (Hour 4 Feature)
    const io = req.app.get('io'); // Get Socket.io instance
    videoProcessor.processVideo(video._id, io);

    // 4. Send Response immediately (don't wait for processing)
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading video',
      error: error.message 
    });
  }
};

// Get All Videos (Secured: Only shows YOUR videos)
exports.getAllVideos = async (req, res) => {
  try {
    // 🔍 Filter by userId: req.user.id
    const videos = await Video.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: error.message
    });
  }
};
// Stream Video Controller
exports.streamVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Get file stats
    const videoPath = video.path;
    const stat = await fs.promises.stat(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle Range Request (Streaming)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Send whole file (if no range request)
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Streaming Error:', error);
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};
// Delete Video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found or unauthorized' });
    }

    // 1. Delete file from disk
    try {
      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }
    } catch (err) {
      console.error('File delete error:', err);
    }

    // 2. Delete from Database
    await video.deleteOne();

    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};