const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      nextParticipantNumber: 1,
      activeDay: null,
      days: [],
      participants: []
    };
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Güven Deneyi sunucusu çalışıyor."
  });
});

app.get("/api/participant-number", (req, res) => {
  const data = loadData();
  const number = data.nextParticipantNumber++;

  saveData(data);

  res.json({ participantNumber: number });
});

app.post("/api/results", (req, res) => {
  const data = loadData();

  const participant = {
    ...req.body,
    receivedAt: new Date().toISOString()
  };

  data.participants.push(participant);
  saveData(data);

  res.json({ success: true });
});

app.get("/api/results", (req, res) => {
  const data = loadData();
  res.json(data.participants);
});

app.get("/api/status", (req, res) => {
  const data = loadData();

  res.json({
    activeDay: data.activeDay,
    participantCount: data.participants.length
  });
});

app.listen(PORT, () => {
  console.log(`✅ AI Güven Deneyi sunucusu: http://localhost:${PORT}`);
});
