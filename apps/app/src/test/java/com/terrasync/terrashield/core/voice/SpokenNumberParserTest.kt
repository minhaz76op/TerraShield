package com.terrasync.terrashield.core.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SpokenNumberParserTest {

    @Test
    fun testSpokenNumberParserDigits() {
        assertEquals(103.0, SpokenNumberParser.parseSpokenNumber("১০৩")!!, 1e-6)
        assertEquals(103.0, SpokenNumberParser.parseSpokenNumber("103")!!, 1e-6)
        assertEquals(103.0, SpokenNumberParser.parseSpokenNumber("এক শূন্য তিন")!!, 1e-6)
        assertEquals(103.0, SpokenNumberParser.parseSpokenNumber("one zero three")!!, 1e-6)
    }

    @Test
    fun testSpokenNumberParserWords() {
        assertEquals(103.0, SpokenNumberParser.parseSpokenNumber("একশো তিন")!!, 1e-6)
        assertEquals(103.0, SpokenNumberParser.parseSpokenNumber("one hundred three")!!, 1e-6)
        assertEquals(12.5, SpokenNumberParser.parseSpokenNumber("সাড়ে বারো")!!, 1e-6)
        assertEquals(12.5, SpokenNumberParser.parseSpokenNumber("twelve point five")!!, 1e-6)
    }

    @Test
    fun testInvalidSpokenNumber() {
        assertNull(SpokenNumberParser.parseSpokenNumber(""))
        assertNull(SpokenNumberParser.parseSpokenNumber("hello world"))
    }
}
