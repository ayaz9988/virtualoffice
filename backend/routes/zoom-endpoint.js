import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { generateSignature, getZakToken } from "../services/zoom.js";
import { validateZoomSignature } from "../middleware/validate.js";

const router = Router();

router.get('/signature', authMiddleware, validateZoomSignature, async (req, res) => {
    const meetingNumber = Number(req.query.meetingNumber);
    const role = Number(req.query.role);

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