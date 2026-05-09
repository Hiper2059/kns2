const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

const genAI = new GoogleGenerativeAI(config.geminiApiKey || '');

const evaluateModeration = async text => {
  if (!config.geminiApiKey) {
    return {
      decision: 'keep',
      reason: 'Chua cau hinh GEMINI_API_KEY.',
      confidence: 0
    };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `Bạn là bộ lọc kiểm duyệt tiếng Việt cho diễn đàn.\n` +
    `Hãy đọc nội dung và trả về JSON duy nhất theo đúng schema sau:\n` +
    `{"decision":"keep|delete","reason":"...","confidence":0-1}.\n` +
    `Quy tắc:\n` +
    `- decision=delete nếu có chửi bậy, công kích thô tục, xúc phạm nặng, kích động thù ghét.\n` +
    `- decision=keep nếu nội dung bình thường hoặc góp ý lịch sự.\n` +
    `- reason ngắn gọn dưới 120 ký tự.\n` +
    `Nội dung cần kiểm duyệt: ${text}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });

  const raw = result.response.text();
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      decision: 'keep',
      reason: 'Khong phan tich duoc ket qua AI.',
      confidence: 0
    };
  }

  const decision = parsed?.decision === 'delete' ? 'delete' : 'keep';
  const reason = typeof parsed?.reason === 'string' ? parsed.reason.slice(0, 120) : '';
  const numericConfidence = Number(parsed?.confidence);
  const confidence = Number.isFinite(numericConfidence)
    ? Math.max(0, Math.min(1, numericConfidence))
    : 0;

  return { decision, reason, confidence };
};

module.exports = { evaluateModeration };
