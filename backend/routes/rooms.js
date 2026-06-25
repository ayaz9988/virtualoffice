import { Router } from "express";
import {authMiddleware} from './../middleware/auth.js';
import db from './../db.js';
import { createMeeting, deleteMeeting } from './../services/zoom.js';
import {randomUUID} from 'node:crypto';
import { sendToTeacher } from "../services/sse.js";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
    const openRooms = db.prepare(`
        SELECT
            id, name, description, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url
        FROM rooms
        WHERE is_open = 1 AND deleted_at IS NULL;
    `).all();

    res.status(200).json({
        rooms: openRooms,
    });
});

router.get('/mine', authMiddleware, async (req, res) => {
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const listOfRooms = db.prepare(`
        SELECT
            id, name, description, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open
        FROM rooms
        WHERE teacher_id = ? AND deleted_at IS NULL;
    `).get(user.id);
    
    res.status(200).json({
        rooms: listOfRooms,
    });
});

router.post('/', authMiddleware, async (req, res) => {
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const existing = db.prepare(`
        SELECT id, deleted_at FROM rooms WHERE teacher_id = ?
    `).get(user.id);

    if (existing && !existing.deleted_at) {
        return res.status(409).json({ message: 'You already have an active room' });
    }

    const zoomMeetingData = await createMeeting(user.name);

    if (existing && existing.deleted_at) {
        db.prepare(`
            UPDATE rooms SET
                name = ?, description = NULL, topic = 'office', deleted_at = NULL,
                zoom_meeting_id = ?, zoom_password = ?, zoom_start_url = ?,
                zoom_join_url = ?, is_open = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(user.name, zoomMeetingData.id, zoomMeetingData.password, zoomMeetingData.start_url, zoomMeetingData.join_url, existing.id);

        const room = db.prepare(`
            SELECT id, name, description, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open
            FROM rooms WHERE id = ?
        `).get(existing.id);

        res.status(200).json({ message: "room reactivated successfully", room });
    } else {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO rooms (id, teacher_id, name, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open)
            VALUES (?, ?, ?, 'office', ?, ?, ?, ?, 1);
        `).run(id, user.id, user.name, zoomMeetingData.id, zoomMeetingData.password, zoomMeetingData.start_url, zoomMeetingData.join_url);

        const room = db.prepare(`
            SELECT id, name, description, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open
            FROM rooms WHERE id = ?
        `).get(id);

        res.status(201).json({ message: "created room successfully", room });
    }
});

router.patch('/:id', authMiddleware, async(req, res) => {
    const { name, description, topic, is_open } = req.body;
    const id = req.params.id;
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND deleted_at IS NULL').get(id);

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if(room.teacher_id !== user.id) {
        return res.status(403).json({
            message: "This room is not accessible by you",
        });
    }

    if (is_open !== undefined && is_open !== room.is_open) {
        if (is_open === 1) {
            const meeting = await createMeeting(user.name, topic || room.topic);
            db.prepare(`UPDATE rooms SET is_open = 1, zoom_meeting_id = ?, zoom_password = ?,
                    zoom_join_url = ?, zoom_start_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                ).run(meeting.id, meeting.password, meeting.join_url, meeting.start_url, id);
        } else {
            try { await deleteMeeting(room.zoom_meeting_id); } catch {}
            db.prepare(`UPDATE rooms SET is_open = 0, zoom_meeting_id = NULL, zoom_password = NULL,
                    zoom_join_url = NULL, zoom_start_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                ).run(id);
        }
    }

    if (name || description || topic) {
        db.prepare(`UPDATE rooms SET name = COALESCE(?, name), description = COALESCE(?, description),
        topic = COALESCE(?, topic), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(name ?? null, description ?? null, topic ?? null, id);
    }

    const updated = db.prepare('SELECT id, name, description, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open FROM rooms WHERE id = ?').get(id);
    res.json({ room: updated });
});

router.delete('/:id', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const room = db.prepare(`
        SELECT id, zoom_meeting_id, teacher_id from rooms WHERE id = ?; 
    `).get(id);

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if(room.teacher_id !== user.id) {
        return res.status(403).json({
            message: "This room is not accessible by you",
        });
    }

    try { await deleteMeeting(room.zoom_meeting_id); } catch {}

    db.prepare(`
       UPDATE rooms SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?; 
    `).run(id);

    db.prepare(`
       UPDATE waiting_entries SET status = 'declined' WHERE room_id = ? AND status = 'waiting';
    `).run(id);

    db.prepare(`
       UPDATE room_sessions SET status = 'ended', left_at = CURRENT_TIMESTAMP WHERE room_id = ? AND status = 'active';
    `).run(id);


    res.status(204).end();
});


router.post('/:id/wait', authMiddleware, async (req, res) => {
    const { note } = req.body;
    const id = req.params.id;
    const user = req.user;
    if(user?.role !== 'student') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }

    const room = db.prepare(`
        SELECT id from rooms WHERE id = ? AND is_open = 1 AND deleted_at IS NULL; 
    `).get(id);

    if (!room) return res.status(404).json({ message: 'Room not found or not open' });
    
    const existing = db.prepare(`
        SELECT id
        FROM waiting_entries
        WHERE student_id = ? AND room_id = ? AND status =  'waiting';    
    `).get(user.id, id);

    if(existing) {
        return res.status(409).json({
            message: `student ${user.name} already waiting on this room`,
        });
    }

    const randID = randomUUID();
    db.prepare(`
        INSERT INTO waiting_entries (id, room_id, student_id, status, note)
        VALUES (?, ?, ?, 'waiting', ?)
    `).run(randID, room.id, user.id, note ?? '')

    const waiting_entry = db.prepare(`
        SELECT id, room_id, student_id, status, note, created_at
        FROM waiting_entries
        WHERE id = ?;
    `).get(randID);

    sendToTeacher(id, 'waiting-queue-changed', waiting_entry);

    res.status(201).json({
        waiting_entry,
    });
});


router.get("/:id/waiting", authMiddleware, async (req, res) => {
    const id = req.params.id;
    const user = req.user;
    if(user?.role !== 'teacher') {
        return res.status(401).json({
            message: 'Invalid user role',
        });
    }
    const room = db.prepare(`
        SELECT id, zoom_meeting_id, teacher_id from rooms WHERE id = ?; 
    `).get(id);

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if(room.teacher_id !== user.id) {
        return res.status(403).json({
            message: "This room is not accessible by you",
        });
    }

    const listOfWaitingStudent = db.prepare(`
       SELECT
            we.id, we.student_id, u.name AS student_name, u.email AS student_email,
            we.note, we.created_at AS waiting_since
        FROM waiting_entries we
        JOIN users u ON we.student_id = u.id
        WHERE room_id = ? AND status = 'waiting'
        ORDER BY we.created_at ASC;
    `).all(id);

    res.status(200).json({ listOfWaitingStudent });
});

export default router;
