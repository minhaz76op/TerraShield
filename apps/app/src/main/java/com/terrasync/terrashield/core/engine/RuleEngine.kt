package com.terrasync.terrashield.core.engine

import com.terrasync.terrashield.domain.model.*
import kotlinx.serialization.json.*
import kotlin.math.round

object RuleEngine {

    const val TOLERANCE = 0.01
    const val QUICK_RESALE_DAYS = 90

    private val LEVEL_RANK = mapOf(
        "high" to 3,
        "medium" to 2,
        "info" to 1
    )

    // Convert Bangla digits (০-৯) to English digits (0-9).
    fun normalizeDigits(value: String?): String {
        if (value.isNullOrEmpty()) return ""
        val banglaDigits = "০১২৩৪৫৬৭৮৯"
        return value.map { ch ->
            val idx = banglaDigits.indexOf(ch)
            if (idx >= 0) ('0' + idx) else ch
        }.joinToString("")
    }

    // Read a number typed in Bangla or English digits.
    fun parseNumber(value: String?): Double? {
        val s = normalizeDigits(value).trim().replace(",", "")
        if (s.isEmpty() || !Regex("^-?\\d+(\\.\\d+)?$").matches(s)) return null
        return s.toDoubleOrNull()
    }

    // Deed numbers look like "0109/2010". "109/2010" and "০১০৯/২০১০" mean the same.
    fun normalizeDeedNo(value: String?): String? {
        val s = normalizeDigits(value).replace("\\s+".toRegex(), "")
        val match = Regex("^(\\d+)/(\\d{4})$").find(s) ?: return null
        val num = match.groupValues[1].toIntOrNull() ?: return null
        val year = match.groupValues[2]
        return "$num/$year"
    }

    fun round2(n: Double): Double = round(n * 100.0) / 100.0

