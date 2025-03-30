const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const storage = require('../utils/storage');
const jwt = require('jsonwebtoken');

// Auth middleware
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all links
router.get('/', async (req, res) => {
    try {
        const links = await storage.getLinks();
        const activeLinks = links.filter(link => link.isActive).sort((a, b) => a.order - b.order);
        res.json(activeLinks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new link (protected)
router.post('/', auth, [
    body('title').trim().notEmpty(),
    body('url').trim().isURL(),
    body('order').optional().isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const link = await storage.createLink(req.body);
        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update link (protected)
router.put('/:id', auth, [
    body('title').optional().trim().notEmpty(),
    body('url').optional().trim().isURL(),
    body('order').optional().isNumeric(),
    body('isActive').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const link = await storage.updateLink(req.params.id, req.body);
        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }

        res.json(link);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete link (protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        const link = await storage.deleteLink(req.params.id);
        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }
        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reorder links (protected)
router.post('/reorder', auth, [
    body('links').isArray()
], async (req, res) => {
    try {
        const { links } = req.body;
        const orderedIds = links.map(link => link.id);
        const updatedLinks = await storage.reorderLinks(orderedIds);
        res.json(updatedLinks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 