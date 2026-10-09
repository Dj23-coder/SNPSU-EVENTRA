import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers with 10MB limit for poster image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Shared Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const EVENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Official event title or empty string" },
    type: { type: Type.STRING, description: "Competition, Workshop, Fest, Talk, or Other" },
    description: { type: Type.STRING, description: "Short summary under 200 characters" },
    date: { type: Type.STRING, description: "YYYY-MM-DD or empty string" },
    start_time: { type: Type.STRING, description: "HH:mm 24-hour format or empty string" },
    end_time: { type: Type.STRING, description: "HH:mm 24-hour format or empty string" },
    venue: { type: Type.STRING, description: "Campus hall or venue location or empty string" },
    deadline: { type: Type.STRING, description: "YYYY-MM-DD or empty string" },
    fee: { type: Type.STRING, description: "Free or amount in ₹ or empty string" },
    certificate: { type: Type.STRING, description: "yes, no, or empty string" },
    prize: { type: Type.STRING, description: "Prize amount or empty string" },
    registration_link: { type: Type.STRING, description: "Registration URL starting with https or empty string" },
    contact_name: { type: Type.STRING, description: "Contact coordinator name or empty string" },
    contact: { type: Type.STRING, description: "10-digit Indian phone number or empty string" },
    error: { type: Type.STRING, description: "Error message if input is not an event notice, otherwise empty" },
  },
  required: [
    'title',
    'type',
    'description',
    'date',
    'start_time',
    'end_time',
    'venue',
    'deadline',
    'fee',
    'certificate',
    'prize',
    'registration_link',
    'contact_name',
    'contact',
  ],
};

/* ==========================================================
   AI ROUTE 1: NOTICE READER (Clubs - Parse Messy WhatsApp Text)
   ========================================================== */
app.post('/api/ai/parse-notice', async (req, res) => {
  try {
    const { noticeText } = req.body;
    if (!noticeText || typeof noticeText !== 'string' || !noticeText.trim()) {
      return res.status(400).json({ error: 'Please paste an event notice.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment. Please configure GEMINI_API_KEY in the Secrets panel, or fill the form manually.',
      });
    }

    const prompt = `You are the official event notice parser for Sapthagiri NPS University (SNPSU EVENTRA).
Extract event fields from the following unstructured notice.
STRICT RULES:
1. Return strictly JSON matching the required schema.
2. Use "" (empty string) for anything not stated. NEVER guess dates, deadlines, fees, prizes, or phone numbers.
3. If the text is not an event notice (e.g. conversational chit-chat, unrelated message, homework question), set "error": "Please paste an event notice".
4. Ensure event type is one of: Competition, Workshop, Fest, Talk, Other.

Notice text:
"""
${noticeText}
"""`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a strict data extractor for university event notices. Output valid JSON only. Never invent facts.',
        responseMimeType: 'application/json',
        responseSchema: EVENT_SCHEMA,
        temperature: 0.1,
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/parse-notice:', err);
    return res.status(500).json({
      error: err.message || 'Failed to parse notice with Gemini.',
    });
  }
});

/* ==========================================================
   AI ROUTE 2: POSTER READER (Clubs - Parse Poster Image)
   ========================================================== */
app.post('/api/ai/parse-poster', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No poster image provided.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment. Please configure GEMINI_API_KEY in the Secrets panel, or fill the form manually.',
      });
    }

    // Clean data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `You are the official poster OCR and event analyzer for Sapthagiri NPS University (SNPSU EVENTRA).
Read the text and graphics in this poster image and extract the event information.
STRICT RULES:
1. Return strictly JSON matching the required schema.
2. Use "" (empty string) for anything not stated or illegible. NEVER guess dates, deadlines, fees, prizes, or phone numbers.
3. If the image is not an event poster, set "error": "Please paste an event notice".
4. Ensure event type is one of: Competition, Workshop, Fest, Talk, Other.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          'You are an OCR and event detail extractor for student event posters. Output valid JSON only. Never invent data.',
        responseMimeType: 'application/json',
        responseSchema: EVENT_SCHEMA,
        temperature: 0.1,
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/parse-poster:', err);
    return res.status(500).json({
      error: err.message || 'Failed to read poster image with Gemini.',
    });
  }
});

