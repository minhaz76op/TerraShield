package com.terrasync.terrashield.feature.samples

import android.content.Context
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.Deed
import com.terrasync.terrashield.domain.model.LocalizedText
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class SampleCaseInput(
    val mouzaId: String = "",
    val dag: Int = 0,
    val sellerId: String? = null,
    val sellerName: String? = null,
    val area: Double = 0.0,
    val sellerDeedNo: String? = null
) {
    fun toCheckInput(): CheckInput {
        return CheckInput(
            mouzaId = mouzaId,
            dag = dag.toString(),
            area = area.toString(),
            sellerId = sellerId,
            sellerName = sellerName,
            sellerDeedNo = sellerDeedNo
        )
    }
}

@Serializable
data class SampleCaseExpect(
    val status: String = "green",
    val rules: List<String> = emptyList()
)

@Serializable
data class SampleCase(
    val id: String,
    val sample: Boolean = true,
    val level: String = "green",
    val title: LocalizedText = LocalizedText(),
    val story: LocalizedText = LocalizedText(),
    val addDeeds: List<Deed>? = null,
    val input: SampleCaseInput,
    val expect: SampleCaseExpect
)

@Serializable
private data class SampleCasesContainer(
    val cases: List<SampleCase> = emptyList()
)

object SampleCaseRepository {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    fun loadAllCases(context: Context): List<SampleCase> {
        return try {
            val jsonString = context.assets.open("config/test-cases.json").bufferedReader().use { it.readText() }
            val container = json.decodeFromString<SampleCasesContainer>(jsonString)
            container.cases
        } catch (e: Exception) {
            emptyList()
        }
    }
}
