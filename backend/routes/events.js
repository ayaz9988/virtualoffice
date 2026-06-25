import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { addClient } from "../services/sse.js";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: req.user.id })}\n\n`);

    const heartbeat = setInterval(() => {
        res.write(':heartbeat\n\n');
    }, 30000);

    addClient(req.user.id, res);

    res.on('close', () => clearInterval(heartbeat));
}); 

export default router;