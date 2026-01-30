import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js';

import session from 'express-session';
import MongoStore from 'connect-mongo';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import publicRoutes from './routes/public.js'
import userRoutes from './routes/user.js'
import adminRoutes from './routes/admin.js'
import paymentRoutes from './routes/paymentRoute.js'
import pickupRoutes from './routes/pickupRoute.js'
import path from 'path'
import { fileURLToPath } from 'url'



const app = express()
dotenv.config()
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI_DEV;
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000;


app.get('/', (req, res) =>{
    res.send('Welcome to the PSP Project Backend Server')
})

connectDB()

//middleware
// Use Helmet but disable the built-in Content Security Policy so the
// frontend can load vendor scripts (CDN) and run small inline scripts.
// If you prefer stricter security, replace this with a tailored
// contentSecurityPolicy configuration that allows specific hosts and nonces.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use(
    session({
        name: "connect.sid",
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        rolling: false,
        cookie:{
            maxAge: SESSION_MAX_AGE,
            httpOnly: true,
            //secure: true, //Enable it when using https
            sameSite: 'lax'
        },
        store: MONGO_URI?MongoStore.create({
            mongoUrl: MONGO_URI,
            ttl: SESSION_MAX_AGE / 1000,
            autoRemove: "native",
            touchAfter: 60,
        }):undefined
    })
);

// routes
app.use('/api/public', publicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pickups', pickupRoutes);

// Serve frontend static files (so frontend and backend are same-origin and sessions work)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, '../frontend');

app.use(express.static(frontendDir));

// For any unmatched non-API route, serve index.html (static fallback)
// Use a middleware instead of a wildcard route string to avoid path-to-regexp errors
app.use((req, res, next) => {
    // don't interfere with API routes
    if (req.path.startsWith('/api')) return next();
    // serve index.html for frontend routes
    res.sendFile(path.join(frontendDir, 'index.html'));
});




app.listen(
    PORT, () => console.log(`Server running on ${PORT}`)
)
