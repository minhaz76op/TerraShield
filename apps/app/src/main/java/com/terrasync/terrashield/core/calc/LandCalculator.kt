package com.terrasync.terrashield.core.calc

import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.domain.model.AreaUnit
import com.terrasync.terrashield.domain.model.UnitsData
import kotlin.math.min

object LandCalculator {

    const val MAX_AMOUNT = 1e9

    val DEFAULT_UNITS = listOf(
        AreaUnit("decimal", 435.6, false, "1 decimal (shatangsho / shotok) = 1/100 acre"),
        AreaUnit("acre", 43560.0, false, "1 acre = 100 decimal"),
        AreaUnit("sqft", 1.0, false, null),
        AreaUnit("sqm", 10.763910416709722, false, "1 sq ft = 0.09290304 sq m exactly"),
        AreaUnit("katha", 720.0, true, "Common standard (720 sq ft ≈ 1.65 decimal)."),
        AreaUnit("bigha", 14400.0, true, "Common standard (20 katha ≈ 33 decimal).")
    )

    fun clean(text: String?): String {
        if (text.isNullOrEmpty()) return ""
        val digits = RuleEngine.normalizeDigits(text)
        return digits.replace(Regex("[\\s,]"), "")
    }

    sealed class ParseAmountResult {
        data class Success(val value: Double) : ParseAmountResult()
        data class Error(val code: String) : ParseAmountResult()
    }

    fun parseAmount(text: String?): ParseAmountResult {
        val s = clean(text)
        if (s.isEmpty()) return ParseAmountResult.Error("empty")
        if (!Regex("^-?(\\d+(\\.\\d*)?|\\.\\d+)$").matches(s)) return ParseAmountResult.Error("notNumber")
        val v = s.toDoubleOrNull() ?: return ParseAmountResult.Error("notNumber")
        if (v <= 0) return ParseAmountResult.Error("notPositive")
        if (v > MAX_AMOUNT) return ParseAmountResult.Error("tooLarge")
        return ParseAmountResult.Success(v)
    }

    sealed class ShareKind {
        object Decimal : ShareKind()
        data class Fraction(val num: Double, val den: Double) : ShareKind()
        data class Percent(val percent: Double) : ShareKind()
    }

    sealed class ParseShareResult {
        data class Success(val value: Double, val kind: ShareKind) : ParseShareResult()
        data class Error(val code: String) : ParseShareResult()
    }

    fun parseShare(text: String?): ParseShareResult {
        val s = clean(text).replace("％", "%")
        if (s.isEmpty()) return ParseShareResult.Error("empty")

        var value: Double
        val kind: ShareKind

        val fracMatch = Regex("^(\\d+(?:\\.\\d+)?)/(\\d+(?:\\.\\d+)?)$").find(s)
        val percMatch = Regex("^(\\d+(?:\\.\\d*)?|\\.\\d+)%$").find(s)

        if (fracMatch != null) {
            val num = fracMatch.groupValues[1].toDoubleOrNull() ?: return ParseShareResult.Error("notNumber")
            val den = fracMatch.groupValues[2].toDoubleOrNull() ?: return ParseShareResult.Error("notNumber")
            if (den == 0.0) return ParseShareResult.Error("zeroDen")
            value = num / den
            kind = ShareKind.Fraction(num, den)
        } else if (percMatch != null) {
            val p = percMatch.groupValues[1].toDoubleOrNull() ?: return ParseShareResult.Error("notNumber")
            value = p / 100.0
            kind = ShareKind.Percent(p)
        } else if (Regex("^(\\d+(\\.\\d*)?|\\.\\d+)$").matches(s)) {
            val v = s.toDoubleOrNull() ?: return ParseShareResult.Error("notNumber")
            value = v
            kind = ShareKind.Decimal
        } else if (s.startsWith("-")) {
            return ParseShareResult.Error("notPositive")
        } else {
            return ParseShareResult.Error("notNumber")
        }

        if (value <= 0) return ParseShareResult.Error("notPositive")
        if (value > 1.0 + 1e-9) return ParseShareResult.Error("overOne")

        return ParseShareResult.Success(value = min(value, 1.0), kind = kind)
    }

