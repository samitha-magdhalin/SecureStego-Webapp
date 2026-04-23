import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Jimp } from 'jimp';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.resolve();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'stego-secret-key-123';
const DATABASE_URL = process.env.DATABASE_URL;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

console.log('📂 Current working directory:', process.cwd());
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('📄 .env file detected at:', envPath);
} else {
  console.warn('❌ .env file NOT detected at:', envPath);
  console.warn('👉 Please ensure your .env file is in the root directory of the project.');
}

if (DATABASE_URL) {
  console.log('✅ DATABASE_URL found in environment.');
} else {
  console.warn('⚠️ DATABASE_URL not found in environment variables.');
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- Database Setup ---
interface DatabaseInterface {
  run(sql: string, params?: any[]): Promise<any>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  close?(): Promise<void>;
}

let db: DatabaseInterface;

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL (Supabase Connection String) is missing in environment variables.');
  }

  let finalConnectionString = connectionString;

  // --- Smart URL Fixer ---
  // If the password contains '@', it can break the standard URL parser.
  // We detect if there are multiple '@' symbols and try to encode the password part.
  try {
    const atMatches = finalConnectionString.match(/@/g);
    if (atMatches && atMatches.length > 1 && !finalConnectionString.includes('%40')) {
      const lastAt = finalConnectionString.lastIndexOf('@');
      const firstPart = finalConnectionString.substring(0, lastAt); // postgres:Sanjana@1512
      const lastPart = finalConnectionString.substring(lastAt);    // @db...
      
      const protocolEnd = firstPart.indexOf('://') + 3;
      const protocol = firstPart.substring(0, protocolEnd);
      const credentials = firstPart.substring(protocolEnd);
      
      const colonIndex = credentials.indexOf(':');
      if (colonIndex !== -1) {
        const user = credentials.substring(0, colonIndex);
        const pass = credentials.substring(colonIndex + 1);
        finalConnectionString = `${protocol}${user}:${encodeURIComponent(pass)}${lastPart}`;
        console.log('⚠️ Auto-encoded special characters in DATABASE_URL password for compatibility.');
      }
    }
  } catch (e) {
    console.error('Failed to pre-parse DATABASE_URL:', e);
  }

  console.log('Connecting to Supabase...');
  
  const pool = new pg.Pool({
    connectionString: finalConnectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    max: 10
  });
  
  try {
    // Attempt a simple query to verify connection
    await pool.query('SELECT 1');
    console.log('✅ Successfully connected to Supabase');
    
    db = {
      run: (sql, params = []) => {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        return pool.query(pgSql, params);
      },
      get: async (sql, params = []) => {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await pool.query(pgSql, params);
        return res.rows[0];
      },
      all: async (sql, params = []) => {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await pool.query(pgSql, params);
        return res.rows;
      },
      close: () => pool.end()
    };
  } catch (err: any) {
    console.error('❌ Database Connection Error:', err.message);
    
    if (err.message.includes('password authentication failed')) {
      console.error('👉 HINT: Your database password in DATABASE_URL is incorrect.');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      console.error('👉 HINT: Connection refused. Try using the Supabase "Transaction Pooler" URL (Port 6543) instead of the direct one.');
    }
    
    // Don't exit immediately, give the user a chance to see the error in logs
    // But we can't proceed without a DB
    throw err;
  }
}

// Initialize Tables
async function initDb() {
  await setupDatabase();

  // Supabase/PostgreSQL uses SERIAL for auto-incrementing IDs
  const idType = 'SERIAL PRIMARY KEY';

  await db.run(`CREATE TABLE IF NOT EXISTS users (
    id ${idType},
    username VARCHAR(255) UNIQUE,
    password TEXT,
    public_key TEXT,
    private_key_encrypted TEXT
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS blockchain (
    id ${idType},
    block_index INTEGER,
    timestamp TEXT,
    data TEXT,
    previous_hash TEXT,
    hash TEXT
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id ${idType},
    user_id INTEGER,
    type TEXT,
    message TEXT,
    timestamp TEXT,
    severity TEXT
  )`);
}

