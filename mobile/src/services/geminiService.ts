import axios from "axios";

const GEMINI_API_KEY = "AIzaSyD-P5iWjsfeuf2k6JRjSlo77mWO_x1Nnwo";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

export const getSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const prompt = `Người dùng đang tìm kiếm sản phẩm trên ứng dụng mua bán đồ cũ với từ khóa: "${query}".
Hãy gợi ý 5 từ khóa tìm kiếm liên quan ngắn gọn (tiếng Việt), phù hợp với thị trường đồ cũ Việt Nam.
Chỉ trả về danh sách JSON array các chuỗi ngắn, ví dụ: ["iPhone 14", "điện thoại cũ", "iPhone lock", "iPhone quốc tế", "điện thoại giá rẻ"]
Không trả về gì khác ngoài JSON array.`;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      },
      { timeout: 8000 }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const suggestions = JSON.parse(jsonMatch[0]);
    return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
  } catch (err) {
    console.warn("Gemini suggestion error:", err);
    return [];
  }
};

export const getAISearchInsight = async (query: string): Promise<string> => {
  if (!query || query.trim().length < 2) return "";

  try {
    const prompt = `Người dùng tìm kiếm: "${query}" trên app mua bán đồ cũ.
Đưa ra 1 gợi ý mua hàng thông minh ngắn gọn (1 câu, tối đa 80 ký tự tiếng Việt).
Chỉ trả về câu đó, không có gì thêm.`;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 80 },
      },
      { timeout: 6000 }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch {
    return "";
  }
};

export const analyzeImageForSearch = async (
  base64Image: string
): Promise<{ keyword: string; category: string }> => {
  if (!base64Image) return { keyword: "", category: "Tất cả" };

  try {
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    console.log("Analyzing image, base64 length:", base64Data.length);

    const prompt = `Bạn là chuyên gia nhận diện sản phẩm. Quan sát ảnh và trả về JSON sau:
{
  "keyword": "<tên gọi ngắn gọn nhất của vật thể/sản phẩm bằng tiếng Việt, 2-4 chữ>",
  "category": "<1 trong các giá trị sau: Xe cộ, Đồ gia dụng, Điện tử, Khác>"
}

Ví dụ:
- Ảnh iPhone → {"keyword": "điện thoại", "category": "Điện tử"}
- Ảnh xe máy → {"keyword": "xe máy", "category": "Xe cộ"}
- Ảnh sofa → {"keyword": "ghế sofa", "category": "Đồ gia dụng"}

Ngay cả khi ảnh mờ, hãy cố gắng đoán loại đồ vật gần nhất. PHẢI trả về đúng định dạng JSON trên, không thêm gì khác.`;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60 },
      },
      { timeout: 15000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log("Gemini image result:", text);

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        keyword: (parsed.keyword || "").replace(/^["']|["']$/g, "").trim(),
        category: parsed.category || "Tất cả",
      };
    }

    // Fallback: treat full text as keyword
    return { keyword: text.replace(/^["']|["']$/g, "").replace(/\.$/, "").trim(), category: "Tất cả" };
  } catch (err: any) {
    if (err.response) {
      console.warn("Gemini image error (Response):", JSON.stringify(err.response.data, null, 2));
    } else {
      console.warn("Gemini image error (Network):", err.message);
    }
    throw err;
  }
};

export const generateDescriptionFromImage = async (
  base64Image: string,
  title: string
): Promise<string> => {
  if (!base64Image) return "";

  try {
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    const prompt = `Dựa vào hình ảnh này và tiêu đề "${title}" do người dùng nhập, hãy viết một đoạn mô tả bán hàng đồ cũ thật hay, thu hút và đầy yeter thông tin (khoảng 3-4 câu tiếng Việt).
Yêu cầu:
- Tôn lên vẻ đẹp hoặc trạng thái sử dụng tốt của sản phẩm.
- Không tự ý bịa thêm giá tiền hay chèn thông tin liên hệ.
- Viết tự nhiên như một người dùng đang rao bán món đồ cá nhân trên mạng xã hội Facebook hoặc Chợ Tốt.`;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            ],
          },
        ],
        generationConfig: { temperature: 0.6, maxOutputTokens: 200 },
      },
      { timeout: 15000 }
    );

    const desc = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return desc;
  } catch (err) {
    console.warn("Gemini generate description error:", err);
    return "";
  }
};
