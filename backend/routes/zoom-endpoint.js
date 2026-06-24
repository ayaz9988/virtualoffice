import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { generateSignature } from "../services/zoom.js";

const router = Router();

router.get('/signature', authMiddleware, async (req, res) => {
    const meetingNumber = Number(req.query.meetingNumber);
    const role = Number(req.query.role);

    if (!Number.isInteger(meetingNumber) || !Number.isInteger(role)) {
    return res.status(400).json({ error: 'meetingNumber and role must be integers' });
    }

    // role must be 0 or 1
    if (![0, 1].includes(role)) {
    return res.status(400).json({ error: 'role must be 0 (attendee) or 1 (host)' });
    }
    
    const signature = generateSignature(meetingNumber, role);


    res.status(200).json({
        signature,
    });
});

export default router;