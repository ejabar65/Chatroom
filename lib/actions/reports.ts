"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyThrottle } from "@/lib/throttle"

export async function createReport(
  targetType: "user" | "post" | "comment",
  targetId: string,
  reason: string
) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const reportData: any = {
      reporter_id: user.id,
      reason: reason.trim(),
      status: "pending",
    }

    if (targetType === "user") {
      reportData.reported_user_id = targetId
    } else if (targetType === "post") {
      reportData.reported_post_id = targetId
    } else if (targetType === "comment") {
      reportData.reported_comment_id = targetId
    }

    const { error } = await supabase.from("reports").insert(reportData)

    if (error) {
      console.error("[v0] Create report error:", error)
      return { success: false, error: "Failed to submit report" }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateReportStatus(reportId: string, status: string, adminKey?: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!userProfile?.is_admin) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("reports")
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)

    if (error) {
      return { success: false, error: "Failed to update report" }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("[v0] Update report error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAllReports() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        reporter:reporter_id (full_name, email),
        reported_user:reported_user_id (full_name, email),
        reported_post:reported_post_id (title),
        reported_comment:reported_comment_id (content)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: "Failed to fetch reports" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Fetch reports error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
