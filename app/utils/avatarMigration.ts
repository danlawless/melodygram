// Utility to migrate legacy avatar URLs to use proxy

export interface LegacyAvatar {
  id: string
  imageUrl: string
  createdAt: string
  prompt: string
  style: string
  mood: string
  favorite: boolean
  isTemporaryUrl?: boolean
  thumbnail?: string
}

/**
 * Migrate legacy avatar URLs to use the proxy endpoint
 */
export function migrateAvatarUrl(avatar: LegacyAvatar): LegacyAvatar {
  // Check if this is an external URL that should be proxied
  const isExternalUrl = avatar.imageUrl.includes('blob.core.windows.net') || 
                       avatar.imageUrl.includes('oaidalleapiprodscus') ||
                       avatar.imageUrl.includes('openai.com')
  
  if (isExternalUrl && !avatar.imageUrl.startsWith('/api/proxy-image')) {
    // Convert to proxied URL
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(avatar.imageUrl)}`
    
    return {
      ...avatar,
      imageUrl: proxiedUrl,
      thumbnail: proxiedUrl, // Also migrate thumbnail
      isTemporaryUrl: false, // Proxied URLs are more reliable
    }
  }
  
  return avatar
}

/**
 * Migrate an array of legacy avatars
 */
export function migrateAvatarHistory(avatars: LegacyAvatar[]): LegacyAvatar[] {
  return avatars.map(migrateAvatarUrl)
}

/**
 * Check if migration is needed for an avatar
 */
export function needsMigration(avatar: LegacyAvatar): boolean {
  const isExternalUrl = avatar.imageUrl.includes('blob.core.windows.net') || 
                       avatar.imageUrl.includes('oaidalleapiprodscus') ||
                       avatar.imageUrl.includes('openai.com')
  
  return isExternalUrl && !avatar.imageUrl.startsWith('/api/proxy-image')
}