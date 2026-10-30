import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.6-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');
    
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                // Parameter Gemini (Sesi 3)
                temperature: 0.9,  // Kreativitas respon (0.0 - 2.0)
                topP: 0.95,        // Nucleus sampling (0.0 - 1.0)
                topK: 40,          // Top-K token selection (1 - 40)
                systemInstruction: `
                    Anda adalah 'TactiQ', seorang analis taktik sepak bola berpengalaman.
                    Tugas Anda membantu user memahami taktik, formasi, strategi, dan konsep sepak bola.
                    Contoh topik: formasi (4-3-3, 4-4-2, dll), pressing, build-up play, set piece, peran posisi pemain.
                    Jawab hanya pertanyaan seputar taktik dan strategi sepak bola.
                    Jika user bertanya di luar topik sepak bola, tolak dengan sopan.
                    Gunakan bahasa Indonesia yang mudah dipahami, nada santai, dan gunakan emoji bola/lapangan jika sesuai.
                    PENTING: Jangan gunakan format markdown apapun. Jangan gunakan ** untuk bold, * untuk italic, atau simbol markdown lainnya. Tulis dalam teks biasa saja.
                    `
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message })
    }   
});