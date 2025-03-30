require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
app.set('trust proxy', 1); // trust first proxy
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add this line after your other middleware
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// File paths - use /tmp for Vercel
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : path.join(__dirname, 'data');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const THEME_FILE = path.join(DATA_DIR, 'theme.json');

// Add this near the top of your file with other imports
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  // On Linux/Unix systems, set permissions
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(UPLOADS_DIR, 0o755);
    } catch (err) {
      console.warn('Could not set permissions on uploads directory:', err);
    }
  }
}

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initializeFile = (filePath, defaultContent) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
};

// Initialize default files
initializeFile(LINKS_FILE, []);
initializeFile(AUTH_FILE, {
  username: 'admin',
  password: bcrypt.hashSync('admin123', 10)
});
initializeFile(PROFILE_FILE, {
  name: "Your Name",
  description: "A brief description about yourself",
  bio: "A longer bio that tells more about you",
  email: "your.email@example.com",
  socialLinks: {
    twitter: "https://twitter.com/yourusername",
    instagram: "https://instagram.com/yourusername",
    linkedin: "https://linkedin.com/in/yourusername"
  }
});
initializeFile(THEME_FILE, {
  theme: 'light',
  primaryColor: '#0d6efd',
  backgroundColor: '#f8f9fa',
  textColor: '#212529',
  cardBackground: '#ffffff',
  cardShadow: 4
});

// Helper functions
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const auth = readJsonFile(AUTH_FILE);

    if (!auth || username !== auth.username || !(await bcrypt.compare(password, auth.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.put('/api/auth/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const auth = readJsonFile(AUTH_FILE);

    if (!(await bcrypt.compare(currentPassword, auth.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    auth.password = await bcrypt.hash(newPassword, 10);
    writeJsonFile(AUTH_FILE, auth);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Links routes
app.get('/api/links', (req, res) => {
  try {
    const links = readJsonFile(LINKS_FILE);
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching links' });
  }
});

app.post('/api/links', (req, res) => {
  try {
    const { title, url, icon } = req.body;
    const links = readJsonFile(LINKS_FILE);

    const newLink = {
      id: Date.now().toString(),
      title,
      url,
      icon,
      createdAt: new Date().toISOString()
    };

    links.push(newLink);
    writeJsonFile(LINKS_FILE, links);

    res.status(201).json(newLink);
  } catch (error) {
    res.status(500).json({ message: 'Error creating link' });
  }
});

app.put('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, icon } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }
    
    const links = readJsonFile(LINKS_FILE);
    
    const linkIndex = links.findIndex(l => l.id === id);
    if (linkIndex === -1) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Preserve other properties of the link
    const updatedLink = {
      ...links[linkIndex],
      title,
      url,
      icon,
      updatedAt: new Date().toISOString()
    };
    
    links[linkIndex] = updatedLink;
    writeJsonFile(LINKS_FILE, links);
    
    res.json(updatedLink);
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({ message: 'Error updating link' });
  }
});

app.delete('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const links = readJsonFile(LINKS_FILE);
    
    const filteredLinks = links.filter(l => l.id !== id);
    if (filteredLinks.length === links.length) {
      return res.status(404).json({ message: 'Link not found' });
    }

    writeJsonFile(LINKS_FILE, filteredLinks);
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting link' });
  }
});

// Profile routes
app.get('/api/profile', (req, res) => {
  try {
    const profile = readJsonFile(PROFILE_FILE);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const profile = req.body;
    writeJsonFile(PROFILE_FILE, profile);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Theme routes
app.get('/api/theme', (req, res) => {
    try {
        if (!fs.existsSync(THEME_FILE)) {
            const defaultTheme = {
                theme: 'light',
                primaryColor: '#0d6efd',
                backgroundColor: '#f8f9fa',
                textColor: '#212529',
                cardBackground: '#ffffff',
                cardShadow: 4
            };
            fs.writeFileSync(THEME_FILE, JSON.stringify(defaultTheme, null, 2));
            return res.json(defaultTheme);
        }
        const theme = JSON.parse(fs.readFileSync(THEME_FILE, 'utf8'));
        res.json(theme);
    } catch (error) {
        console.error('Error reading theme:', error);
        res.status(500).json({ error: 'Error reading theme settings' });
    }
});

app.put('/api/theme', (req, res) => {
    try {
        const theme = req.body;
        // Validate theme object
        if (!theme || typeof theme !== 'object') {
            return res.status(400).json({ error: 'Invalid theme data' });
        }
        // Ensure all required properties are present
        const requiredProps = ['theme', 'primaryColor', 'backgroundColor', 'textColor', 'cardBackground', 'cardShadow'];
        for (const prop of requiredProps) {
            if (!(prop in theme)) {
                return res.status(400).json({ error: `Missing required property: ${prop}` });
            }
        }
        // Save theme to file
        fs.writeFileSync(THEME_FILE, JSON.stringify(theme, null, 2));
        res.json({ message: 'Theme updated successfully' });
    } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ error: 'Error updating theme settings' });
    }
});

// Add this to your server.js file to register the profile routes
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

// Serve index.html for all other routes
app.get('*', (req, res) => {
  if (req.path === '/admin') {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Add this function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Update the server start code at the bottom of your file
const startServer = async () => {
  try {
    // Try to use the preferred port, but find an available one if it's in use
    const availablePort = await findAvailablePort(PORT);
    
    app.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
      console.log(`Open http://localhost:${availablePort} in your browser`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export the Express app for Vercel
module.exports = app; 