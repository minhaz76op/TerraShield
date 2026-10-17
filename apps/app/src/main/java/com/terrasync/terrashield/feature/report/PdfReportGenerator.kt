package com.terrasync.terrashield.feature.report

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import androidx.core.content.FileProvider
import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.CheckResult
import com.terrasync.terrashield.domain.model.LandData
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PdfReportGenerator {

    fun generateReport(
        context: Context,
        input: CheckInput,
        result: CheckResult,
        landData: LandData
    ): File? {
        return runCatching {
            val pdfDocument = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // Standard A4 (pt)
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas

            drawWatermark(canvas)
            drawContent(canvas, input, result, landData)

            pdfDocument.finishPage(page)

            val outputDir = File(context.cacheDir, "reports")
            if (!outputDir.exists()) {
                outputDir.mkdirs()
            }
            val fileName = "TerraShield_Report_${input.dag}_${System.currentTimeMillis()}.pdf"
            val file = File(outputDir, fileName)

            FileOutputStream(file).use { out ->
                pdfDocument.writeTo(out)
            }
            pdfDocument.close()
            file
        }.getOrNull()
    }

    private fun drawWatermark(canvas: Canvas) {
        val paint = Paint().apply {
            color = Color.argb(35, 180, 180, 180)
            textSize = 38f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        canvas.save()
        canvas.rotate(-30f, 297f, 421f)
        canvas.drawText("নমুনা — আইনি দলিল নয়", 100f, 400f, paint)
        canvas.drawText("DEMO — NOT A LEGAL DOCUMENT", 40f, 460f, paint)
        canvas.restore()
    }

    private fun drawContent(
        canvas: Canvas,
        input: CheckInput,
        result: CheckResult,
        landData: LandData
    ) {
        val isEnglish = BanglaFormatter.isEnglish()

        val titlePaint = Paint().apply {
            color = Color.rgb(27, 94, 32) // Forest Green
            textSize = 22f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val subTitlePaint = Paint().apply {
            color = Color.rgb(71, 85, 105)
            textSize = 12f
            isAntiAlias = true
        }

        val headingPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 14f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val bodyPaint = Paint().apply {
            color = Color.rgb(30, 41, 59)
            textSize = 11f
            isAntiAlias = true
        }

        val monoPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 11f
            typeface = Typeface.MONOSPACE
            isAntiAlias = true
        }

        var y = 50f

        // Header
        val headerTitle = if (isEnglish) "TerraShield — Land Record Verification Report" else "TerraShield — জমির রেকর্ড যাচাই প্রতিবেদন"
        canvas.drawText(headerTitle, 40f, y, titlePaint)
        y += 20f

        val nowStr = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.US).format(Date())
        val generatedAt = if (isEnglish) "Generated At: $nowStr | Demo Environment" else "প্রস্তুতের সময়: ${BanglaFormatter.toBanglaDigits(nowStr)} | ডেমো পরিবেশ"
        canvas.drawText(generatedAt, 40f, y, subTitlePaint)
        y += 25f

        // Divider
        val linePaint = Paint().apply {
            color = Color.rgb(203, 213, 225)
            strokeWidth = 1f
        }
        canvas.drawLine(40f, y, 555f, y, linePaint)
        y += 20f

        // Input Parameters Box
        val sec1 = if (isEnglish) "1. Application Input Details:" else "১. আবেদনের প্রাথমিক তথ্য:"
        canvas.drawText(sec1, 40f, y, headingPaint)
        y += 18f

        val mouza = landData.locations.mouzas.find { it.id == input.mouzaId }
        val mouzaName = mouza?.name?.text(isEnglish) ?: input.mouzaId

        val mouzaLine = if (isEnglish) "• Mouza: $mouzaName (J.L. ${mouza?.jl ?: ""})" else "• মৌজা: $mouzaName (${BanglaFormatter.toBanglaDigits(mouza?.jl ?: "")})"
        canvas.drawText(mouzaLine, 55f, y, bodyPaint)
        y += 16f

        val dagLine = if (isEnglish) "• Plot / Dag No: ${BanglaFormatter.toBanglaDigits(input.dag, "en")}" else "• দাগ নম্বর: ${BanglaFormatter.toBanglaDigits(input.dag)}"
        canvas.drawText(dagLine, 55f, y, bodyPaint)
        y += 16f

        val sellerDisplay = input.sellerName ?: result.seller?.name ?: if (isEnglish) "Selected Seller" else "মালিকানার তালিকায় নির্বাচিত"
        val sellerLine = if (isEnglish) "• Seller Name: $sellerDisplay" else "• বিক্রেতার নাম: $sellerDisplay"
        canvas.drawText(sellerLine, 55f, y, bodyPaint)
        y += 16f

        val areaLine = if (isEnglish) "• Land Area: ${BanglaFormatter.toBanglaDigits(input.area, "en")} decimals" else "• জমির পরিমাণ: ${BanglaFormatter.toBanglaDigits(input.area)} শতাংশ"
        canvas.drawText(areaLine, 55f, y, bodyPaint)
        y += 16f

        if (!input.sellerDeedNo.isNullOrBlank()) {
            val deedLine = if (isEnglish) "• Seller's Deed No: ${BanglaFormatter.toBanglaDigits(input.sellerDeedNo, "en")}" else "• সাবেক দলিল নম্বর: ${BanglaFormatter.toBanglaDigits(input.sellerDeedNo)}"
            canvas.drawText(deedLine, 55f, y, bodyPaint)
            y += 16f
        }
        y += 10f

        // Overall Status
        val sec2 = if (isEnglish) "2. Automated Verification Results:" else "২. স্বযংক্রিয় যাচাই ফলাফল:"
        canvas.drawText(sec2, 40f, y, headingPaint)
        y += 20f

        val statusText = if (isEnglish) {
            when (result.status) {
                "red" -> "High Risk Identified"
                "yellow" -> "Caution Required"
                "green" -> "Records Match Cleanly"
                else -> "Record Not Found"
            }
        } else {
            when (result.status) {
                "red" -> "ঝুঁকি চিহ্নিত (উচ্চ ঝুঁকি)"
                "yellow" -> "সতর্কতা প্রয়োজন (মাঝারি ঝুঁকি)"
                "green" -> "রেকর্ড ঠিক আছে (পরিষ্কার জমি)"
                else -> "নমুনা রেকর্ডে পাওয়া যায়নি"
            }
        }

        val statusBgColor = when (result.status) {
            "red" -> Color.rgb(254, 226, 226)
            "yellow" -> Color.rgb(254, 243, 199)
            "green" -> Color.rgb(220, 252, 231)
            else -> Color.rgb(243, 244, 246)
        }
        val statusTextColor = when (result.status) {
            "red" -> Color.rgb(153, 27, 27)
            "yellow" -> Color.rgb(146, 64, 14)
            "green" -> Color.rgb(22, 101, 52)
            else -> Color.rgb(55, 65, 81)
        }

        val bgPaint = Paint().apply { color = statusBgColor }
        canvas.drawRect(40f, y - 14f, 555f, y + 16f, bgPaint)

        val statusPaint = Paint().apply {
            color = statusTextColor
            textSize = 13f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        val resultLine = if (isEnglish) "Status: $statusText" else "ফলাফল: $statusText"
        canvas.drawText(resultLine, 50f, y + 2f, statusPaint)
        y += 35f

        // Calculation Summary if available
        result.calc?.let { calc ->
            val sec3 = if (isEnglish) "3. Land Area Calculation (Decimals):" else "৩. জমির পরিমাণের হিসাব (শতাংশে):"
            canvas.drawText(sec3, 40f, y, headingPaint)
            y += 18f
            val lineS = if (isEnglish) "• Total Khatian Share (S): ${BanglaFormatter.toBanglaDigits(calc.S, "en")} decimals" else "• বিক্রেতার মোট খতিয়ান অংশ (S): ${BanglaFormatter.toBanglaDigits(calc.S)} শতাংশ"
            canvas.drawText(lineS, 55f, y, bodyPaint)
            y += 16f
            val lineA = if (isEnglish) "• Past Sold Land (A): ${BanglaFormatter.toBanglaDigits(calc.A, "en")} decimals" else "• রেকর্ড পরবর্তী বিক্রিত জমি (A): ${BanglaFormatter.toBanglaDigits(calc.A)} শতাংশ"
            canvas.drawText(lineA, 55f, y, bodyPaint)
            y += 16f
            val lineL = if (isEnglish) "• Remaining Land (L = S - A): ${BanglaFormatter.toBanglaDigits(calc.L, "en")} decimals" else "• বিক্রেতার অবশিন্ট জমি (L = S - A): ${BanglaFormatter.toBanglaDigits(calc.L)} শতাংশ"
            canvas.drawText(lineL, 55f, y, bodyPaint)
            y += 16f
            val lineW = if (isEnglish) "• Proposed Purchase (W): ${BanglaFormatter.toBanglaDigits(calc.W, "en")} decimals" else "• কিনতে চাওয়া জমি (W): ${BanglaFormatter.toBanglaDigits(calc.W)} শতাংশ"
            canvas.drawText(lineW, 55f, y, bodyPaint)
            y += 24f
        }

        // Findings
        val sec4 = if (isEnglish) "4. Rule Findings & Observations (${result.findings.size}):" else "৪. চিহ্নিত নিয়ম পরীক্ষা ও পর্যবেক্ষণ (${result.findings.size} টি):"
        canvas.drawText(sec4, 40f, y, headingPaint)
        y += 20f

        if (result.findings.isEmpty()) {
            val emptyMsg = if (isEnglish) "• No mismatch or risk found in sample records." else "• কোনো অসঙ্গতি বা ঝুঁকি পাওয়া যায়নি।"
            canvas.drawText(emptyMsg, 55f, y, bodyPaint)
            y += 20f
        } else {
            result.findings.forEach { finding ->
                val levelLabel = when (finding.level) {
                    "high" -> if (isEnglish) "[HIGH RISK 🔴]" else "[উচ্চ ঝুঁকি 🔴]"
                    "medium" -> if (isEnglish) "[MEDIUM RISK 🟡]" else "[মাঝারি ঝুঁকি 🟡]"
                    else -> if (isEnglish) "[INFO 🔵]" else "[তথ্য 🔵]"
                }
                val ruleDesc = getRuleSummary(finding.rule, isEnglish)
                canvas.drawText("${finding.rule} $levelLabel", 55f, y, monoPaint)
                y += 14f
                canvas.drawText("   $ruleDesc", 55f, y, bodyPaint)
                y += 18f
            }
        }

        y += 15f
        canvas.drawLine(40f, y, 555f, y, linePaint)
        y += 20f

        // Disclaimer
        val disclaimerBg = Paint().apply { color = Color.rgb(254, 243, 199) }
        canvas.drawRect(40f, y, 555f, y + 55f, disclaimerBg)

        val disclaimerPaint = Paint().apply {
            color = Color.rgb(120, 53, 15)
            textSize = 9.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val disclaimerText1 = if (isEnglish) "WARNING: This report is an advisory warning based on sample data." else "সতর্কবার্তা: এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা।"
        val disclaimerText2 = if (isEnglish) "It is not legal verification or proof of title. Consult land office and lawyer before buying." else "এটি আইনি যাচাই বা মালিকানার প্রমাণ নয়। জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।"

        canvas.drawText(disclaimerText1, 50f, y + 20f, disclaimerPaint)
        canvas.drawText(disclaimerText2, 50f, y + 38f, disclaimerPaint)
    }

    private fun getRuleSummary(ruleId: String, isEnglish: Boolean = false): String {
        if (isEnglish) {
            return when (ruleId) {
                "R1" -> "Unmutated sales deed exists after khatian publication date."
                "R2" -> "Proposed selling area exceeds seller's remaining khatian share."
                "R3" -> "Seller's name is missing from the khatian owner list."
                "R4" -> "Seller has already sold more land than total khatian share."
                "R5" -> "Pending e-Mutation application by another applicant on this plot."
                "R6" -> "Sum of khatian ownership shares exceeds total plot area."
                "R7a" -> "Seller sold land before the official acquisition date."
                "R7b" -> "Land resold within 90 days (rapid resale)."
                "R8a" -> "Specified acquisition deed number not found in registers."
                "R8b" -> "Deed details mismatch with sub-registry volume records."
                "R8c" -> "Multiple deeds with same number and year in registers."
                else -> "Rule verification observation."
            }
        }
        return when (ruleId) {
            "R1" -> "রেকর্ড তারিখের পর জমি বিক্রি হয়েছে যা মিউটেশন (নামজারি) হয়নি।"
            "R2" -> "বিক্রেতার অবশিষ্ট অবশিষ্ট থাকা জমির চেয়ে বেশি জমি বিক্রি করা হচ্ছে।"
            "R3" -> "বিক্রেতার নাম খতিয়ানের মূল মালিক তালিকায় অনুপস্থিত।"
            "R4" -> "বিক্রেতা ইতোমধ্যে তার মোট অংশের চেয়ে বেশি জমি বিক্রি করেছেন।"
            "R5" -> "অন্য ব্যক্তির ই-নামজারি আবেদন চলমান রয়েছে।"
            "R6" -> "খতিয়ানের মালিকদের মোট অংশের যোগফল দাগের জমির চেয়ে বেশি।"
            "R7a" -> "বিক্রেতা অর্জনের আগের তারিখে জমি বিক্রি দেখিয়েছেন।"
            "R7b" -> "জমিটি সম্প্রতি (৯০ দিনের মধ্যে) দ্রুত হাতবদল হয়েছে।"
            "R8a" -> "প্রদত্ত সাব-রেজিস্ট্রি দলিল নম্বরটি পাওয়া যায়নি।"
            "R8b" -> "সাবেক দলিলের তথ্যের সাথে রেজিস্ট্রি খাতার তথ্যে গরমিল আছে।"
            "R8c" -> "একই নম্বর ও সালের একাধিক দলিল রেজিস্ট্রারে রয়েছে।"
            else -> "নিয়ম পরীক্ষা পর্যবেক্ষণ।"
        }
    }

    fun shareReportPdf(context: Context, pdfFile: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            pdfFile
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        val chooser = Intent.createChooser(intent, "রিপোর্ট শেয়ার করুন")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }
}
