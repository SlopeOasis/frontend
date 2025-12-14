"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

export function DebugBackend() {
  const { getToken } = useAuth()

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    
    console.log("[DEBUG] API_BASE:", apiBase)
    
    // Test 1: Health check (no auth)
    ;(async () => {
      try {
        console.log("[DEBUG] Testing health endpoint...")
        const res = await fetch(`${apiBase}/health`)
        const text = await res.text()
        console.log("[DEBUG] Health response:", res.status, text)
      } catch (e) {
        console.error("[DEBUG] Health check failed:", e)
      }
    })()

    // Test 2: Get token and check if it exists
    ;(async () => {
      try {
        const token = await getToken({ template: "backendVerification" })
        console.log("[DEBUG] Clerk token exists:", !!token)
        if (token) {
          console.log("[DEBUG] Token first 50 chars:", token.substring(0, 50) + "...")
          // Try to decode and log claims (without verification)
          const parts = token.split(".")
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(atob(parts[1]))
              console.log("[DEBUG] Token claims:", payload)
            } catch (e) {
              console.error("[DEBUG] Failed to decode token payload:", e)
            }
          }
        } else {
          console.warn("[DEBUG] No Clerk token available - user may not be signed in")
        }
      } catch (e) {
        console.error("[DEBUG] Failed to get token:", e)
      }
    })()
  }, [getToken])

  return null
}
