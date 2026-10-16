const express = require('express');
const multer = require('multer');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const REPOS_DIR = path.join(__dirname, 'repos');
if (!fs.existsSync(REPOS_DIR)) {
    fs.mkdirSync(REPOS_DIR, { recursive: true });
}

// ফাইল আপলোডের কনফিগারেশন
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const repo = req.body.repoName || 'default';
            const dir = path.join(REPOS_DIR, repo);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => cb(null, file.originalname)
    })
});

// হোম পেজ (সহজ ওয়েব ইন্টারফেস)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Mini GitHub Bot</title></head>
        <body style="font-family: Arial; padding: 30px;">
            <h2>Mini GitHub & File Manager on Render</h2>
            <h3>1. Create Repository</h3>
            <form action="/create" method="POST">
                <input type="text" name="repoName" placeholder="Repo Name" required />
                <button type="submit">Create</button>
            </form>
            <hr/>
            <h3>2. Upload Files</h3>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <input type="text" name="repoName" placeholder="Repo Name" required /><br/><br/>
                <input type="file" name="files" multiple required /><br/><br/>
                <button type="submit">Upload & Commit</button>
            </form>
        </body>
        </html>
    `);
});

// নতুন রিপোজিটরি তৈরি ও গিট ইনিট করা
app.post('/create', async (req, res) => {
    const { repoName } = req.body;
    const repoPath = path.join(REPOS_DIR, repoName);
    try {
        if (!fs.existsSync(repoPath)) fs.mkdirSync(repoPath, { recursive: true });
        await simpleGit(repoPath).init();
        res.send(`Repository '${repoName}' created successfully! <a href="/">Go Back</a>`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ফাইল আপলোড ও গিট কমিট করা
app.post('/upload', upload.array('files'), async (req, res) => {
    const { repoName } = req.body;
    const repoPath = path.join(REPOS_DIR, repoName);
    try {
        const git = simpleGit(repoPath);
        await git.add('./*');
        await git.commit('Uploaded via Mini GitHub Bot');
        res.send(`Files uploaded and committed in '${repoName}'! <a href="/">Go Back</a>`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