/* ==========================================================
   AI ROUTE 3: ASK AI (Students - Grounded strictly on stored events)
   ========================================================== */
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, events } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Please enter a question.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment. Please configure GEMINI_API_KEY in the Secrets panel.',
      });
    }

    const eventsList = Array.isArray(events) ? events : [];

    const prompt = `Student asks: "${question.trim()}"

Here is the complete list of verified events currently scheduled at Sapthagiri NPS University:
${JSON.stringify(eventsList, null, 2)}

STRICT RULES:
1. Answer using ONLY the events provided above.
2. If nothing matches the student's request, reply EXACTLY with this phrase and nothing else:
"I couldn't find a matching event."
3. NEVER invent events, dates, prizes, or registration links.
4. If one or more events match, provide a friendly, helpful 2-4 sentence summary of the matching event(s) including dates, venues, fee, and organizing club.
5. Also return a list of matching event IDs in the JSON response under "matchingEventIds".`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are the official SNPSU EVENTRA campus assistant. You answer questions strictly based on the provided list of events. If no event matches, reply exactly: "I couldn\'t find a matching event."',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Helpful answer or "I couldn\'t find a matching event."',
            },
            matchingEventIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'IDs of the events mentioned in the answer',
            },
          },
          required: ['answer', 'matchingEventIds'],
        },
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/ask:', err);
    return res.status(500).json({
      error: err.message || 'Failed to answer student question with Gemini.',
    });
  }
});

/* ==========================================================
   AI ROUTE 4: SHARE TEXT (Clubs - WhatsApp-ready announcement)
   ========================================================== */
app.post('/api/ai/share-text', async (req, res) => {
  try {
    const { event } = req.body;
    if (!event) {
      return res.status(400).json({ error: 'Event data is required.' });
    }

    if (!aiClient) {
      // Deterministic fallback if API key is not present
      const fallback = `📢 *${event.title}* by ${event.clubName} at Sapthagiri NPS University!\n\n📅 Date: ${event.date}\n⏰ Time: ${event.startTime} - ${event.endTime}\n📍 Venue: ${event.venue}\n🎟️ Fee: ${event.entryFee || 'Free'}\n${event.prize ? `🏆 Prize: ${event.prize}\n` : ''}${event.certificateProvided ? `📜 Certificate: Provided\n` : ''}${event.registrationLink ? `🔗 Register here: ${event.registrationLink}\n` : ''}${event.registrationDeadline ? `⏳ Deadline: ${event.registrationDeadline}\n` : ''}\nContact: ${event.contactName} (+91 ${event.contactWhatsApp})\n\n_Sapthagiri NPS University • SNPSU EVENTRA_`;
      return res.json({ announcement: fallback });
    }

    const prompt = `Generate a short, friendly, exciting WhatsApp-ready announcement for this campus event at Sapthagiri NPS University.
Event Data:
${JSON.stringify(event, null, 2)}

STRICT RULES:
1. Use ONLY data present in the event object. Never invent extra prizes, dates, or details.
2. Include title, club name, date, time, venue, prize/certificate (if any), registration link (if any), deadline reminder (if any), and contact info.
3. Use clean WhatsApp formatting (*bold*, _italic_, bullet points, emojis).
4. Keep it concise, engaging, and easy to copy and forward in student WhatsApp groups.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You write short, friendly WhatsApp announcements for university student clubs using only the provided facts.',
        temperature: 0.3,
      },
    });

    return res.json({ announcement: response.text?.trim() });
  } catch (err: any) {
    console.error('Error in /api/ai/share-text:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate announcement.',
    });
  }
});

// Mount Vite in development mode
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => {
    console.log(`SNPSU EVENTRA server running on http://localhost:${PORT}`);
  });
}

startServer();
