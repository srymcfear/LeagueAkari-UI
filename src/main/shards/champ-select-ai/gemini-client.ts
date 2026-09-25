import type { AramChampionIntel, MatchupIntel } from '@shared/types/champ-select-ai'
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

export interface OptimizeAramChampionParams {
  apiKey: string
  model?: string
  championName: string
  championId: number
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

function getDefaultAramIntel(championId: number, championName: string): AramChampionIntel {
  return {
    championId,
    championName,
    buildStyle: 'Chiến Binh Đột Biến Vực Gió Hú',
    tierGrade: 'S TIER',
    augments: [
      {
        name: 'Gia Tốc Thần Tốc (Accelerating Sorcery)',
        tier: 'S',
        desc: 'Tăng vĩnh viễn điểm hồi kỹ năng và tốc độ tung chiêu thức.',
        synergy: 'Cho phép xả kỹ năng liên tục trong giao tranh ARAM không ngừng nghỉ.'
      },
      {
        name: 'Đòn Đánh Bùng Nổ (Apex Inventor / Heavy Hitter)',
        tier: 'S',
        desc: 'Cường hóa sát thương đột biến và hồi chiêu trang bị thần tốc.',
        synergy: 'Khuếch đại sát thương dứt điểm mục tiêu yếu máu cực nhanh.'
      },
      {
        name: 'Hồi Phục Sinh Mệnh (Restorative Regimen)',
        tier: 'A',
        desc: 'Hồi phục máu và tài nguyên liên tục sau khi tham gia hạ gục.',
        synergy: 'Giữ nhịp chiến đấu bền bỉ mà không cần phải hi sinh để về nhà mua đồ.'
      }
    ],
    coreItems: ['Đồng Hồ Cát Zhonya', 'Ngọn Lửa Hắc Hóa', 'Mũ Phù Thủy Rabadon', 'Giày Pháp Sư'],
    summonerSpells: ['Tốc Biến', 'Đánh Dấu (Cầu Tuyết)'],
    tactics: [
      {
        title: 'Tận Dụng Góc Hẹp Cầu Vực',
        text: 'Chiêu thức diện rộng ở ARAM có tỉ lệ trúng cực cao do địa hình hẹp một đường thẳng.',
        type: 'purple'
      },
      {
        title: 'Tranh Đoạt Mũ & Túi Hồi Máu',
        text: 'Kiểm soát nhịp xuất hiện của túi máu và nhặt Mũ tăng chỉ số ngay khi hạ gục tướng địch.',
        type: 'info'
      },
      {
        title: 'Băng Trụ & Đánh Dấu Cầu Tuyết',
        text: 'Dùng Cầu Tuyết để tiếp cận bất ngờ từ xa hoặc kiểm tra bụi cỏ ven vực.',
        type: 'danger'
      }
    ],
    combatTips: [
      'Đứng phía sau đội hình chống chịu nếu là pháp sư/xạ thủ, tránh bị kéo vào vùng nguy hiểm.',
      'Ưu tiên chọn các lõi nâng cấp giảm hồi chiêu hoặc tăng phạm vi kỹ năng.',
      'Nhớ dùng Poro Snax và kiểm tra bụi rậm trung tâm để phát hiện sát thủ địch áp sát.'
    ],
    mayhemBuffNotes:
      'Chế độ ARAM Hỗn Loạn gia tăng tốc độ trận đấu và sát thương bộc phát cực mạnh.',
    cached: false,
    timestamp: Date.now()
  }
}

export class GeminiClient {
  static async testApiKey(
    apiKey: string,
    model: string = 'gemini-3.1-flash-lite'
  ): Promise<{ success: boolean; message?: string }> {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, message: 'API Key không được để trống' }
    }

