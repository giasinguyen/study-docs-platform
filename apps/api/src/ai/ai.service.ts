import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  source: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardResult {
  flashcards: Flashcard[];
  source: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  sources?: string[];
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured – AI features disabled');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        // gemini-2.0-flash: free tier 15 RPM, 1500 RPD
        model: 'gemini-2.0-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });
      this.logger.log('Gemini AI initialized successfully with gemini-2.0-flash');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI:', error);
    }
  }

  // ── Extract text from file ──────────────────────────────

  async extractText(file: Express.Multer.File): Promise<string> {
    const mime = file.mimetype?.toLowerCase() ?? '';

    if (mime.includes('pdf')) {
      return this.extractPdfText(file.buffer);
    }

    if (
      mime.includes('text') ||
      mime.includes('markdown') ||
      mime.includes('plain')
    ) {
      return file.buffer.toString('utf-8');
    }

    // For other types, try as text
    try {
      return file.buffer.toString('utf-8');
    } catch {
      throw new Error(
        `Unsupported file type: ${file.mimetype}. Supported: PDF, TXT, MD`,
      );
    }
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // ── Summarize ────────────────────────────────────────────

  async summarize(
    file: Express.Multer.File,
    length: 'short' | 'medium' | 'detailed' = 'medium',
  ): Promise<SummaryResult> {
    if (!this.model) throw new Error('AI service not configured');

    const text = await this.extractText(file);
    const truncatedText = text.slice(0, 30000); // Limit to ~30k chars

    const lengthInstruction = {
      short: 'Tóm tắt NGẮN GỌN trong 3-5 câu.',
      medium: 'Tóm tắt TRUNG BÌNH trong 1-2 đoạn văn.',
      detailed:
        'Tóm tắt CHI TIẾT, bao gồm tất cả điểm chính và phụ.',
    }[length];

    const prompt = `Bạn là trợ lý học tập chuyên nghiệp. Hãy tóm tắt nội dung tài liệu sau bằng tiếng Việt.

${lengthInstruction}

Sau phần tóm tắt, liệt kê 3-7 ĐIỂM CHÍNH (key points) dưới dạng bullet points.

Trả lời theo đúng format JSON sau (không có markdown code block):
{
  "summary": "Nội dung tóm tắt...",
  "keyPoints": ["Điểm 1", "Điểm 2", "Điểm 3"]
}

Nội dung tài liệu:
---
${truncatedText}
---`;

    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary: parsed.summary || responseText,
        keyPoints: parsed.keyPoints || [],
        source: file.originalname,
      };
    } catch {
      return {
        summary: responseText,
        keyPoints: [],
        source: file.originalname,
      };
    }
  }

  // ── Flashcards ───────────────────────────────────────────

  async generateFlashcards(
    file: Express.Multer.File,
    count: number = 10,
  ): Promise<FlashcardResult> {
    if (!this.model) throw new Error('AI service not configured');

    const text = await this.extractText(file);
    const truncatedText = text.slice(0, 30000);

    const prompt = `Bạn là trợ lý học tập chuyên nghiệp. Hãy tạo ${count} flashcard từ nội dung tài liệu sau.

Mỗi flashcard gồm:
- front: Câu hỏi hoặc khái niệm (ngắn gọn, rõ ràng)
- back: Câu trả lời hoặc giải thích (ngắn gọn nhưng đầy đủ)

Trả lời theo đúng format JSON sau (không có markdown code block):
{
  "flashcards": [
    {"front": "Câu hỏi 1?", "back": "Trả lời 1"},
    {"front": "Câu hỏi 2?", "back": "Trả lời 2"}
  ]
}

Nội dung tài liệu:
---
${truncatedText}
---`;

    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        flashcards: parsed.flashcards || [],
        source: file.originalname,
      };
    } catch {
      return { flashcards: [], source: file.originalname };
    }
  }

  // ── Chat with document ──────────────────────────────────

  async chatWithDocument(
    documentText: string,
    message: string,
    history: ChatMessage[] = [],
  ): Promise<ChatResult> {
    if (!this.model) throw new Error('AI service not configured');

    const truncatedText = documentText.slice(0, 25000);

    const historyContext = history
      .slice(-6) // Last 6 messages
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `Bạn là trợ lý học tập AI. Hãy trả lời câu hỏi dựa trên nội dung tài liệu được cung cấp.

Quy tắc:
1. Chỉ trả lời dựa trên nội dung tài liệu
2. Nếu không tìm thấy câu trả lời trong tài liệu, hãy nói rõ
3. Trích dẫn phần liên quan từ tài liệu khi có thể
4. Trả lời bằng tiếng Việt

Nội dung tài liệu:
---
${truncatedText}
---

${historyContext ? `Lịch sử hội thoại:\n${historyContext}\n\n` : ''}Câu hỏi: ${message}`;

    const result = await this.model.generateContent(prompt);
    return {
      reply: result.response.text(),
    };
  }

  // ── Chat with file (upload + question) ──────────────────

  async chatWithFile(
    file: Express.Multer.File,
    message: string,
    history: ChatMessage[] = [],
  ): Promise<ChatResult> {
    const text = await this.extractText(file);
    return this.chatWithDocument(text, message, history);
  }
}