// initDb().catch(console.error); // Removed top-level call

// --- Blockchain Logic ---
class Block {
  index: number;
  timestamp: string;
  data: any;
  previousHash: string;
  hash: string;

  constructor(index: number, timestamp: string, data: any, previousHash: string = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data))
      .digest('hex');
  }
}

async function addBlock(data: any) {
  if (!db) {
    console.error('Cannot add block: Database not initialized');
    return null;
  }
  const lastBlock: any = await db.get('SELECT * FROM blockchain ORDER BY block_index DESC LIMIT 1');
  const index = lastBlock ? lastBlock.block_index + 1 : 0;
  const previousHash = lastBlock ? lastBlock.hash : '0';
  const timestamp = new Date().toISOString();
  const newBlock = new Block(index, timestamp, data, previousHash);

  await db.run(
    'INSERT INTO blockchain (block_index, timestamp, data, previous_hash, hash) VALUES (?, ?, ?, ?, ?)',
    [newBlock.index, newBlock.timestamp, JSON.stringify(newBlock.data), newBlock.previousHash, newBlock.hash]
  );
  return newBlock;
}

// --- AI Monitoring Logic ---
const accessLogs: Record<string, { count: number; lastAccess: number }> = {};
const failedDecrypts: Record<number, { count: number; lastAttempt: number }> = {};
const targetUserDiversity: Record<number, Set<number>> = {};

async function createAlert(userId: number, type: string, message: string, severity: 'low' | 'medium' | 'high') {
  if (!db) {
    console.error('Cannot create alert: Database not initialized');
    return;
  }
  await db.run(
    'INSERT INTO alerts (user_id, type, message, timestamp, severity) VALUES (?, ?, ?, ?, ?)',
    [userId, type, message, new Date().toISOString(), severity]
  );
}

function monitorAccess(userId: number, action: string, metadata?: any) {
  const now = Date.now();
  const key = `${userId}:${action}`;
  
  // 1. Frequency Monitoring
  if (!accessLogs[key]) {
    accessLogs[key] = { count: 0, lastAccess: now };
  }
  const log = accessLogs[key];
  log.count++;

  const windowSize = 60000; // 1 minute
  if (now - log.lastAccess < windowSize) {
    if (action === 'DOWNLOAD' && log.count > 5) {
      createAlert(userId, 'SUSPICIOUS_DOWNLOAD_VOLUME', `User downloaded ${log.count} files in 1 minute.`, 'medium');
    } else if (log.count > 15) {
      createAlert(userId, 'BRUTE_FORCE_RISK', `High frequency of ${action} detected (${log.count} in 1min).`, 'high');
    }
  } else {
    log.count = 1;
    log.lastAccess = now;
  }

  // 2. Failed Decryption Monitoring
  if (action === 'FAILED_DECRYPTION') {
    if (!failedDecrypts[userId]) {
      failedDecrypts[userId] = { count: 0, lastAttempt: now };
    }
    const fLog = failedDecrypts[userId];
    fLog.count++;
    if (now - fLog.lastAttempt < 300000) { // 5 minutes
      if (fLog.count >= 3) {
        createAlert(userId, 'DECRYPTION_ATTACK', 'Multiple failed decryption attempts detected in short period.', 'high');
        fLog.count = 0;
      }
    } else {
      fLog.count = 1;
      fLog.lastAttempt = now;
    }
  }

  // 3. Unusual Target Diversity (Social Engineering / Mass Spam detection)
  if (action === 'SEND' && metadata?.receiverId) {
    if (!targetUserDiversity[userId]) {
      targetUserDiversity[userId] = new Set();
    }
    targetUserDiversity[userId].add(metadata.receiverId);
    if (targetUserDiversity[userId].size > 5) {
      createAlert(userId, 'UNUSUAL_BEHAVIOR', 'User is sending messages to a high number of unique recipients.', 'medium');
      targetUserDiversity[userId].clear();
    }
  }
}

