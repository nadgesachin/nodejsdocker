const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create upload directories if they don't exist
const videosDir = path.join(__dirname, 'uploads/videos');
const photosDir = path.join(__dirname, 'uploads/photos');

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configure storage for photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/photos');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Create upload instances
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video file!'), false);
    }
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for photos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image file!'), false);
    }
  }
});

// Routes
app.post('/upload/video', uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }
  
  res.json({
    message: 'Video uploaded successfully',
    file: req.file.filename
  });
});

app.post('/upload/photo', uploadPhoto.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo file uploaded' });
  }
  
  res.json({
    message: 'Photo uploaded successfully',
    file: req.file.filename
  });
});

// Routes for listing files
app.get('/files/videos', (req, res) => {
  fs.readdir(videosDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve video files' });
    }
    res.json(files);
  });
});

app.get('/files/photos', (req, res) => {
  fs.readdir(photosDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve photo files' });
    }
    res.json(files);
  });
});

// Routes for downloading files
app.get('/download/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(videosDir, filename);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    return res.download(filePath, filename);
  } else {
    return res.status(404).json({ error: 'Video file not found' });
  }
});

app.get('/download/photo/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(photosDir, filename);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    return res.download(filePath, filename);
  } else {
    return res.status(404).json({ error: 'Photo file not found' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`To make your server public, run: npx ngrok http ${PORT}`);
}); 