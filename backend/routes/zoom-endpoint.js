import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { generateSignature, getZakToken } from "../services/zoom.js";

const router = Router();

router.get('/signature', authMiddleware, async (req, res) => {
    const meetingNumber = Number(req.query.meetingNumber);
    const role = Number(req.query.role);

    if (!Number.isInteger(meetingNumber) || !Number.isInteger(role)) {
    return res.status(400).json({ error: 'meetingNumber and role must be integers' });
    }

    if (![0, 1].includes(role)) {
    return res.status(400).json({ error: 'role must be 0 (attendee) or 1 (host)' });
    }

    const signature = generateSignature(meetingNumber, role);
    if (signature.error) {
        return res.status(500).json({ error: 'Failed to generate Zoom signature', details: signature.error });
    }
    const result = { signature };

    if (role === 1) {
      const zak = await getZakToken();
      if (zak.error) {
        // ZAK token is optional; proceed without it
      } else {
        result.zak = zak;
      }
    }

    res.status(200).json(result);
});

export default router;