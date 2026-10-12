const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function d1(sql, params = []) {
  if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
    throw new Error("Cloudflare D1 ortam değişkenleri eksik.");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error("D1 API hatası:", JSON.stringify(result.errors || result));
    throw new Error("D1 sorgusu başarısız.");
  }

  return result.result?.[0];
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Güven Deneyi sunucusu çalışıyor.",
  });
});

app.get("/api/participant-number", async (req, res) => {
  try {
    const result = await d1(
      "SELECT COALESCE(MAX(participant_number), 0) + 1 AS next_number FROM participants"
    );
    res.json({ participantNumber: result.results[0].next_number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Katılımcı numarası alınamadı." });
  }
});

app.post("/api/results", async (req, res) => {
  try {
    const participant = req.body;
    const participantNumber = Number(participant.participantNumber);
    const timeLimit = Number(participant.timeLimit) || null;
    const receivedAt = new Date().toISOString();

    await d1(
      "INSERT INTO participants (participant_number, time_limit, results_json, received_at) VALUES (?, ?, ?, ?)",
      [
        participantNumber,
        timeLimit,
        JSON.stringify(participant.results ?? []),
        receivedAt,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Sonuç kaydedilemedi." });
  }
});

app.get("/api/results", async (req, res) => {
  try {
    const result = await d1(
      "SELECT id, participant_number, time_limit, results_json, received_at FROM participants ORDER BY id DESC"
    );

    const participants = result.results.map((row) => ({
      participantNumber: row.participant_number,
      timeLimit: row.time_limit,
      results: JSON.parse(row.results_json),
      receivedAt: row.received_at,
    }));

    res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Kayıtlar alınamadı." });
  }
});

app.delete("/api/results/:receivedAt", async (req, res) => {
  try {
    const receivedAt = decodeURIComponent(req.params.receivedAt);
    const result = await d1(
      "DELETE FROM participants WHERE received_at = ?",
      [receivedAt]
    );

    if (result.meta.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Kayıt bulunamadı.",
      });
    }

    res.json({ success: true, message: "Kayıt silindi." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Kayıt silinemedi." });
  }
});

app.post("/api/reset-data", async (req, res) => {
  try {
    await d1("DELETE FROM participants");
    res.json({ ok: true, message: "Tüm test kayıtları silindi." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Kayıtlar silinemedi." });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    const result = await d1("SELECT COUNT(*) AS count FROM participants");
    res.json({
      participantCount: result.results[0].count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Durum alınamadı." });
  }
});

app.listen(PORT, () => {
  console.log(`AI Güven Deneyi sunucusu ${PORT} portunda çalışıyor.`);
});
