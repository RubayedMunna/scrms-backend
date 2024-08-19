const express = require('express');
const { uploadRoomAsXML } = require('../controllers/roomController');
const { getRoomsByDepartmentId, deleteRoom, addNewRoom } = require('../controllers/roomController')
const { getRoomById, getRoomTypes, updateRoom } = require('../controllers/roomController')

const router = express.Router();

router.post('/upload-room', uploadRoomAsXML);

router.get('/department-room/:dept_id', async (req, res) => {
    const dept_id = req.params.dept_id;

    try {
        const rooms = await getRoomsByDepartmentId(dept_id);

        if (rooms.length > 0) {
            res.json(rooms);
        } else {
            res.status(404).json({ message: 'No rooms found for the given department' });
        }
    } catch (error) {
        console.error('Failed to retrieve rooms:', error);
        res.status(500).json({ error: 'Failed to retrieve rooms' });
    }
});

// Route to get room types
router.get('/room-types', async (req, res) => {
    try {
        const roomTypes = await getRoomTypes();
        res.json(roomTypes);
    } catch (error) {
        console.error('Error fetching room types:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to get room data
router.get('/department-room-by-roomid/:room_id', async (req, res) => {
    // console.log("hellO");
    const { room_id } = req.params;
    // console.log(room_id);
    try {
        const roomData = await getRoomById(room_id);
        // console.log(roomData);
        if (roomData) {
            res.json(roomData);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        console.error('Error fetching room data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to update room data
router.put('/department-room/:room_id', async (req, res) => {
    const { room_id } = req.params;
    const updatedData = req.body;

    try {
        await updateRoom(room_id, updatedData);
        res.status(200).json({ message: 'Room updated successfully' });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to delete room
router.delete('/delete-department-room/:room_id', deleteRoom);


// Route to add a new room
router.post('/add-department-room/:dept_id', async (req, res) => {
    const { Room_no, Room_type, Capacity } = req.body;
    const { dept_id } = req.params;

    

    try {
        const result = await addNewRoom(Room_no, Room_type, Capacity, dept_id);
        // console.log("Insert result:", result);
        res.status(201).json({ message: 'Room added successfully' });
    } catch (err) {
        console.error('Error inserting room:', err);
        res.status(500).json({ error: 'Failed to add room' });
    }
});





module.exports = router;