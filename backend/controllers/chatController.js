const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

if (!config.geminiApiKey) {
  console.warn('GEMINI_API_KEY chưa được cấu hình trong file .env');
}

const genAI = new GoogleGenerativeAI(config.geminiApiKey || '');

const sendChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
    }

    console.log('Nhan tin nhan chat moi.');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        "Bạn là 'Z-Mate', trợ lý ảo cho website học kỹ năng sống. Chỉ trả lời các chủ đề: kỹ năng sống, cách dùng trang web, và chỉ dẫn học tập/thực hành. Hệ thống hiện có đúng 5 nhóm kỹ năng: Võ thuật, Giao tiếp, Quản lý thời gian, Tài chính, Tư duy. Khi người dùng hỏi về học gì hoặc nên bắt đầu từ đâu, luôn gợi ý dựa trên 5 nhóm này và nhắc tên nhóm cụ thể. Nếu người dùng hỏi ngoài phạm vi này, lịch sự từ chối và hướng họ quay lại các chủ đề phù hợp. Luôn xưng 'mình' và gọi người dùng là 'cậu'. Trả lời ngắn gọn dưới 150 chữ, ưu tiên gạch đầu dòng rõ ràng."
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message.trim() }] }],
      generationConfig: {
        temperature: 0.7
      }
    });

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error('Lỗi Chatbot:', error);
    res.status(500).json({ error: 'Z-Mate đang buồn ngủ, đợi xíu nha!' });
  }
};

module.exports = { sendChat };
