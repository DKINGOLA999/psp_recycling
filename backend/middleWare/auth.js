import User from '../models/User.js';

export const ensureAuthentication = (req, res, next) => {
    if (req.session && req.session.userId) return next();
    // Helpful debug log: don't print the whole session, just indicate presence
    console.log('ensureAuthentication failed. sessionPresent=', !!req.session, 'userIdPresent=', !!(req.session && req.session.userId));
    return res.status(401).json({ error: "Unauthorized: please log in" });
}

export const ensureRole = (role) => {
    return async function (req, res, next) {
        if (!req.session || !req.session.userId) return res.status(401).json({
            error: "Unauthorized"
        });
        try {
            const user = await User.findById(req.session.userId).select('role');
            if (!user) return res.status(401).json({ error: "Unauthorized" })
            if (user.role !== role) return res.status(403).json({ error: "Forbidden: insufficient role" })

            req.user = user;
            return next();
        } catch (error) {
            return next(error)
        }
    }
}

export const ensureOwnerOrAdmin = async (req, res, next) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: "Unauthorized" })

    try {
        const requester = await User.findById(req.session.userId).select('role')
        if (!requester) return res.status(401).json({ error: "Unauthorized" });

        const targetUserId = req.params.id;
        if (!targetUserId) return res.status(400).json({ error: "Bad request: missing target id" })

        if (requester.role === 'admin' || requester._id.toString() === targetUserId) {
            req.user = requester;
            return next();
        }

        return res.status(403).json({ error: "Forbidden: not owner or admin" })
    } catch (error) {
        return next(error);
    }
}