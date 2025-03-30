const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Use fs.promises for async operations
const fsPromises = fs.promises;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const storage = {
    // User operations
    async getUsers() {
        const usersPath = path.join(DATA_DIR, 'users.json');
        if (fs.existsSync(usersPath)) {
            const data = await fsPromises.readFile(usersPath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    },

    async saveUsers(users) {
        const usersPath = path.join(DATA_DIR, 'users.json');
        await fsPromises.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8');
    },

    async findUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(user => user.email === email);
    },

    async findUserById(id) {
        const users = await this.getUsers();
        return users.find(user => user.id === id);
    },

    async createUser(userData) {
        const users = await this.getUsers();
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        await this.saveUsers(users);
        return newUser;
    },

    async updateUser(id, userData) {
        const users = await this.getUsers();
        const index = users.findIndex(user => user.id === id);
        if (index === -1) return null;

        users[index] = {
            ...users[index],
            ...userData,
            updatedAt: new Date().toISOString()
        };
        await this.saveUsers(users);
        return users[index];
    },

    // Links operations
    async getLinks() {
        const linksPath = path.join(DATA_DIR, 'links.json');
        if (fs.existsSync(linksPath)) {
            const data = await fsPromises.readFile(linksPath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    },

    async saveLinks(links) {
        const linksPath = path.join(DATA_DIR, 'links.json');
        await fsPromises.writeFile(linksPath, JSON.stringify(links, null, 2), 'utf8');
    },

    async createLink(linkData) {
        const links = await this.getLinks();
        const newLink = {
            id: Date.now().toString(),
            ...linkData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        links.push(newLink);
        await this.saveLinks(links);
        return newLink;
    },

    async updateLink(id, linkData) {
        const links = await this.getLinks();
        const index = links.findIndex(link => link.id === id);
        if (index === -1) return null;

        links[index] = {
            ...links[index],
            ...linkData,
            updatedAt: new Date().toISOString()
        };
        await this.saveLinks(links);
        return links[index];
    },

    async deleteLink(id) {
        const links = await this.getLinks();
        const filteredLinks = links.filter(link => link.id !== id);
        await this.saveLinks(filteredLinks);
    },

    async reorderLinks(orderedIds) {
        const links = await this.getLinks();
        const reorderedLinks = orderedIds.map((id, index) => {
            const link = links.find(l => l.id === id);
            return { ...link, order: index };
        });
        await this.saveLinks(reorderedLinks);
        return reorderedLinks;
    },

    // Profile operations
    async getProfile() {
        const profilePath = path.join(DATA_DIR, 'profile.json');
        try {
            if (fs.existsSync(profilePath)) {
                const data = await fsPromises.readFile(profilePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (err) {
            console.error('Error reading profile:', err);
        }
        return {
            name: "Your Name",
            description: "A brief description about yourself",
            bio: "A longer bio that tells more about you",
            email: "your.email@example.com",
            socialLinks: {}
        };
    },

    async saveProfile(profile) {
        const profilePath = path.join(DATA_DIR, 'profile.json');
        try {
            await fsPromises.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf8');
            return profile;
        } catch (err) {
            console.error('Error saving profile:', err);
            throw err;
        }
    }
};

module.exports = storage; 