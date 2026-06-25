import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { generateSignature } from "../services/zoom.js";
import { randomUUID } from "node:crypto";
import db from "../db.js";
import { sendToTeacher, sendToUser } from "../services/sse.js";

const router = Router();

router.patch('/:id/admit', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const existing = db.prepare(`
        SELECT we.id, we.student_id, we.status, we.room_id,
            r.teacher_id, r.zoom_meeting_id, r.zoom_password
        FROM waiting_entries we
        JOIN rooms r ON we.room_id = r.id
        WHERE we.id = ?
    `).get(id);
    if (!existing) return res.status(404).json({ message: 'No body is waiting in this room' });
    if (user.id !== existing.teacher_id) {
        return res.status(403).json({
            message: "This room is not accessible by you",
        });
    }
    if (existing.status !== 'waiting') {
        return res.status(400).json({
            message: "This student already admitted/rejected",
        });
    }

    if (!existing.zoom_meeting_id) {
        return res.status(400).json({
            message: "Room has no active meeting. Open the room first.",
        });
    }

    db.prepare(`
        INSERT INTO room_sessions (id, room_id, student_id, status)
        VALUES (?, ?, ?, 'active');
    `).run(randomUUID(), existing.room_id, existing.student_id);

    db.prepare(`
        UPDATE waiting_entries SET
            status = 'admitted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    `).run(id);

    const signature = generateSignature(existing.zoom_meeting_id, 0)
    const data = {
        signature,
        meeting_number: existing.zoom_meeting_id,
        zoom_password: existing.zoom_password,
        student_id: existing.student_id,
    }

    sendToUser(existing.student_id, 'status-changed', data);
    sendToTeacher(existing.room_id, 'waiting-queue-changed', data);
    res.status(200).json(data);
});

router.patch('/:id/decline', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const existing = db.prepare(`
        SELECT we.id, we.student_id, we.status, we.room_id,
            r.teacher_id, r.zoom_meeting_id, r.zoom_password
        FROM waiting_entries we
        JOIN rooms r ON we.room_id = r.id
        WHERE we.id = ?
    `).get(id);
    if (!existing) return res.status(404).json({ message: 'No body is waiting in this room' });
    if (user.id !== existing.teacher_id) {
        return res.status(403).json({
            message: "This room is not accessible by you",
        });
    }
    if (existing.status !== 'waiting') {
        return res.status(400).json({
            message: "This student already admitted/rejected",
        });
    }

    db.prepare(`
        UPDATE waiting_entries SET
            status = 'declined', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;    
    `).run(id);

    const data = {
        message: `The student got declined successfully`,
    }
    sendToUser(existing.student_id, 'status-changed', data);
    sendToTeacher(existing.room_id, 'waiting-queue-changed', data);
    res.status(200).json(data);
});

router.get('/mine', authMiddleware, async (req, res) => {
    const { room_id } = req.query;
    const user = req.user;

    if (user.role !== 'student') {
        return res.status(401).json({ message: 'Invalid user role' });
    }

    const entry = db.prepare(`
        SELECT we.id, we.status, we.created_at AS waiting_since,
               r.zoom_meeting_id, r.zoom_password, r.zoom_join_url
        FROM waiting_entries we
        JOIN rooms r ON we.room_id = r.id
        WHERE we.student_id = ? AND we.room_id = ?
        ORDER BY we.created_at DESC
        LIMIT 1
    `).get(user.id, room_id);

    if (!entry) return res.status(404).json({ message: 'No waiting entry found' });

    res.json({ entry });
});

export default router;