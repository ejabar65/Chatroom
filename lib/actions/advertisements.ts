"use server"

import { createClient } from "@/lib/supabase/server"

export interface Advertisement {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string
  is_active: boolean
  position: 'sidebar' | 'banner' | 'header'
  created_at: string
  updated_at: string
}

export async function getActiveAds(position?: 'sidebar' | 'banner' | 'header') {
  const supabase = await createClient()
  
  let query = supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (position) {
    query = query.eq('position', position)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching ads:', error)
    return []
  }
  
  return data as Advertisement[]
}

export async function getAllAds() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching ads:', error)
    return []
  }
  
  return data as Advertisement[]
}

export async function toggleAdStatus(adId: string, isActive: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('advertisements')
    .update({ is_active: isActive })
    .eq('id', adId)
  
  if (error) {
    console.error('Error updating ad:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

export async function deleteAd(adId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('advertisements')
    .delete()
    .eq('id', adId)
  
  if (error) {
    console.error('Error deleting ad:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