    fun daysBetween(isoA: String, isoB: String): Int {
        return try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val dateA = sdf.parse(isoA)?.time ?: 0L
            val dateB = sdf.parse(isoB)?.time ?: 0L
            ((dateB - dateA) / 86400000L).toInt()
        } catch (_: Exception) {
            0
        }
    }

    fun findPlot(data: LandData, mouzaId: String, dag: Int): Plot? {
        return data.plots.find { it.mouzaId == mouzaId && it.dag == dag }
    }

    fun findKhatian(data: LandData, mouzaId: String, dag: Int): Khatian? {
        return data.khatians.find { it.mouzaId == mouzaId && it.dag == dag }
    }

    fun deedsOnDag(data: LandData, mouzaId: String, dag: Int): List<Deed> {
        return data.deeds.filter { it.mouzaId == mouzaId && it.dag == dag }
    }

    fun approvedNamjariFor(data: LandData, deedId: String): Namjari? {
        return data.namjari.find { it.deedId == deedId && it.status == "approved" }
    }

    data class CleanInput(
        val mouzaId: String,
        val dag: Int,
        val area: Double,
        val sellerId: String?,
        val sellerName: String?,
        val deedNo: String?
    )

    data class ValidationResult(
        val ok: Boolean,
        val errors: List<InputError>,
        val clean: CleanInput?
    )

    fun validateInput(input: CheckInput, data: LandData): ValidationResult {
        val errors = mutableListOf<InputError>()

        val dagText = normalizeDigits(input.dag).trim()
        var dag = -1
        if (dagText.isEmpty()) {
            errors.add(InputError(field = "dag", code = "dag_required"))
        } else if (!Regex("^\\d+$").matches(dagText)) {
            errors.add(InputError(field = "dag", code = "dag_digits"))
        } else {
            dag = dagText.toIntOrNull() ?: -1
            if (dag == -1) {
                errors.add(InputError(field = "dag", code = "dag_digits"))
            }
        }

        val areaText = normalizeDigits(input.area).trim()
        val area = parseNumber(input.area)
        if (areaText.isEmpty()) {
            errors.add(InputError(field = "area", code = "area_required"))
        } else if (area == null) {
            errors.add(InputError(field = "area", code = "area_number"))
        } else if (area <= 0) {
            errors.add(InputError(field = "area", code = "area_positive"))
        }

        if (input.mouzaId.isBlank()) {
            errors.add(InputError(field = "mouza", code = "mouza_required"))
        }

        val plot = if (dag != -1 && input.mouzaId.isNotBlank()) findPlot(data, input.mouzaId, dag) else null

        if (plot != null && area != null && area > plot.totalArea + TOLERANCE) {
            errors.add(InputError(field = "area", code = "area_too_big", params = mapOf("total" to plot.totalArea)))
        }

        if (plot != null && input.sellerId.isNullOrBlank() && input.sellerName.isNullOrBlank()) {
            errors.add(InputError(field = "seller", code = "seller_required"))
        }

        var deedNo: String? = null
        if (!input.sellerDeedNo.isNullOrBlank()) {
            deedNo = normalizeDeedNo(input.sellerDeedNo)
            if (deedNo == null) {
                errors.add(InputError(field = "deedNo", code = "deed_format"))
            }
        }

        val ok = errors.isEmpty()
        val clean = if (ok && area != null) {
            CleanInput(
                mouzaId = input.mouzaId,
                dag = dag,
                area = area,
                sellerId = input.sellerId.takeIf { !it.isNullOrBlank() },
                sellerName = input.sellerName?.trim().takeIf { !it.isNullOrBlank() },
                deedNo = deedNo
            )
        } else null

        return ValidationResult(ok = ok, errors = errors, clean = clean)
    }

    fun check(input: CheckInput, data: LandData): CheckResult {
        val v = validateInput(input, data)
        val skipped = mutableListOf<String>()

        val dagText = normalizeDigits(input.dag).trim()
        val dagInt = dagText.toIntOrNull() ?: -1

        val plot = if (dagInt != -1 && input.mouzaId.isNotBlank()) findPlot(data, input.mouzaId, dagInt) else null

        // Land not in sample records -> grey
        if (plot == null && v.errors.all { it.field != "dag" && it.field != "mouza" }) {
            return CheckResult(
                status = "grey",
                plot = null,
                khatian = null,
                seller = null,
                findings = emptyList()
            )
        }

        if (!v.ok || v.clean == null) {
            return CheckResult(
                status = "invalid",
                errors = v.errors
            )
        }

        val c = v.clean
        val khatian = findKhatian(data, c.mouzaId, c.dag)
        val findings = mutableListOf<Finding>()

        fun add(rule: String, level: String, evidence: JsonElement? = null) {
            findings.add(Finding(rule = rule, level = level, evidence = evidence))
        }

        val dagDeeds = deedsOnDag(data, c.mouzaId, c.dag).sortedBy { it.date }
        val owners = khatian?.owners ?: emptyList()
        val ownerEntry = if (c.sellerId != null) owners.find { it.personId == c.sellerId } else null

        var calcSummary: CalcSummary? = null

        /* R3 — seller not in the latest khatian */
        if (ownerEntry == null) {
            val evObj = buildJsonObject {
                c.sellerName?.let { put("sellerName", it) }
                c.sellerId?.let { put("sellerId", it) }
                khatian?.khatianNo?.let { put("khatianNo", it) }
            }
            add("R3", "high", evObj)
            skipped.add("area")
        } else {
            val S = ownerEntry.share
            val laterSales = dagDeeds.filter { it.sellerId == c.sellerId && it.date > (khatian?.recordDate ?: "") }
            val A = laterSales.sumOf { it.area }
            val L = S - A
            val W = c.area
            calcSummary = CalcSummary(
                S = round2(S),
                A = round2(A),
                L = round2(L),
                W = round2(W)
            )

            /* R1 — sold before (after khatian date) but namjari not approved */
            val notMutated = laterSales.filter { approvedNamjariFor(data, it.id) == null }
            if (notMutated.isNotEmpty()) {
                val evObj = buildJsonObject {
                    khatian?.khatianNo?.let { put("khatianNo", it) }
                    khatian?.recordDate?.let { put("khatianDate", it) }
                    put("share", S)
                }
                add("R1", "medium", evObj)
            }

            /* R2 — wants to buy more than is left */
            if (W > L + TOLERANCE) {
                val evObj = buildJsonObject {
                    put("S", round2(S))
                    put("A", round2(A))
                    put("L", round2(L))
                    put("W", round2(W))
                    put("over", round2(W - maxOf(L, 0.0)))
                }
                add("R2", "high", evObj)
            }

            /* R4 — already sold more than whole share */
            if (A > S + TOLERANCE) {
                val evObj = buildJsonObject {
                    put("S", round2(S))
                    put("A", round2(A))
                }
                add("R4", "high", evObj)
            }
        }

        /* R5 — someone else's namjari is pending on this dag */
        val pending = data.namjari.filter {
            it.mouzaId == c.mouzaId && it.dag == c.dag && it.status == "pending" && it.applicantId != c.sellerId
        }
        if (pending.isNotEmpty()) {
            add("R5", "medium")
        }

        /* R6 — khatian shares add up to more than plot total area */
        if (khatian != null && plot != null) {
            val totalShares = owners.sumOf { it.share }
            if (totalShares > plot.totalArea + TOLERANCE) {
                val evObj = buildJsonObject {
                    put("khatianNo", khatian.khatianNo)
                    put("totalShares", round2(totalShares))
                    put("plotArea", plot.totalArea)
                }
                add("R6", "medium", evObj)
            }
        }

        /* R7a — seller sold land before acquiring it */
        if (c.sellerId != null) {
            val acquired = dagDeeds.filter { it.buyerId == c.sellerId }
            if (acquired.isNotEmpty()) {
                val firstAcq = acquired.first()
                val early = dagDeeds.filter { it.sellerId == c.sellerId && it.date < firstAcq.date }
                if (early.isNotEmpty()) {
                    add("R7a", "high")
                }
            }
        }

        /* R7b — quick resale (0-90 days) anywhere in dag's history */
        dagDeeds.forEach { sale ->
            val buys = dagDeeds.filter { it.buyerId == sale.sellerId && it.date <= sale.date }
            if (buys.isNotEmpty()) {
                val lastBuy = buys.last()
                val days = daysBetween(lastBuy.date, sale.date)
                if (days in 0..QUICK_RESALE_DAYS) {
                    val evObj = buildJsonObject {
                        put("personId", sale.sellerId)
                        put("days", days)
                    }
                    add("R7b", "info", evObj)
                }
            }
        }

        /* R8 — seller's own deed number */
        if (c.deedNo != null) {
            val matches = data.deeds.filter { normalizeDeedNo(it.deedNo) == c.deedNo }
            if (matches.isEmpty()) {
                add("R8a", "medium")
            } else if (matches.size > 1) {
                add("R8c", "high")
            } else {
                val d = matches.first()
                val problems = mutableListOf<String>()
                if (d.buyerId != c.sellerId) problems.add("buyer")
                if (d.mouzaId != c.mouzaId || d.dag != c.dag) problems.add("dag")
                if (d.area + TOLERANCE < c.area) problems.add("area")
                if (problems.isNotEmpty()) {
                    add("R8b", "high")
                }
            }
        }

        /* Sort findings by level rank */
        findings.sortByDescending { LEVEL_RANK[it.level] ?: 0 }

        val status = when {
            findings.any { it.level == "high" } -> "red"
            findings.any { it.level == "medium" } -> "yellow"
            else -> "green"
        }

        return CheckResult(
            status = status,
            plot = plot,
            khatian = khatian,
            seller = SellerInfo(
                id = c.sellerId,
                name = c.sellerName,
                inKhatian = (ownerEntry != null)
            ),
            findings = findings,
            calc = calcSummary,
            skipped = skipped
        )
    }

    fun ruleIds(result: CheckResult): List<String> {
        return result.findings.map { it.rule }.distinct().sorted()
    }
}
