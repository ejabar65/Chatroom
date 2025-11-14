const PROFANITY_LIST = [
  // Profanity
  "fuck", "shit", "bitch", "ass", "damn", "hell", "crap", "piss", "dick", "cock", 
  "pussy", "bastard", "slut", "whore", "fag", "faggot", "nigger", "nigga", "retard", 
  "cunt", "twat", "wank", "bollocks", "prick", "douche", "jackass", "dumbass",
  
  // Slurs and hate speech
  "kike", "spic", "chink", "gook", "beaner", "wetback", "raghead", "sandnigger",
  
  // Sexual content
  "porn", "xxx", "sex", "nude", "naked", "boobs", "tits", "penis", "vagina",
  "anal", "orgasm", "masturbate", "horny", "sexy",
  
  // Violence and threats
  "kill", "murder", "rape", "suicide", "bomb", "terrorist", "shoot", "stab",
  
  // Drugs
  "weed", "marijuana", "cocaine", "meth", "heroin", "drugs", "high", "stoned",
]

// Suspicious patterns that might indicate spam or inappropriate content
const SUSPICIOUS_PATTERNS = [
  /\b(buy|sell|cheap|discount|offer|deal|cash|money|earn|profit)\b.*\b(now|today|click|link|here)\b/gi,
  /\b(viagra|cialis|pharmacy|pills)\b/gi,
  /https?:\/\/[^\s]+/gi, // Suspicious URLs
  /\b\d{10,}\b/g, // Long phone numbers
  /(.)\1{4,}/g, // Repeated characters (aaaaaaa)
  /\b[A-Z]{10,}\b/g, // Excessive caps
]

// Create regex patterns for variations (with numbers, special chars, etc.)
const createProfanityPatterns = () => {
  return PROFANITY_LIST.map((word) => {
    const pattern = word
      .split("")
      .map((char) => {
        const substitutions: Record<string, string> = {
          a: "[a@4]",
          e: "[e3]",
          i: "[i1!]",
          o: "[o0]",
          s: "[s$5]",
          t: "[t7]",
          u: "[u\\|]",
          l: "[l1]",
          z: "[z2]",
        }
        return substitutions[char.toLowerCase()] || char
      })
      .join("[\\W_]*")

    return new RegExp(`\\b${pattern}\\b`, "gi")
  })
}

const profanityPatterns = createProfanityPatterns()

export function containsProfanity(text: string): boolean {
  if (!text) return false

  const cleanText = text.toLowerCase().replace(/[\s\-_.]/g, "")

  // Check against all patterns
  for (const pattern of profanityPatterns) {
    if (pattern.test(text) || pattern.test(cleanText)) {
      return true
    }
  }

  // Check for exact matches
  const words = text.toLowerCase().split(/\s+/)
  for (const word of words) {
    if (PROFANITY_LIST.includes(word)) {
      return true
    }
  }

  return false
}

export function containsSuspiciousContent(text: string): boolean {
  if (!text) return false

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return true
    }
  }

  return false
}

export function strictContentFilter(text: string): { safe: boolean; reason?: string } {
  if (!text || !text.trim()) {
    return { safe: false, reason: "Content cannot be empty" }
  }

  // Check for profanity
  if (containsProfanity(text)) {
    return { safe: false, reason: "Content contains inappropriate language" }
  }

  // Check for suspicious patterns
  if (containsSuspiciousContent(text)) {
    return { safe: false, reason: "Content appears to be spam or contains suspicious patterns" }
  }

  // Check for excessive caps (more than 50% uppercase)
  const upperCount = (text.match(/[A-Z]/g) || []).length
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length
  if (letterCount > 10 && upperCount / letterCount > 0.5) {
    return { safe: false, reason: "Please don't use excessive capitalization" }
  }

  return { safe: true }
}

export function filterProfanity(text: string): string {
  if (!text) return text

  let filtered = text

  for (const pattern of profanityPatterns) {
    filtered = filtered.replace(pattern, (match) => "*".repeat(match.length))
  }

  return filtered
}

export async function checkImageContent(imageFile: File): Promise<{ safe: boolean; reason?: string }> {
  try {
    if (imageFile.size > 10 * 1024 * 1024) {
      return { safe: false, reason: "File size too large (max 10MB)" }
    }

    if (!imageFile.type.startsWith("image/")) {
      return { safe: false, reason: "Invalid file type - must be an image" }
    }

    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const fileName = imageFile.name.toLowerCase()
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return { safe: false, reason: "Invalid image format. Use JPG, PNG, GIF, or WEBP" }
    }

    return { safe: true }
  } catch (error) {
    console.error("[v0] Image check error:", error)
    return { safe: false, reason: "Failed to verify image" }
  }
}
