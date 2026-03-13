// ../services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { File } from "expo-file-system"; // ← Chỉ cần import này (không legacy)

const GEMINI_API_KEY = "AIzaSyDNca1bR2tdZAizFUSbRMfFmlM8_72mqTk"; // thay bằng key thật

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const generateDescription = async (
  imageUri: string,
): Promise<string> => {
  try {
    // Cách mới: dùng File class để đọc base64
    const file = new File(imageUri);
    const base64Image = await file.base64(); // Trả về Promise<string> base64 sạch

    console.log("Base64 length:", base64Image.length); // debug size nếu cần

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Bạn là chuyên gia viết mô tả sản phẩm bán hàng trên các nền tảng như Chợ Tốt, Facebook Marketplace tại Việt Nam.
Từ ảnh sản phẩm được cung cấp, hãy viết một mô tả chi tiết, hấp dẫn, tự nhiên bằng tiếng Việt (khoảng 150-400 ký tự), bao gồm:
- Tên sản phẩm / loại sản phẩm (dự đoán chính xác nhất có thể)
- Tình trạng (mới/đã sử dụng, có dấu hiệu hư hỏng gì không)
- Đặc điểm nổi bật, chất liệu, kích thước nếu nhìn thấy
- Lý do nên mua, lợi ích
- Ngôn ngữ thân thiện, thuyết phục, có thể thêm emoji nhẹ nhàng
Không bịa thông tin, chỉ dựa vào những gì thấy trong ảnh.
Trả về **chỉ nội dung mô tả**, không thêm lời giải thích hay markdown.
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg", // thay "image/png" nếu ảnh png (có thể detect từ uri)
          data: base64Image,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error("Gemini generate error:", error);
    throw new Error("Không thể tạo mô tả bằng AI. Vui lòng thử lại.");
  }
};
