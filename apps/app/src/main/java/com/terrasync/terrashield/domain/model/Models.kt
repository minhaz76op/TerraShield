package com.terrasync.terrashield.domain.model

import androidx.compose.runtime.Immutable
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Immutable
@Serializable
data class LocalizedText(
    val bn: String = "",
    val en: String = ""
) {
    fun text(isEnglish: Boolean = false): String {
        return if (isEnglish && en.isNotBlank()) en else bn
    }

    fun text(lang: String): String {
        val isEng = lang.lowercase().startsWith("en")
        return text(isEng)
    }
}

@Immutable
@Serializable
data class District(
    val id: String = "",
    val name: LocalizedText = LocalizedText()
)

@Immutable
@Serializable
data class Upazila(
    val id: String = "",
    val name: LocalizedText = LocalizedText()
)

@Immutable
@Serializable
data class SubRegistryOffice(
    val id: String = "",
    val name: LocalizedText = LocalizedText()
)

@Immutable
@Serializable
data class Mouza(
    val id: String = "",
    val jl: Int = 0,
    val name: LocalizedText = LocalizedText()
)

@Immutable
@Serializable
data class LocationsData(
    val district: District = District(),
    val upazila: Upazila = Upazila(),
    val subRegistryOffice: SubRegistryOffice = SubRegistryOffice(),
    val mouzas: List<Mouza> = emptyList()
)

@Immutable
@Serializable
data class Plot(
    val mouzaId: String = "",
    val dag: Int = 0,
    val totalArea: Double = 0.0
)

@Immutable
@Serializable
data class PlotsData(
    val plots: List<Plot> = emptyList()
)

@Immutable
@Serializable
data class KhatianOwner(
    val personId: String = "",
    val share: Double = 0.0
)

@Immutable
@Serializable
data class Khatian(
    val khatianNo: String = "",
    val mouzaId: String = "",
    val dag: Int = 0,
    val survey: String = "",
    val recordDate: String = "",
    val owners: List<KhatianOwner> = emptyList()
)

@Immutable
@Serializable
data class KhatiansData(
    val khatians: List<Khatian> = emptyList()
)

@Immutable
@Serializable
data class Deed(
    val id: String = "",
    val deedNo: String = "",
    val office: String = "",
    val date: String = "",
    val sellerId: String = "",
    val buyerId: String = "",
    val mouzaId: String = "",
    val dag: Int = 0,
    val area: Double = 0.0
)

@Immutable
@Serializable
data class DeedsData(
    val deeds: List<Deed> = emptyList()
)

@Immutable
@Serializable
data class Namjari(
    val caseNo: String = "",
    val mouzaId: String = "",
    val dag: Int = 0,
    val applicantId: String = "",
    val basis: String = "",
    val deedId: String? = null,
    val status: String = "",
    val date: String = ""
)

@Immutable
@Serializable
data class NamjariData(
    val namjari: List<Namjari> = emptyList()
)

@Immutable
@Serializable
data class Person(
    val id: String = "",
    val name: LocalizedText = LocalizedText()
)

@Immutable
@Serializable
data class PeopleData(
    val people: List<Person> = emptyList()
)

enum class RiskLevel(val value: String, val rank: Int) {
    HIGH("high", 3),
    MEDIUM("medium", 2),
    INFO("info", 1);

    companion object {
        fun fromString(s: String): RiskLevel = when (s.lowercase()) {
            "high" -> HIGH
            "medium" -> MEDIUM
            "info" -> INFO
            else -> INFO
        }
    }
}

enum class OverallStatus(val value: String) {
    RED("red"),
    YELLOW("yellow"),
    GREEN("green"),
    GREY("grey"),
    INVALID("invalid")
}

@Immutable
@Serializable
data class Finding(
    val rule: String,
    val level: String,
    val evidence: JsonElement? = null
)

@Immutable
@Serializable
data class CheckInput(
    val mouzaId: String = "",
    val dag: String = "",
    val area: String = "",
    val sellerId: String? = null,
    val sellerName: String? = null,
    val sellerDeedNo: String? = null
)

@Immutable
@Serializable
data class CalcSummary(
    val S: Double,
    val A: Double,
    val L: Double,
    val W: Double
)

@Immutable
@Serializable
data class SellerInfo(
    val id: String? = null,
    val name: String? = null,
    val inKhatian: Boolean = false
)

@Immutable
@Serializable
data class InputError(
    val field: String,
    val code: String,
    val params: Map<String, Double>? = null
)

@Immutable
@Serializable
data class CheckResult(
    val status: String,
    val plot: Plot? = null,
    val khatian: Khatian? = null,
    val seller: SellerInfo? = null,
    val findings: List<Finding> = emptyList(),
    val calc: CalcSummary? = null,
    val skipped: List<String> = emptyList(),
    val errors: List<InputError> = emptyList()
)

@Immutable
@Serializable
data class AreaUnit(
    val id: String,
    val sqft: Double,
    val regional: Boolean = false,
    val note: String? = null
)

@Immutable
@Serializable
data class UnitsData(
    val areaUnits: List<AreaUnit> = emptyList(),
    val shareTotalUnits: List<String> = emptyList()
)

@Immutable
data class LandData(
    val locations: LocationsData = LocationsData(),
    val plots: List<Plot> = emptyList(),
    val khatians: List<Khatian> = emptyList(),
    val deeds: List<Deed> = emptyList(),
    val namjari: List<Namjari> = emptyList(),
    val people: List<Person> = emptyList()
)