async function verifyBlockchainIntegrity() {
  if (!db) return true; // Can't verify if DB is missing, but don't crash
  const blocks: any[] = await db.all('SELECT * FROM blockchain ORDER BY block_index ASC');
  if (!blocks || blocks.length <= 1) return true;

  for (let i = 1; i < blocks.length; i++) {
    const current = blocks[i];
    const previous = blocks[i - 1];

    // Verify previous hash link
    if (current.previous_hash !== previous.hash) {
      await createAlert(0, 'BLOCKCHAIN_CORRUPTION', `Integrity breach detected at block #${current.block_index}. Link broken.`, 'high');
      return false;
    }

    // Re-calculate hash to verify content
    const tempBlock = new Block(current.block_index, current.timestamp, JSON.parse(current.data), current.previous_hash);
    if (tempBlock.hash !== current.hash) {
      await createAlert(0, 'BLOCKCHAIN_CORRUPTION', `Data inconsistency detected in block #${current.block_index}. Hash mismatch.`, 'high');
      return false;
    }
  }
  return true;
}

// --- Steganography Utilities ---
async function hideMessage(imagePath: string, message: string, outputPath: string) {
  const image = await Jimp.read(imagePath);
  const binaryMessage = Buffer.from(message + '\0').toString('binary');
  
  const totalPixels = image.bitmap.width * image.bitmap.height;
  const totalBitsAvailable = totalPixels * 3;
  const messageBitsNeeded = binaryMessage.length * 8;

  if (messageBitsNeeded > totalBitsAvailable) {
    throw new Error(`Image is too small. Needs ${messageBitsNeeded} bits but only has ${totalBitsAvailable}. Use a larger image.`);
  }

  let charIndex = 0;
  let bitOfChar = 0;

  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      const idx = (image.bitmap.width * y + x) * 4;
      for (let c = 0; c < 3; c++) { // R, G, B
        if (charIndex < binaryMessage.length) {
          const charCode = binaryMessage.charCodeAt(charIndex);
          const bit = (charCode >> (7 - bitOfChar)) & 1;
          
          // Modify LSB
          image.bitmap.data[idx + c] = (image.bitmap.data[idx + c] & 0xFE) | bit;

          bitOfChar++;
          if (bitOfChar === 8) {
            bitOfChar = 0;
            charIndex++;
          }
        } else {
          break;
        }
      }
      if (charIndex >= binaryMessage.length) break;
    }
    if (charIndex >= binaryMessage.length) break;
  }
  await image.write(outputPath as any);
}

async function extractMessage(imagePath: string): Promise<string> {
  const image = await Jimp.read(imagePath);
  let binaryMessage = '';
  let currentCharCode = 0;
  let bitCount = 0;
  let extracted = '';

  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < image.bitmap.width; x++) {
      const idx = (image.bitmap.width * y + x) * 4;
      for (let c = 0; c < 3; c++) {
        const bit = image.bitmap.data[idx + c] & 1;
        currentCharCode = (currentCharCode << 1) | bit;
        bitCount++;

        if (bitCount === 8) {
          if (currentCharCode === 0) return extracted;
          extracted += String.fromCharCode(currentCharCode);
          currentCharCode = 0;
          bitCount = 0;
        }
      }
    }
  }
  return extracted;
}

