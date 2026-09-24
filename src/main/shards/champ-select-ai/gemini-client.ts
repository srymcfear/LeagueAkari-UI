import type { MatchupIntel } from '@shared/types/champ-select-ai'
import axios from 'axios'

export interface AnalyzeMatchupParams {
  apiKey: string
  model?: string
  myChampionName: string
  myChampionId: number
  enemyChampionName: string
  enemyChampionId: number
  enemyPosition?: string
}

export function parseGeminiJsonResponse(rawText: string): any {
  let clean = rawText.trim()
  // Remove markdown code fence if present
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  clean = clean.trim()
  return JSON.parse(clean)
}

export class GeminiClient {
  static async testApiKey(
    apiKey: string,
    model: string = 'gemini-3.6-flash'
  ): Promise<{ success: boolean; message?: string }> {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, message: 'API Key không được để trống' }
    }

    const effectiveModel = !model || model === 'gemini-2.5-flash' ? 'gemini-3.6-flash' : model

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey.trim()}`
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: 'Trả lời đúng 1 chữ: OK' }] }]
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (response.status === 200) {
        return { success: true }
      }
      return { success: false, message: `Mã phản hồi: ${response.status}` }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message || err?.message || 'Lỗi kết nối tới Gemini API'
      return { success: false, message: errMsg }
    }
  }

  static async analyzeMatchup(params: AnalyzeMatchupParams): Promise<MatchupIntel> {
    const {
      apiKey,
      model = 'gemini-3.6-flash',
      myChampionName,
      myChampionId,
      enemyChampionName,
      enemyChampionId,
      enemyPosition = 'MID'
    } = params

    const effectiveModel = !model || model === 'gemini-2.5-flash' ? 'gemini-3.6-flash' : model

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Chưa thiết lập Gemini API Key. Vui lòng vào Cài đặt để nhập Key.')
    }

    const systemPrompt = `Bạn là một chuyên gia phân tích chiến thuật và huấn luyện viên thi đấu Liên Minh Huyền Thoại (League of Legends) đỉnh cao.
Nhiệm vụ: Phân tích kèo đối đầu khi người chơi cầm tướng "${myChampionName || 'Tướng của bạn'}" đối đầu với tướng đối phương "${enemyChampionName}" (Vị trí: ${enemyPosition}).
Yêu cầu định dạng: BẮT BUỘC trả về duy nhất 1 đối tượng JSON thuần túy (không kèm giải thích ngoài), có cấu trúc sau:
{
  "threatLevel": "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE",
  "threatScore": "8.5/10",
  "threatColor": "#fb7185" | "#c084fc" | "#60a5fa",
  "bullets": [
    {
      "title": "Tên chiêu hoặc cơ chế nguy hiểm nhất của địch",
      "text": "Mẹo né tránh, khắc chế hoặc thời điểm bắt bài cụ thể ngắn gọn trong 1-2 câu.",
      "type": "danger"
    },
    {
      "title": "Mẹo trừng phạt hoặc trao đổi chiêu thức",
      "text": "Cách mà tướng ${myChampionName || 'của bạn'} khai thác điểm yếu của ${enemyChampionName} để thắng đường.",
      "type": "purple"
    },
    {
      "title": "Kiểm soát thế lính hoặc nhịp giao tranh",
      "text": "Lưu ý quan trọng về thế lính, cắm mắt hoặc vai trò trong combat tổng.",
      "type": "info"
    }
  ],
  "counters": [
    { "name": "TênTướngKhắcChế1", "winRate": "56.5% WIN" },
    { "name": "TênTướngKhắcChế2", "winRate": "55.2% WIN" },
    { "name": "TênTướngKhắcChế3", "winRate": "54.0% WIN" }
  ],
  "recommendedItems": [
    "TênTrangBị1",
    "TênTrangBị2",
    "TênTrangBị3"
  ]
}
Hãy đưa ra chiến thuật thực chiến chính xác, súc tích và bằng Tiếng Việt.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey.trim()}`

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json'
        }
      },
      {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      }
    )

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      throw new Error('Không nhận được nội dung từ Gemini')
    }

    const parsed = parseGeminiJsonResponse(rawText)

    return {
      myChampionId,
      myChampionName,
      enemyChampionId,
      enemyChampionName,
      enemyPosition,
      threatLevel: parsed.threatLevel || 'HIGH',
      threatScore: parsed.threatScore || '7.5/10',
      threatColor: parsed.threatColor || '#fb7185',
      bullets: parsed.bullets || [],
      counters: parsed.counters || [],
      recommendedItems: parsed.recommendedItems || [],
      cached: false,
      timestamp: Date.now()
    }
  }
}
