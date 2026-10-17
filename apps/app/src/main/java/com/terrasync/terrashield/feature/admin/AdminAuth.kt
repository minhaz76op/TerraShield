package com.terrasync.terrashield.feature.admin

import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

object AdminAuth {

    const val DEMO_EMAIL = "demo.admin@terrashield.local"
    const val DEMO_PASSWORD = "TerraShield-Demo-2026"

    private const val ITERATIONS = 10000
    private const val KEY_LENGTH = 256
    private const val MAX_FAILED_ATTEMPTS = 5
    private const val LOCKOUT_DURATION_MS = 15 * 60 * 1000L // 15 minutes
    private const val SESSION_TIMEOUT_MS = 30 * 60 * 1000L // 30 minutes

    private val salt: ByteArray = generateSalt()
    private val expectedHash: String = hashPassword(DEMO_PASSWORD, salt)

    private var failedAttempts = 0
    private var lockoutUntilMs = 0L
    private var lastActiveMs = 0L
    private var isLoggedIn = false
    private var currentUser: String? = null

    private fun generateSalt(): ByteArray {
        val random = SecureRandom()
        val salt = ByteArray(16)
        random.nextBytes(salt)
        return salt
    }

    fun hashPassword(password: String, saltBytes: ByteArray): String {
        val spec = PBEKeySpec(password.toCharArray(), saltBytes, ITERATIONS, KEY_LENGTH)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val hash = factory.generateSecret(spec).encoded
        return hash.joinToString("") { "%02x".format(it) }
    }

    data class LoginResult(
        val success: Boolean,
        val message: String,
        val isLocked: Boolean = false,
        val remainingLockMinutes: Int = 0
    )

    fun login(email: String, passwordAttempt: String): LoginResult {
        val now = System.currentTimeMillis()

        if (now < lockoutUntilMs) {
            val remainingMs = lockoutUntilMs - now
            val remainingMinutes = ((remainingMs / 1000) / 60).toInt() + 1
            return LoginResult(
                success = false,
                message = "অত্যধিক ব্যর্থ চেষ্টার কারণে অ্যাকাউন্ট $remainingMinutes মিনিটের জন্য লকড করা হয়েছে।",
                isLocked = true,
                remainingLockMinutes = remainingMinutes
            )
        }

        if (email.trim() != DEMO_EMAIL) {
            handleFailedAttempt(now)
            return LoginResult(
                success = false,
                message = "ভুল ইমেইল ঠিকানা। ডেমো আইডি ব্যবহার করুন।"
            )
        }

        val attemptHash = hashPassword(passwordAttempt, salt)
        if (attemptHash == expectedHash) {
            failedAttempts = 0
            isLoggedIn = true
            currentUser = email.trim()
            lastActiveMs = now
            return LoginResult(
                success = true,
                message = "সফলভাবে এডমিন প্যানেলে লগইন করা হয়েছে।"
            )
        } else {
            handleFailedAttempt(now)
            val left = MAX_FAILED_ATTEMPTS - failedAttempts
            val msg = if (left > 0) {
                "ভুল পাসওয়ার্ড! আর $left বার ভুল করলে অ্যাকাউন্ট ১৫ মিনিটের জন্য লকড হবে।"
            } else {
                "অত্যধিক ব্যর্থ চেষ্টার কারণে অ্যাকাউন্ট ১৫ মিনিটের জন্য লকড করা হয়েছে।"
            }
            return LoginResult(
                success = false,
                message = msg,
                isLocked = (failedAttempts >= MAX_FAILED_ATTEMPTS)
            )
        }
    }

    private fun handleFailedAttempt(now: Long) {
        failedAttempts++
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            lockoutUntilMs = now + LOCKOUT_DURATION_MS
        }
    }

    fun isSessionValid(): Boolean {
        if (!isLoggedIn) return false
        val now = System.currentTimeMillis()
        if (now - lastActiveMs > SESSION_TIMEOUT_MS) {
            logout()
            return false
        }
        lastActiveMs = now
        return true
    }

    fun logout() {
        isLoggedIn = false
        currentUser = null
    }

    fun getCurrentUser(): String? = currentUser
}