// --- Express App ---
async function startServer() {
  const app = express();
  
  // Initialize Database before starting routes
  try {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized successfully.');
  } catch (err: any) {
    console.error('CRITICAL: Failed to initialize database:', err.message);
    // We still start the server so the user can see the error in the logs or health check
    // but we'll need to guard routes that use 'db'
  }
  
  // Trust proxy is required for express-rate-limit to work correctly behind reverse proxies
  app.set('trust proxy', 1);

  // Database check middleware
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not initialized', 
        message: 'The server is currently unable to connect to the database. Please check the server logs for details.' 
      });
    }
    next();
  });
  
  // --- Production Security & Performance ---
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development/simplicity in this environment
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(express.json({ limit: '20mb' }));
  app.use(cors());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  const upload = multer({ 
    dest: 'uploads/',
    limits: { 
      fileSize: 20 * 1024 * 1024, // 20MB file limit
      fieldSize: 20 * 1024 * 1024 // 20MB field limit for base64 strings
    }
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- Routes ---
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'operational', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate RSA Key Pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Encrypt private key with user password
    const salt = crypto.scryptSync(password, 'stego-static-salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', salt, Buffer.alloc(16, 0));
    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    try {
      await db.run(
        'INSERT INTO users (username, password, public_key, private_key_encrypted) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, publicKey, encryptedPrivateKey]
      );
      res.json({ message: 'User registered successfully' });
    } catch (err: any) {
      console.error('Registration error:', err);
      // Check for unique constraint violation across different DBs
      const isUniqueViolation = 
        err.code === 'SQLITE_CONSTRAINT' || 
        err.code === '23505' || 
        err.code === 'ER_DUP_ENTRY' ||
        (err.message && err.message.toLowerCase().includes('unique'));

      if (isUniqueViolation) {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Registration failed due to a server error' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user: any = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/users', authenticate, async (req, res) => {
    try {
      const users = await db.all('SELECT id, username, public_key FROM users');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/assets/random', authenticate, async (req, res) => {
    try {
      const imageUrls = [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', // Cyber
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c', // Code
        'https://images.unsplash.com/photo-1563986768609-322da13575f3', // HUD
        'https://images.unsplash.com/photo-1510511459019-5dee2c1a7eaa', // Coding
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', // Matrix
      ];
      const imageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)] + '?auto=format&fit=crop&q=80&w=800';
      
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data).toString('base64');
      
      res.json({ base64 });
    } catch (error) {
      console.error('Random Asset Error:', error);
      res.status(500).json({ error: 'Failed to fetch random asset' });
    }
  });

  app.post('/api/stego/send', authenticate, upload.single('image'), async (req: any, res) => {
    const { receiverId, message, aiImageBase64 } = req.body;
    const senderId = req.user.id;
    const file = req.file;

    if (!file && !aiImageBase64) return res.status(400).json({ error: 'No image provided' });

    const receiver: any = await db.get('SELECT public_key, username FROM users WHERE id = ?', [receiverId]);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    try {
        // 1. Encrypt message with receiver's public key
        const encryptedMessage = crypto.publicEncrypt(receiver.public_key, Buffer.from(message)).toString('base64');

        // 2. Hide in image
        let inputPath = '';
        if (file) {
          inputPath = file.path;
        } else {
          // Save base64 to temp file
          const tempFilename = `ai_input_${Date.now()}.png`;
          inputPath = path.join(UPLOADS_DIR, tempFilename);
          fs.writeFileSync(inputPath, Buffer.from(aiImageBase64, 'base64'));
        }

        const outputFilename = `stego_${Date.now()}.png`;
        const outputPath = path.join(__dirname, 'uploads', outputFilename);
        await hideMessage(inputPath, encryptedMessage, outputPath);

        // 3. Blockchain log
        const fileHash = crypto.createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex');
        await addBlock({
          action: 'SEND',
          sender: req.user.username,
          receiver: receiver.username,
          fileHash,
          timestamp: new Date().toISOString()
        });

        monitorAccess(senderId, 'SEND', { receiverId });
        await verifyBlockchainIntegrity();

        res.json({ 
          message: 'Message sent and hidden successfully',
          downloadUrl: `/api/stego/download/${outputFilename}`
        });
      } catch (error: any) {
        console.error('Stego Error:', error);
        let errorMessage = 'Steganography process failed';
        if (error.message.includes('too large')) {
          errorMessage = 'Message is too long for RSA encryption. Please try a shorter message.';
        } else if (error.message.includes('image')) {
          errorMessage = 'Image processing failed. Try a different image format (PNG/JPG).';
        } else {
          errorMessage = `Steganography process failed: ${error.message}`;
        }
        res.status(500).json({ error: errorMessage });
      }
    });

  app.get('/api/stego/download/:filename', authenticate, (req: any, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOADS_DIR, filename);
    const userId = req.user.id;
    
    console.log(`Download request for: ${filename} by user ${userId}`);

    if (fs.existsSync(filePath)) {
      monitorAccess(userId, 'DOWNLOAD');
      addBlock({
        action: 'DOWNLOAD',
        user: req.user.username,
        filename,
        timestamp: new Date().toISOString()
      }).catch(console.error);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('File send error:', err);
          if (!res.headersSent) {
            res.status(500).send('Error downloading file');
          }
        }
      });
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).send('File not found');
    }
  });

  app.post('/api/stego/receive', authenticate, upload.single('image'), async (req: any, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    monitorAccess(userId, 'RECEIVE');

    // 1. Verify Blockchain Integrity First
    const isChainValid = await verifyBlockchainIntegrity();
    if (!isChainValid) {
      return res.status(500).json({ error: 'Blockchain integrity breach detected. Extraction halted for security.' });
    }

    // 2. Verify File Hash against Blockchain
    const fileHash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
    
    try {
      const block: any = await db.get('SELECT * FROM blockchain WHERE data LIKE ?', [`%${fileHash}%`]);
      if (!block) {
        await createAlert(userId, 'UNAUTHORIZED_EXTRACTION', 'Attempted to extract from an image not registered in the blockchain.', 'high');
        return res.status(403).json({ error: 'Image not found in blockchain. Extraction unauthorized.' });
      }

      const user: any = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      // 3. Extract encrypted message
      const encryptedMessage = await extractMessage(file.path);
      
      // 4. Decrypt private key
      const salt = crypto.scryptSync(password, 'stego-static-salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', salt, Buffer.alloc(16, 0));
      let privateKey = decipher.update(user.private_key_encrypted, 'hex', 'utf8');
      privateKey += decipher.final('utf8');

      // 5. Decrypt message
      const decryptedMessage = crypto.privateDecrypt(privateKey, Buffer.from(encryptedMessage, 'base64')).toString();

      // 6. Log extraction attempt
      await addBlock({
        action: 'EXTRACT',
        user: req.user.username,
        fileHash,
        timestamp: new Date().toISOString()
      });

      res.json({ message: decryptedMessage });
    } catch (error) {
      console.error(error);
      monitorAccess(userId, 'FAILED_DECRYPTION');
      res.status(400).json({ error: 'Decryption failed. Check your password or image.' });
    }
  });

  app.get('/api/dashboard', authenticate, async (req: any, res) => {
    const userId = req.user.id;
    const username = req.user.username;

    try {
      const blocks = await db.all('SELECT * FROM blockchain ORDER BY block_index DESC LIMIT 50');
      const alerts = await db.all('SELECT * FROM alerts WHERE user_id = ? ORDER BY id DESC', [userId]);
      
      const userBlocks = blocks.filter((b: any) => {
        const data = JSON.parse(b.data);
        return data.sender === username || data.receiver === username || data.user === username;
      });

      res.json({
        blocks: userBlocks,
        alerts: alerts,
        stats: {
          totalSent: userBlocks.filter((b: any) => JSON.parse(b.data).action === 'SEND').length,
          totalReceived: userBlocks.filter((b: any) => JSON.parse(b.data).action === 'EXTRACT').length,
          alertCount: alerts.length
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    // Fallback to index.html for React Router (Express 5 syntax)
    app.get('*all', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // --- Global Error Handler ---
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(`[SERVER ERROR] ${err.stack}`);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
