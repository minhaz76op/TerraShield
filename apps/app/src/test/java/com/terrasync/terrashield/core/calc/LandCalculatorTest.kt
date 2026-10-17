package com.terrasync.terrashield.core.calc

import org.junit.Assert.*
import org.junit.Test

private typealias LandShareSuccess = LandCalculator.ParseShareResult.Success

class LandCalculatorTest {

    @Test
    fun testParseAmount() {
        val res1 = LandCalculator.parseAmount("১২.৫")
        assertTrue(res1 is LandCalculator.ParseAmountResult.Success)
        assertEquals(12.5, (res1 as LandCalculator.ParseAmountResult.Success).value, 1e-6)

        val res2 = LandCalculator.parseAmount("-5")
        assertTrue(res2 is LandCalculator.ParseAmountResult.Error)
        assertEquals("notPositive", (res2 as LandCalculator.ParseAmountResult.Error).code)
    }

    @Test
    fun testParseShare() {
        val frac = LandCalculator.parseShare("১/৩")
        assertTrue(frac is LandShareSuccess)
        assertEquals(1.0 / 3.0, (frac as LandShareSuccess).value, 1e-4)

        val perc = LandCalculator.parseShare("২৫%")
        assertTrue(perc is LandShareSuccess)
        assertEquals(0.25, (perc as LandShareSuccess).value, 1e-6)

        val dec = LandCalculator.parseShare("০.২৫")
        assertTrue(dec is LandCalculator.ParseShareResult.Success)
        assertEquals(0.25, (dec as LandCalculator.ParseShareResult.Success).value, 1e-6)
    }

    @Test
    fun testConvertUnits() {
        val res = LandCalculator.convert("10", "decimal")
        assertTrue(res.ok)
        assertEquals(4356.0, res.sqft, 0.1)

        val bighaRow = res.rows.find { it.id == "bigha" }
        assertNotNull(bighaRow)
        // 10 decimal = 4356 sqft / 14400 sqft per bigha = 0.3025 bigha
        assertEquals(0.3025, bighaRow!!.value, 0.001)
    }
}
