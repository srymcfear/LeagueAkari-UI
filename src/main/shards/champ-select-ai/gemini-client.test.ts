import { describe, expect, it } from 'vitest'

import { parseGeminiJsonResponse } from './gemini-client'

describe('parseGeminiJsonResponse', () => {
  it('should parse valid plain JSON', () => {
    const raw = '{"threatLevel": "CRITICAL", "bullets": []}'
    const result = parseGeminiJsonResponse(raw)
    expect(result.threatLevel).toBe('CRITICAL')
  })

  it('should parse markdown json code fence', () => {
    const raw = '```json\n{"threatLevel": "HIGH", "threatScore": "8.0/10"}\n```'
    const result = parseGeminiJsonResponse(raw)
    expect(result.threatLevel).toBe('HIGH')
    expect(result.threatScore).toBe('8.0/10')
  })

  it('should parse markdown code fence without json tag', () => {
    const raw = '```\n{"threatLevel": "MODERATE"}\n```'
    const result = parseGeminiJsonResponse(raw)
    expect(result.threatLevel).toBe('MODERATE')
  })

  it('should return error if apiKey is empty', async () => {
    const { GeminiClient } = await import('./gemini-client')
    const result = await GeminiClient.testApiKey('')
    expect(result.success).toBe(false)
    expect(result.message).toContain('API Key')
  })
})