    const effectiveModel = !model || model === 'gemini-2.5-flash' ? 'gemini-3.1-flash-lite' : model

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
      model = 'gemini-3.1-flash-lite',
      myChampionName,
      myChampionId,
      enemyChampionName,
      enemyChampionId,
      enemyPosition = 'MID'
    } = params

    const effectiveModel = !model || model === 'gemini-2.5-flash' ? 'gemini-3.1-flash-lite' : model

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

  static async optimizeAramChampion(
    params: OptimizeAramChampionParams
  ): Promise<AramChampionIntel> {
    const { apiKey, model = 'gemini-3.1-flash-lite', championName, championId } = params

    if (!apiKey || apiKey.trim().length === 0) {
      return getDefaultAramIntel(championId, championName)
    }

    const effectiveModel = !model || model === 'gemini-2.5-flash' ? 'gemini-3.1-flash-lite' : model

    const systemPrompt = `Bạn là chuyên gia phân tích chiến thuật cấp cao và huấn luyện viên thi đấu Liên Minh Huyền Thoại (League of Legends), am hiểu sâu sắc chế độ "ARAM: HỖN LOẠN" (ARAM MAYHEM - Đấu Trường Vực Gió Hú với Lõi Nâng Cấp Thần Thoại/Kim Cương/Vàng, nhặt Mũ, giao tranh tổng liên tục).
Nhiệm vụ: Hướng dẫn người chơi cách TỐI ƯU HÓA vị tướng "${championName}" để gánh đội và outplay đối thủ trong ARAM Hỗn Loạn.
Yêu cầu định dạng: BẮT BUỘC trả về DUY NHẤT 1 đối tượng JSON thuần túy (không kèm giải thích bên ngoài):
{
  "buildStyle": "Lối chơi tối ưu đột biến (ví dụ: 'Pháp Sư Xả Sát Thương Tầm Xa', 'Đấu Sĩ Càn Quét Bất Tử', 'Sát Thủ Sát Lực Đột Biến')",
  "tierGrade": "S+ TIER" | "S TIER" | "A TIER",
  "augments": [
    {
      "name": "Tên Lõi Nâng Cấp 1 (Lõi S-Tier trong ARAM Mayhem/Arena)",
      "tier": "S",
      "desc": "Mô tả ngắn hiệu ứng lõi",
      "synergy": "Vì sao cực kỳ đột biến với chiêu thức của ${championName}"
    },
    {
      "name": "Tên Lõi Nâng Cấp 2",
      "tier": "S",
      "desc": "Mô tả ngắn hiệu ứng lõi",
      "synergy": "Khả năng cộng hưởng với chất tướng"
    },
    {
      "name": "Tên Lõi Nâng Cấp 3",
      "tier": "A",
      "desc": "Mô tả ngắn hiệu ứng lõi",
      "synergy": "Khả năng cộng hưởng với chất tướng"
    }
  ],
  "coreItems": [
    "Trang bị trấn phái 1",
    "Trang bị trấn phái 2",
    "Trang bị trấn phái 3",
    "Trang bị tình huống"
  ],
  "summonerSpells": [
    "Tốc Biến",
    "Đánh Dấu (Cầu Tuyết)"
  ],
  "tactics": [
    {
      "title": "Combo Chiêu Đột Biến Khi Có Lõi",
      "text": "Thứ tự ra chiêu và mẹo tối đa sát thương/khống chế trong không gian hẹp.",
      "type": "purple"
    },
    {
      "title": "Vị Trí & Nhịp Giao Tranh Tổng",
      "text": "Cách giữ vị trí né cấu rỉa, góc băng vào và mục tiêu ưu tiên số 1.",
      "type": "info"
    },
    {
      "title": "Tận Dụng Cơ Chế ARAM Hỗn Loạn",
      "text": "Mẹo nhặt Mũ, dùng Cổng Dịch Chuyển Hextech, và phối hợp Hồi Máu.",
      "type": "danger"
    }
  ],
  "combatTips": [
    "Mẹo thực chiến 1 trong combat liên tục",
    "Mẹo thực chiến 2 khi đối đầu số đông",
    "Mẹo thực chiến 3 kiểm soát năng lượng/máu"
  ],
  "mayhemBuffNotes": "Lưu ý cân bằng riêng hoặc sức mạnh của tướng trong bản ARAM Hỗn Loạn."
}
Ngôn ngữ: Tiếng Việt súc tích, thực chiến, không dùng các từ ngữ rườm rà.`

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey.trim()}`
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
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
        return getDefaultAramIntel(championId, championName)
      }

      const parsed = parseGeminiJsonResponse(rawText)
      return {
        championId,
        championName,
        buildStyle: parsed.buildStyle || 'Chiến Binh Đột Biến Vực Gió Hú',
        tierGrade: parsed.tierGrade || 'S TIER',
        augments: parsed.augments || [],
        coreItems: parsed.coreItems || [],
        summonerSpells: parsed.summonerSpells || ['Tốc Biến', 'Đánh Dấu (Cầu Tuyết)'],
        tactics: parsed.tactics || [],
        combatTips: parsed.combatTips || [],
        mayhemBuffNotes: parsed.mayhemBuffNotes || '',
        cached: false,
        timestamp: Date.now()
      }
    } catch {
      return getDefaultAramIntel(championId, championName)
    }
  }
}
