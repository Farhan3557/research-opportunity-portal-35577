require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend from the same server
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'research_portal',
  dateStrings: true // return DATE as 'YYYY-MM-DD' text
});

// Map DB row to API object
function toApi(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    researchArea: r.research_area,
    facultyName: r.faculty_name,
    department: r.department,
    requiredSkills: r.required_skills,
    positions: r.positions,
    deadline: r.deadline,
    status: r.status
  };
}

// Returns an error message, or null if the data is valid
function validate(b) {
  const textFields = ['title', 'description', 'researchArea', 'facultyName', 'department', 'requiredSkills'];
  for (const f of textFields) {
    if (!b[f] || String(b[f]).trim() === '') return f + ' is required';
  }
  const pos = Number(b.positions);
  if (b.positions === undefined || b.positions === '' || !Number.isInteger(pos) || pos < 1) {
    return 'positions must be a whole number of at least 1';
  }
  if (!b.deadline || isNaN(Date.parse(b.deadline))) return 'deadline must be a valid date (YYYY-MM-DD)';
  if (b.status && b.status !== 'Open' && b.status !== 'Closed') return "status must be 'Open' or 'Closed'";
  return null;
}

function isBadId(id) {
  return !/^\d+$/.test(id);
}

// 1. Create
app.post('/api/opportunities', async (req, res) => {
  try {
    const b = req.body;
    const error = validate(b);
    if (error) return res.status(400).json({ error });

    const [result] = await db.query(
      `INSERT INTO opportunities
       (title, description, research_area, faculty_name, department, required_skills, positions, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.title.trim(), b.description.trim(), b.researchArea.trim(), b.facultyName.trim(),
       b.department.trim(), b.requiredSkills.trim(), Number(b.positions), b.deadline, b.status || 'Open']
    );
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [result.insertId]);
    res.status(201).json(toApi(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get all
app.get('/api/opportunities', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows.map(toApi));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get one
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    if (isBadId(req.params.id)) return res.status(400).json({ error: 'id must be a number' });
    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    res.status(200).json(toApi(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Update
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    if (isBadId(req.params.id)) return res.status(400).json({ error: 'id must be a number' });

    const [rows] = await db.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });

    // Merge sent fields over the existing record, so partial updates work
    const merged = { ...toApi(rows[0]), ...req.body };
    const error = validate(merged);
    if (error) return res.status(400).json({ error });

    await db.query(
      `UPDATE opportunities SET title=?, description=?, research_area=?, faculty_name=?,
       department=?, required_skills=?, positions=?, deadline=?, status=? WHERE id=?`,
      [String(merged.title).trim(), String(merged.description).trim(), String(merged.researchArea).trim(),
       String(merged.facultyName).trim(), String(merged.department).trim(), String(merged.requiredSkills).trim(),
       Number(merged.positions), merged.deadline, merged.status, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    res.status(200).json(toApi(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Delete
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    if (isBadId(req.params.id)) return res.status(400).json({ error: 'id must be a number' });
    const [result] = await db.query('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Opportunity not found' });
    res.status(200).json({ message: 'Opportunity deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invalid JSON body -> 400
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
