package com.terrasync.terrashield.core.i18n

import org.junit.Assert.assertEquals
import org.junit.Test

class BanglaFormatterTest {

    @Test
    fun testToBanglaDigits() {
        assertEquals("০১২৩৪৫৬৭৮৯", BanglaFormatter.toBanglaDigits("0123456789", "bn"))
        assertEquals("১০৩", BanglaFormatter.toBanglaDigits(103, "bn"))
        assertEquals("0123456789", BanglaFormatter.toBanglaDigits("0123456789", "en"))
        assertEquals("103", BanglaFormatter.toBanglaDigits(103, "en"))
    }

    @Test
    fun testToEnglishDigits() {
        assertEquals("0123456789", BanglaFormatter.toEnglishDigits("০১২৩৪৫৬৭৮৯"))
        assertEquals("103", BanglaFormatter.toEnglishDigits("১০৩"))
    }

    @Test
    fun testFormatDate() {
        assertEquals("১৫ জানুয়ারি ২০২৩", BanglaFormatter.formatDate("2023-01-15", "bn"))
        assertEquals("15 January 2023", BanglaFormatter.formatDate("2023-01-15", "en"))
    }

    @Test
    fun testGetTimeOfDayPhrase() {
        assertEquals("সকাল", BanglaFormatter.getTimeOfDayPhrase(8, "bn"))
        assertEquals("দুপুর", BanglaFormatter.getTimeOfDayPhrase(13, "bn"))
        assertEquals("বিকাল", BanglaFormatter.getTimeOfDayPhrase(16, "bn"))
        assertEquals("সন্ধ্যা", BanglaFormatter.getTimeOfDayPhrase(19, "bn"))
        assertEquals("রাত", BanglaFormatter.getTimeOfDayPhrase(22, "bn"))

        assertEquals("Morning", BanglaFormatter.getTimeOfDayPhrase(8, "en"))
        assertEquals("Noon", BanglaFormatter.getTimeOfDayPhrase(13, "en"))
        assertEquals("Afternoon", BanglaFormatter.getTimeOfDayPhrase(16, "en"))
        assertEquals("Evening", BanglaFormatter.getTimeOfDayPhrase(19, "en"))
        assertEquals("Night", BanglaFormatter.getTimeOfDayPhrase(22, "en"))
    }
}
