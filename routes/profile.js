const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Simplified auth middleware that always passes
const auth = async (req, res, next) => {
    // Skip authentication for now
    next();
};

// Configure multer for image upload
const storageMulter = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads');
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a more unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storageMulter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('image');

// Get public profile
router.get('/:username', async (req, res) => {
    try {
        const users = await storage.getUsers();
        const user = users.find(u => u.username === req.params.username);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, email, ...publicProfile } = user;
        res.json(publicProfile);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile
router.put('/', auth, async (req, res) => {
    try {
        console.log('Received profile update:', req.body); // Debug log
        const profile = await storage.getProfile();
        const updatedProfile = { ...profile, ...req.body };
        console.log('Saving profile:', updatedProfile); // Debug log
        await storage.saveProfile(updatedProfile);
        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update the image upload route with better error handling
router.post('/image', auth, (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error('Multer error:', err);
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred
            console.error('Unknown upload error:', err);
            return res.status(500).json({ message: `Unknown error: ${err.message}` });
        }
        
        // Everything went fine
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No image file provided' });
            }

            // Log the file details for debugging
            console.log('File uploaded:', req.file);
            
            // Make sure the path is correct
            const imageUrl = `/uploads/${req.file.filename}`;
            console.log('Image URL:', imageUrl);
            
            // Update profile with new image URL
            let profile;
            try {
                profile = await storage.getProfile();
            } catch (err) {
                console.error('Error getting profile:', err);
                // If profile doesn't exist, create a new one
                profile = {
                    name: "Your Name",
                    bio: "A longer bio that tells more about you",
                    email: "",
                    socialLinks: {}
                };
            }
            
            profile.imageUrl = imageUrl;
            await storage.saveProfile(profile);

            return res.json({ imageUrl });
        } catch (error) {
            console.error('Error saving profile image:', error);
            return res.status(500).json({ message: 'Server error saving profile' });
        }
    });
});

// Get profile (public)
router.get('/', async (req, res) => {
    try {
        const profile = await storage.getProfile();
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 