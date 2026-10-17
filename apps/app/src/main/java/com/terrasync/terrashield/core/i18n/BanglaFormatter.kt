package com.terrasync.terrashield.core.i18n

import java.util.Locale

object BanglaFormatter {

    private val BANGLA_DIGITS = charArrayOf('০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯')
    private val MONTHS_BN = listOf(
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    )
    private val MONTHS_EN = listOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )

    fun isEnglish(language: String? = null): Boolean {
        if (language != null) {
            return language.lowercase().startsWith("en")
        }
        val appLocales = try {
            androidx.appcompat.app.AppCompatDelegate.getApplicationLocales()
        } catch (_: Throwable) { null }

        if (appLocales != null && !appLocales.isEmpty) {
            val appLang = appLocales.get(0)?.language
            if (!appLang.isNullOrEmpty()) {
                return appLang.lowercase().startsWith("en")
            }
        }
        val lang = Locale.getDefault().language
        return lang.lowercase().startsWith("en")
    }

    fun toBanglaDigits(number: Any?, language: String? = null): String {
        if (number == null) return ""
        val str = number.toString()
        if (isEnglish(language)) {
            return toEnglishDigits(str)
        }
        val sb = StringBuilder()
        for (ch in str) {
            if (ch in '0'..'9') {
                sb.append(BANGLA_DIGITS[ch - '0'])
            } else {
                sb.append(ch)
            }
        }
        return sb.toString()
    }

    fun toEnglishDigits(text: String?): String {
        if (text == null) return ""
        val sb = StringBuilder()
        for (ch in text) {
            val idx = "০১২৩৪৫৬৭৮৯".indexOf(ch)
            if (idx >= 0) {
                sb.append('0' + idx)
            } else {
                sb.append(ch)
            }
        }
        return sb.toString()
    }

    fun formatNumber(number: Number, language: String? = null): String {
        return toBanglaDigits(number.toString(), language)
    }

    fun formatDate(isoDate: String?, language: String? = null): String {
        if (isoDate.isNullOrBlank()) return ""
        val parts = isoDate.trim().split("-")
        if (parts.size != 3) return toBanglaDigits(isoDate, language)

        val year = parts[0]
        val monthIdx = (parts[1].toIntOrNull() ?: 1) - 1
        val day = parts[2].toIntOrNull() ?: 1

        return if (isEnglish(language)) {
            val monthName = MONTHS_EN.getOrElse(monthIdx) { "" }
            "$day $monthName $year"
        } else {
            val monthName = MONTHS_BN.getOrElse(monthIdx) { "" }
            "${toBanglaDigits(day, "bn")} $monthName ${toBanglaDigits(year, "bn")}"
        }
    }

    fun getTimeOfDayPhrase(hourOfDay: Int, language: String? = null): String {
        return if (isEnglish(language)) {
            when (hourOfDay) {
                in 5..11 -> "Morning"
                in 12..14 -> "Noon"
                in 15..17 -> "Afternoon"
                in 18..19 -> "Evening"
                else -> "Night"
            }
        } else {
            when (hourOfDay) {
                in 5..11 -> "সকাল"
                in 12..14 -> "দুপুর"
                in 15..17 -> "বিকাল"
                in 18..19 -> "সন্ধ্যা"
                else -> "রাত"
            }
        }
    }
}
