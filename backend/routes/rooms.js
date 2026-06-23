import { Router } from "express";
import {authMiddleware} from './../middleware/auth.js';
import db from './../db.js';
import { createMeeting, deleteMeeting } from './../services/zoom.js';
import {randomUUID} from 'node:crypto';

const router = Router();

router.get("/", async (req, res) => {
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

    const zoomMeetingData = await createMeeting(user.name);
    const id = randomUUID();
    const createRoom =  db.prepare(`
        INSERT INTO rooms (id, teacher_id, name, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open)
        VALUES (?, ?, ?, 'office', ?, ?, ?, ?, 1);
    `).run(id,user.id, user.name, zoomMeetingData.id, zoomMeetingData.password, zoomMeetingData.start_url, zoomMeetingData.join_url);
    const createdRoom = db.prepare(`
        SELECT id, name, description, topic, zoom_meeting_id, zoom_password, zoom_start_url, zoom_join_url, is_open
        FROM rooms WHERE id = ?;
    `).get(id);

    res.status(201).json({
        message: "created room successfully",
        room: createdRoom,
    })
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
            await deleteMeeting(room.zoom_meeting_id);
            db.prepare(`UPDATE rooms SET is_open = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
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

    await deleteMeeting(room.zoom_meeting_id);

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

export default router;
