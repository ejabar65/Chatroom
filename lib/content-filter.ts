const PROFANITY_LIST = [
  // Common profanity and slurs
  "fuck",
  "shit",
  "bitch",
  "ass",
  "damn",
  "hell",
  "crap",
  "piss",
  "dick",
  "cock",
  "pussy",
  "bastard",
  "slut",
  "whore",
  "fag",
  "nigger",
  "nigga",
  "retard",
  "cunt",
  // Add more as needed
]

// Create regex patterns for variations (with numbers, special chars, etc.)
const createProfanityPatterns = () => {
  return PROFANITY_LIST.map((word) => {
    // Replace letters with common substitutions
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
        }
        return substitutions[char.toLowerCase()] || char
      })
      .join("[\\W_]*") // Allow special characters between letters

    return new RegExp(pattern, "gi")
  })
}

const profanityPatterns = createProfanityPatterns()

export function containsProfanity(text: string): boolean {
  if (!text) return false

  // Remove spaces and special characters for checking
  const cleanText = text.toLowerCase().replace(/[\s\-_.]/g, "")

  // Check against all patterns
  for (const pattern of profanityPatterns) {
    if (pattern.test(text) || pattern.test(cleanText)) {
      return true
    }
  }

  // Check for exact matches in word list
  const words = text.toLowerCase().split(/\s+/)
  for (const word of words) {
    if (PROFANITY_LIST.includes(word)) {
      return true
    }
  }

  return false
}

export function filterProfanity(text: string): string {
  if (!text) return text

  let filtered = text

  // Replace profanity with asterisks
  for (const pattern of profanityPatterns) {
    filtered = filtered.replace(pattern, (match) => "*".repeat(match.length))
  }

  return filtered
}

// Image content moderation using basic checks
export async function checkImageContent(imageFile: File): Promise<{ safe: boolean; reason?: string }> {
  try {
    // Check file size (suspiciously large files might be inappropriate)
    if (imageFile.size > 10 * 1024 * 1024) {
      return { safe: false, reason: "File size too large" }
    }

    // Check file type
    if (!imageFile.type.startsWith("image/")) {
      return { safe: false, reason: "Invalid file type" }
    }

    // For now, we'll allow all images that pass basic checks
    // In production, you would integrate with an AI moderation service like:
    // - AWS Rekognition
    // - Google Cloud Vision API
    // - Microsoft Azure Content Moderator
    // - Clarifai NSFW Detection

    return { safe: true }
  } catch (error) {
    console.error("[v0] Image check error:", error)
    return { safe: false, reason: "Failed to verify image" }
  }
}