    data class ShareAreaResult(
        val ok: Boolean,
        val total: Double = 0.0,
        val totalUnit: String = "decimal",
        val totalDecimal: Double = 0.0,
        val share: Double = 0.0,
        val areaDecimal: Double = 0.0,
        val totalError: String? = null,
        val shareError: String? = null
    )

    fun shareArea(
        totalText: String?,
        totalUnit: String,
        shareText: String?,
        unitsData: UnitsData? = null
    ): ShareAreaResult {
        val totalRes = parseAmount(totalText)
        val shareRes = parseShare(shareText)

        var totalErr: String? = null
        var shareErr: String? = null

        val totalVal = when (totalRes) {
            is ParseAmountResult.Success -> totalRes.value
            is ParseAmountResult.Error -> {
                totalErr = totalRes.code
                0.0
            }
        }

        val (shareVal, _) = when (shareRes) {
            is ParseShareResult.Success -> Pair(shareRes.value, shareRes.kind)
            is ParseShareResult.Error -> {
                shareErr = shareRes.code
                Pair(0.0, ShareKind.Decimal)
            }
        }

        if (totalErr != null || shareErr != null) {
            return ShareAreaResult(
                ok = false,
                totalError = totalErr,
                shareError = shareErr
            )
        }

        val unitsList = unitsData?.areaUnits?.takeIf { it.isNotEmpty() } ?: DEFAULT_UNITS
        val byId = unitsList.associateBy { it.id }

        val decimalSqft = byId["decimal"]?.sqft ?: 435.6
        val unitSqft = byId[totalUnit]?.sqft ?: decimalSqft

        val totalDecimal = totalVal * unitSqft / decimalSqft
        val areaDecimal = totalDecimal * shareVal

        return ShareAreaResult(
            ok = true,
            total = totalVal,
            totalUnit = totalUnit,
            totalDecimal = totalDecimal,
            share = shareVal,
            areaDecimal = areaDecimal
        )
    }

    data class ConvertRow(
        val id: String,
        val value: Double,
        val regional: Boolean
    )

    data class ConvertResult(
        val ok: Boolean,
        val value: Double = 0.0,
        val fromId: String = "decimal",
        val sqft: Double = 0.0,
        val rows: List<ConvertRow> = emptyList(),
        val error: String? = null
    )

    fun convert(text: String?, fromId: String, unitsData: UnitsData? = null): ConvertResult {
        val amountRes = parseAmount(text)
        if (amountRes is ParseAmountResult.Error) {
            return ConvertResult(ok = false, error = amountRes.code)
        }

        val amount = (amountRes as ParseAmountResult.Success).value
        val unitsList = unitsData?.areaUnits?.takeIf { it.isNotEmpty() } ?: DEFAULT_UNITS
        val byId = unitsList.associateBy { it.id }

        val fromUnit = byId[fromId] ?: byId["decimal"] ?: DEFAULT_UNITS.first()
        val totalSqft = amount * fromUnit.sqft

        val rows = unitsList.map { u ->
            ConvertRow(
                id = u.id,
                value = totalSqft / u.sqft,
                regional = u.regional
            )
        }

        return ConvertResult(
            ok = true,
            value = amount,
            fromId = fromUnit.id,
            sqft = totalSqft,
            rows = rows
        )
    }

    fun round(v: Double): String {
        if (!v.isFinite()) return ""
        val dp = when {
            v >= 100.0 -> 2
            v >= 1.0 -> 2
            v >= 0.01 -> 4
            else -> 6
        }
        val formatted = String.format(java.util.Locale.US, "%.${dp}f", v)
        return formatted.replace(Regex("0+$"), "").replace(Regex("\\.$"), "")
    }
}
