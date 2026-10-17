package com.terrasync.terrashield.core.voice

import com.terrasync.terrashield.core.i18n.BanglaFormatter

object SpokenNumberParser {

    private val BN_WORDS = listOf(
        "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
        "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
        "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "উনত্রিশ",
        "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "উনচল্লিশ",
        "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "উনপঞ্চাশ",
        "পঞ্চাশ", "একান্ন", "বাহান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "উনষাট",
        "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "উনসত্তর",
        "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "উনআশি",
        "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "অষ্টআশি", "উননব্বই",
        "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"
    )

    private val BN_EXTRA = mapOf(
        "দুই" to 2, "দু" to 2, "দো" to 2, "ছ" to 6, "ছয়" to 6, "নয়" to 9,
        "শুন্য" to 0, "জিরো" to 0, "ষোল" to 16, "বারো" to 12
    )

    private val EN_ONES = listOf(
        "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
    )

    private val EN_TENS = mapOf(
        "twenty" to 20, "thirty" to 30, "forty" to 40, "fifty" to 50,
        "sixty" to 60, "seventy" to 70, "eighty" to 80, "ninety" to 90
    )

    fun clean(text: String?): String {
        if (text.isNullOrBlank()) return ""
        val normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFC)
            .replace("য়", "য়")
        val digitsConverted = BanglaFormatter.toEnglishDigits(normalized)
        return digitsConverted.lowercase()
            .replace(Regex("[,।?!\\-]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
    }

    private val BN_MAP: Map<String, Int> by lazy {
        val map = mutableMapOf<String, Int>()
        BN_WORDS.forEachIndexed { idx, w -> map[clean(w)] = idx }
        BN_EXTRA.forEach { (w, v) -> map[clean(w)] = v }
        map
    }

    private data class WordVal(
        val n: Double? = null,
        val digits: Int = 0,
        val mul: Int? = null,
        val point: Boolean = false,
        val half: Boolean = false,
        val hundredWord: Boolean = false
    )

    private fun wordValue(w: String): WordVal? {
        val cw = clean(w)
        if (Regex("^\\d+(\\.\\d+)?$").matches(cw)) {
            val num = cw.toDoubleOrNull() ?: return null
            return WordVal(n = num, digits = cw.length)
        }
        val bnVal = BN_MAP[cw]
        if (bnVal != null) return WordVal(n = bnVal.toDouble())

        val enOneIdx = EN_ONES.indexOf(cw)
        if (enOneIdx >= 0) return WordVal(n = enOneIdx.toDouble())

        val enTenVal = EN_TENS[cw]
        if (enTenVal != null) return WordVal(n = enTenVal.toDouble())

        if (cw == "oh" || cw == "o") return WordVal(n = 0.0)
        if (cw == "শো" || cw == "শ" || cw == "শত" || cw == "hundred") return WordVal(mul = 100)
        if (cw == "হাজার" || cw == "thousand") return WordVal(mul = 1000)
        if (cw == "দশমিক" || cw == "point" || cw == "dot") return WordVal(point = true)
        if (cw == "সাড়ে" || cw == "সারে" || cw.startsWith("সাড়") || cw.startsWith("সার")) return WordVal(half = true)

        val matchHundred = Regex("^(.+?)(শো|শত|শ)$").find(cw)
        if (matchHundred != null) {
            val prefix = matchHundred.groupValues[1]
            val pVal = BN_MAP[prefix]
            if (pVal != null) return WordVal(n = (pVal * 100).toDouble(), hundredWord = true)
        }

        return null
    }

    fun parseSpokenNumber(text: String?): Double? {
        val s = clean(text)
        if (s.isEmpty()) return null

        val noSpaces = s.replace(" ", "")
        if (Regex("^\\d+(\\.\\d+)?$").matches(noSpaces) && !Regex("\\d\\s+\\d+\\.\\d").containsMatchIn(s)) {
            return noSpaces.toDoubleOrNull()
        }

        val tokens = s.split(" ").filter { t ->
            t.isNotEmpty() && !Regex("^(শতাংশ|ডেসিমেল|decimal|decimals|দাগ|নম্বর|number|dag)$").matches(t)
        }
        if (tokens.isEmpty()) return null

        val vals = tokens.map { wordValue(it) }
        if (vals.any { it == null }) return null
        val nonNullVals = vals.filterNotNull()

        if (!nonNullVals.any { it.n != null || it.mul != null }) return null

        // Digit-by-digit style
        if (nonNullVals.size > 1 && nonNullVals.all {
                it.n != null && it.n in 0.0..9.0 && !it.hundredWord && it.digits <= 1
            }) {
            val digitsStr = nonNullVals.mapNotNull { it.n?.toInt()?.toString() }.joinToString("")
            return digitsStr.toDoubleOrNull()
        }

        var half = false
        var total = 0.0
        var current = 0.0
        var decimals: String? = null

        for (v in nonNullVals) {
            if (v.half) {
                half = true
                continue
            }
            if (v.point) {
                decimals = ""
                continue
            }
            if (decimals != null) {
                if (v.n == null) return null
                decimals += v.n.toInt().toString()
                continue
            }
            if (v.mul != null) {
                if (v.mul == 100) {
                    current = (if (current > 0) current else 1.0) * 100.0
                } else {
                    total += (if (current > 0) current else 1.0) * 1000.0
                    current = 0.0
                }
                continue
            }
            if (v.n != null) {
                current += v.n
            }
        }

        var result = total + current
        if (decimals != null && decimals.isNotEmpty()) {
            val intPart = result.toLong()
            result = "$intPart.$decimals".toDoubleOrNull() ?: result
        }
        if (half) {
            result += 0.5
        }

        return result
    }
}
