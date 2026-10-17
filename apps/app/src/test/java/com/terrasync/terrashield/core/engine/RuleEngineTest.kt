package com.terrasync.terrashield.core.engine

import com.terrasync.terrashield.data.repository.LandRecordRepositoryImpl
import com.terrasync.terrashield.domain.model.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.InputStreamReader

@Serializable
private data class TestCaseInput(
    val mouzaId: String = "",
    val dag: Int = 0,
    val sellerId: String? = null,
    val sellerName: String? = null,
    val area: Double = 0.0,
    val sellerDeedNo: String? = null
)

@Serializable
private data class TestCaseExpect(
    val status: String,
    val rules: List<String> = emptyList(),
    val calc: CalcSummary? = null
)

@Serializable
private data class TestCaseItem(
    val id: String,
    val sample: Boolean = false,
    val level: String = "",
    val addDeeds: List<Deed>? = null,
    val input: TestCaseInput,
    val expect: TestCaseExpect
)

@Serializable
private data class TestCasesContainer(
    val cases: List<TestCaseItem> = emptyList()
)

class RuleEngineTest {

    private lateinit var json: Json
    private lateinit var repository: LandRecordRepositoryImpl
    private lateinit var testCasesContainer: TestCasesContainer

    @Before
    fun setUp() {
        json = Json {
            ignoreUnknownKeys = true
            isLenient = true
        }

        repository = LandRecordRepositoryImpl.createFromResources { path ->
            val isStream = javaClass.classLoader?.getResourceAsStream(path)
                ?: throw IllegalArgumentException("Resource not found: $path")
            InputStreamReader(isStream, Charsets.UTF_8).use { it.readText() }
        }

        val testCasesStream = javaClass.classLoader?.getResourceAsStream("config/test-cases.json")
            ?: throw IllegalArgumentException("config/test-cases.json resource not found")
        val testCasesJsonStr = InputStreamReader(testCasesStream, Charsets.UTF_8).use { it.readText() }
        testCasesContainer = json.decodeFromString(testCasesJsonStr)
    }

    @Test
    fun testAll14SharedContractTestCases() {
        val cases = testCasesContainer.cases
        assertEquals("Should have 14 shared contract test cases", 14, cases.size)

        var passedCount = 0

        for (testCase in cases) {
            val baseData = repository.getLandData()
            val landData = if (!testCase.addDeeds.isNullOrEmpty()) {
                baseData.copy(deeds = baseData.deeds + testCase.addDeeds)
            } else {
                baseData
            }

            val checkInput = CheckInput(
                mouzaId = testCase.input.mouzaId,
                dag = testCase.input.dag.toString(),
                area = testCase.input.area.toString(),
                sellerId = testCase.input.sellerId,
                sellerName = testCase.input.sellerName,
                sellerDeedNo = testCase.input.sellerDeedNo
            )

            val result = RuleEngine.check(checkInput, landData)
            val actualRules = RuleEngine.ruleIds(result)

            assertEquals(
                "Case [${testCase.id}] status mismatch",
                testCase.expect.status,
                result.status
            )

            assertEquals(
                "Case [${testCase.id}] rules mismatch",
                testCase.expect.rules.sorted(),
                actualRules
            )

            if (testCase.expect.calc != null) {
                assertNotNull("Case [${testCase.id}] should have calc summary", result.calc)
                val expectedCalc = testCase.expect.calc
                val actualCalc = result.calc!!

                assertEquals("Case [${testCase.id}] S mismatch", expectedCalc.S, actualCalc.S, 0.01)
                assertEquals("Case [${testCase.id}] A mismatch", expectedCalc.A, actualCalc.A, 0.01)
                assertEquals("Case [${testCase.id}] L mismatch", expectedCalc.L, actualCalc.L, 0.01)
                assertEquals("Case [${testCase.id}] W mismatch", expectedCalc.W, actualCalc.W, 0.01)
            }

            passedCount++
        }

        assertEquals(14, passedCount)
    }

    @Test
    fun testDeedNumberNormalization() {
        assertEquals("109/2010", RuleEngine.normalizeDeedNo("0109/2010"))
        assertEquals("109/2010", RuleEngine.normalizeDeedNo("109/2010"))
        assertEquals("109/2010", RuleEngine.normalizeDeedNo("০১০৯/২০১০"))
        assertNull(RuleEngine.normalizeDeedNo("invalid_deed"))
    }

    @Test
    fun testBanglaDigitNormalization() {
        assertEquals("0123456789", RuleEngine.normalizeDigits("০১২৩৪৫৬৭৮৯"))
        assertEquals("103", RuleEngine.normalizeDigits("১০৩"))
    }
}
