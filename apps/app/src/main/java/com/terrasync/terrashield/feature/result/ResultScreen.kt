package com.terrasync.terrashield.feature.result

import android.speech.tts.TextToSpeech
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.VolumeUp
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.PictureAsPdf
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Stop
import androidx.compose.material.icons.rounded.VolumeUp
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.domain.model.CalcSummary
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.CheckResult
import com.terrasync.terrashield.domain.model.Finding
import com.terrasync.terrashield.domain.model.LandData
import com.terrasync.terrashield.domain.model.RiskLevel
import com.terrasync.terrashield.feature.report.PdfReportGenerator
import com.terrasync.terrashield.ui.components.RiskBadge
import com.terrasync.terrashield.ui.components.TagSim
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsButtonVariant
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.StatusYellowContainer
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultScreen(
    input: CheckInput,
    result: CheckResult,
    landData: LandData,
    onBack: () -> Unit,
    onNavigateToEvidence: () -> Unit,
    onNavigateToHistory: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    var tts: TextToSpeech? by remember { mutableStateOf(null) }
    var isSpeaking by remember { mutableStateOf(false) }

    val isEnglish = BanglaFormatter.isEnglish()

    val mouza = landData.locations.mouzas.find { it.id == input.mouzaId }
    val mouzaName = mouza?.name?.text(isEnglish) ?: input.mouzaId

    LaunchedEffect(Unit) {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("bn", "BD")
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            tts?.stop()
            tts?.shutdown()
        }
    }

    fun toggleSpeech() {
        if (isSpeaking) {
            tts?.stop()
            isSpeaking = false
        } else {
            val spokenText = buildSpokenSummary(result, mouzaName, input)
            tts?.speak(spokenText, TextToSpeech.QUEUE_FLUSH, null, "ResultTTS")
            isSpeaking = true
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isEnglish) "Verification Report" else "যাচাই ফলাফল প্রতিবেদন",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = if (isEnglish) "$mouzaName · Dag No. ${BanglaFormatter.toBanglaDigits(input.dag, "en")}" else "$mouzaName · দাগ নং ${BanglaFormatter.toBanglaDigits(input.dag)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = if (isEnglish) "Back" else "ফিরে যান"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { toggleSpeech() }) {
                        Icon(
                            imageVector = if (isSpeaking) Icons.Rounded.Stop else Icons.AutoMirrored.Rounded.VolumeUp,
                            contentDescription = if (isEnglish) "Listen" else "শুনুন",
                            tint = if (isSpeaking) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                TagSim()
            }

            // 1. Status Gradient Card
            item {
                StatusGradientCard(resultStatus = result.status)
            }

            // 2. Template-based Summary
            item {
                TsCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (isEnglish) "Summary:" else "সংক্ষেপে:",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = buildTextSummary(result, mouzaName, input, isEnglish),
                            style = MaterialTheme.typography.bodyMedium,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // 3. Area Bar Visualization (if calc is available)
            result.calc?.let { calc ->
                item {
                    AreaBarCard(calc = calc)
                }
            }

            // 4. Action Buttons (History, Report, Evidence)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TsButton(
                        text = if (isEnglish) "Land History" else "জমির ইতিহাস",
                        onClick = onNavigateToHistory,
                        icon = Icons.Rounded.History,
                        variant = TsButtonVariant.Secondary,
                        modifier = Modifier.weight(1f)
                    )

                    TsButton(
                        text = if (isEnglish) "View Evidence" else "প্রমাণ দেখুন",
                        onClick = onNavigateToEvidence,
                        icon = Icons.Rounded.Search,
                        variant = TsButtonVariant.Secondary,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                TsButton(
                    text = if (isEnglish) "Share PDF Report" else "পিডিএফ রিপোর্ট শেয়ার করুন",
                    onClick = {
                        val pdfFile = PdfReportGenerator.generateReport(context, input, result, landData)
                        pdfFile?.let { PdfReportGenerator.shareReportPdf(context, it) }
                    },
                    icon = Icons.Rounded.Share,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // 5. Findings Section
            item {
                Text(
                    text = if (isEnglish) "Observations & Rule Tests (${BanglaFormatter.toBanglaDigits(result.findings.size, "en")}):" else "পর্যবেক্ষণ ও নিয়ম পরীক্ষা (${BanglaFormatter.toBanglaDigits(result.findings.size)} টি):",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (result.findings.isEmpty()) {
                item {
                    TsCard(modifier = Modifier.fillMaxWidth()) {
                        Box(
                            modifier = Modifier.padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (isEnglish) "No mismatch or risk found in sample records. Land records appear clean." else "নমুনা রেকর্ডে কোনো অসঙ্গতি বা ঝুঁকি পাওয়া যায়নি। জমিটির রেকর্ড স্বাভাবিক রয়েছে।",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            } else {
                items(result.findings) { finding ->
                    FindingCard(
                        finding = finding,
                        onViewEvidence = onNavigateToEvidence
                    )
                }
            }

            // 6. Bottom Exact Disclaimer
            item {
                ExactDisclaimerCard()
            }

            item {
                Spacer(modifier = Modifier.height(110.dp))
            }
        }
    }
}

@Composable
private fun StatusGradientCard(resultStatus: String) {
    val isEnglish = BanglaFormatter.isEnglish()

    val (brush, title, subtitle, icon) = when (resultStatus) {
        "red" -> Quadruple(
            Brush.horizontalGradient(listOf(Color(0xFFDC2626), Color(0xFF7F1D1D))),
            if (isEnglish) "High Risk Identified" else "ঝুঁকি চিহ্নিত",
            if (isEnglish) "Serious record mismatch or over-selling risk found in sample records." else "নমুনা রেকর্ডে গুরুতর অসঙ্গতি বা অতিরিক্ত বিক্রয়ের ঝুঁকি পাওয়া গেছে।",
            Icons.Rounded.ErrorOutline
        )
        "yellow" -> Quadruple(
            Brush.horizontalGradient(listOf(Color(0xFFD97706), Color(0xFF78350F))),
            if (isEnglish) "Caution Required" else "সতর্কতা প্রয়োজন",
            if (isEnglish) "Incomplete records or items needing further verification found." else "নমুনা রেকর্ডে কিছু অসম্পূর্ণতা বা যাচাইযোগ্য তথ্য পাওয়া গেছে।",
            Icons.Rounded.Warning
        )
        "green" -> Quadruple(
            Brush.horizontalGradient(listOf(Color(0xFF16A34A), Color(0xFF14532D))),
            if (isEnglish) "Records Match Cleanly" else "রেকর্ড ঠিক আছে",
            if (isEnglish) "Seller's khatian share matches proposed land area in sample records." else "নমুনা রেকর্ড অনুযায়ী বিক্রেতার খতিয়ান ও অংশের সাথে হিসাব মিলেছে।",
            Icons.Rounded.CheckCircle
        )
        else -> Quadruple(
            Brush.horizontalGradient(listOf(Color(0xFF64748B), Color(0xFF334155))),
            if (isEnglish) "Land Record Not Found" else "তথ্য পাওয়া যায়নি",
            if (isEnglish) "The specified plot is not registered in our sample database." else "প্রদত্ত মৌজা ও দাগ নম্বরটি আমাদের নমুনা ডাটাবেসে নিবন্ধিত নেই।",
            Icons.Rounded.Info
        )
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(brush)
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                modifier = Modifier.size(52.dp),
                shape = CircleShape,
                color = Color.White.copy(alpha = 0.2f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium.copy(color = Color.White.copy(alpha = 0.9f))
                )
            }
        }
    }
}

@Composable
private fun AreaBarCard(calc: CalcSummary) {
    val isEnglish = BanglaFormatter.isEnglish()

    TsCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = if (isEnglish) "Land Area Calculation Breakdown (Decimals):" else "জমির পরিমাণের হিসাব (শতাংশে):",
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = if (isEnglish) "Total Khatian Share (S):" else "মোট খতিয়ান অংশ (S):", style = MaterialTheme.typography.bodyMedium)
                Text(
                    text = if (isEnglish) "${BanglaFormatter.toBanglaDigits(calc.S, "en")} decimals" else "${BanglaFormatter.toBanglaDigits(calc.S)} শতাংশ",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = if (isEnglish) "Sold Share (A):" else "বিক্রিত অংশ (A):", style = MaterialTheme.typography.bodyMedium)
                Text(
                    text = if (isEnglish) "${BanglaFormatter.toBanglaDigits(calc.A, "en")} decimals" else "${BanglaFormatter.toBanglaDigits(calc.A)} শতাংশ",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = if (isEnglish) "Remaining Share (L = S - A):" else "অবশিষ্ট অংশ (L = S - A):", style = MaterialTheme.typography.bodyMedium)
                Text(
                    text = if (isEnglish) "${BanglaFormatter.toBanglaDigits(calc.L, "en")} decimals" else "${BanglaFormatter.toBanglaDigits(calc.L)} শতাংশ",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (calc.L < 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                    )
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = if (isEnglish) "Proposed Purchase (W):" else "কিনতে চাওয়া জমি (W):", style = MaterialTheme.typography.bodyMedium)
                Text(
                    text = if (isEnglish) "${BanglaFormatter.toBanglaDigits(calc.W, "en")} decimals" else "${BanglaFormatter.toBanglaDigits(calc.W)} শতাংশ",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (calc.W > calc.L + 0.01) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary
                    )
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Visual bar
            val maxVal = maxOf(calc.S, calc.W, 1.0)
            val lProgress = ((calc.L / maxVal).toFloat()).coerceIn(0f, 1f)

            Text(
                text = if (isEnglish) "Remaining (L) vs Proposed (W) Comparison:" else "অবশিষ্ট (L) বনাম কিনতে চাওয়া (W) তুলনা:",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(4.dp))

            LinearProgressIndicator(
                progress = { lProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(CircleShape),
                color = if (calc.W > calc.L + 0.01) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.primaryContainer
            )
        }
    }
}

@Composable
private fun FindingCard(
    finding: Finding,
    onViewEvidence: () -> Unit
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val riskLevel = RiskLevel.fromString(finding.level)

    TsCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = finding.rule,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    RiskBadge(riskLevel = riskLevel)
                }

                OutlinedButton(
                    onClick = onViewEvidence,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(text = if (isEnglish) "View Evidence" else "প্রমাণ দেখুন", style = MaterialTheme.typography.labelSmall)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = getPlainBanglaEvidence(finding, isEnglish),
                style = MaterialTheme.typography.bodyMedium,
                lineHeight = 20.sp
            )
        }
    }
}

@Composable
private fun ExactDisclaimerCard() {
    val isEnglish = BanglaFormatter.isEnglish()

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = StatusYellowContainer,
        contentColor = Color(0xFF78350F)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Rounded.Warning,
                contentDescription = null,
                tint = Color(0xFF78350F),
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = if (isEnglish) "This result is an advisory warning based solely on sample data. It is not legal verification or proof of ownership. Consult the land office and a lawyer before purchasing land." else "এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা। এটি আইনি যাচাই বা মালিকানার প্রমাণ নয়। জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।",
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF78350F),
                    lineHeight = 18.sp
                )
            )
        }
    }
}

private fun buildTextSummary(result: CheckResult, mouzaName: String, input: CheckInput, isEnglish: Boolean = false): String {
    val dagDisplay = BanglaFormatter.toBanglaDigits(input.dag, if (isEnglish) "en" else "bn")
    val areaDisplay = BanglaFormatter.toBanglaDigits(input.area, if (isEnglish) "en" else "bn")
    val sellerDisplay = input.sellerName ?: result.seller?.name ?: if (isEnglish) "Selected Seller" else "নির্বাচিত বিক্রেতা"

    if (isEnglish) {
        return when (result.status) {
            "green" -> "No record mismatch found for buying $areaDisplay decimals of land in Dag No. $dagDisplay of $mouzaName mouza from seller $sellerDisplay."
            "yellow" -> "For buying $areaDisplay decimals in Dag No. $dagDisplay of $mouzaName mouza, ${result.findings.size} item(s) require further verification."
            "red" -> "Serious mismatch or over-selling risk found for seller $sellerDisplay in Dag No. $dagDisplay of $mouzaName mouza."
            else -> "Dag No. $dagDisplay of $mouzaName mouza was not found in our sample records."
        }
    }

    return when (result.status) {
        "green" -> "$mouzaName মৌজার $dagDisplay নং দাগের $areaDisplay শতাংশ জমি বিক্রেতা $sellerDisplay এর নিকট হতে ক্রয়ের জন্য কোনো রেকর্ড অমিল পাওয়া যায়নি।"
        "yellow" -> "$mouzaName মৌজার $dagDisplay নং দাগে $areaDisplay শতাংশ জমির লেনদেনে ${result.findings.size} টি বিষয় আরও সাবধানে পরীক্ষা বা যাচাই করা প্রয়োজন।"
        "red" -> "$mouzaName মৌজার $dagDisplay নং দাগে বিক্রেতা $sellerDisplay এর রেকর্ড ও বিক্রি অংশের মধ্যে গুরুতর অসঙ্গতি বা অতিরিক্ত বিক্রয়ের ঝুঁকি পাওয়া গেছে।"
        else -> "$mouzaName মৌজার $dagDisplay নং দাগটি আমাদের নমুনা সার্ভার রেকর্ডে পাওয়া যায়নি।"
    }
}

private fun buildSpokenSummary(result: CheckResult, mouzaName: String, input: CheckInput, isEnglish: Boolean = false): String {
    val dagDisplay = BanglaFormatter.toBanglaDigits(input.dag, if (isEnglish) "en" else "bn")
    if (isEnglish) {
        val statusText = when (result.status) {
            "red" -> "Risk Identified"
            "yellow" -> "Caution Required"
            "green" -> "All Records Verified"
            else -> "Record Not Found"
        }
        return "Land check result for Dag No. $dagDisplay in $mouzaName mouza: $statusText. Total ${result.findings.size} observation(s)."
    }

    val statusText = when (result.status) {
        "red" -> "ঝুঁকি চিহ্নিত হয়েছে"
        "yellow" -> "সতর্কতা প্রয়োজন"
        "green" -> "সব রেকর্ড ঠিক আছে"
        else -> "নমুনা তথ্যে পাওয়া যায়নি"
    }
    return "$mouzaName মৌজার $dagDisplay নম্বর দাগের জমি যাচাই ফলাফল: $statusText। মোট ${result.findings.size} টি পর্যবেক্ষণ রয়েছে।"
}

private fun getPlainBanglaEvidence(finding: Finding, isEnglish: Boolean = false): String {
    val ev = finding.evidence?.jsonObject

    if (isEnglish) {
        return when (finding.rule) {
            "R1" -> "Seller sold land via sub-registry deed after khatian publication date which is not yet mutated."
            "R2" -> {
                val L = ev?.get("L")?.jsonPrimitive?.contentOrNull ?: ""
                val W = ev?.get("W")?.jsonPrimitive?.contentOrNull ?: ""
                "Seller has ${BanglaFormatter.toBanglaDigits(L, "en")} decimals remaining in khatian, but attempts to sell ${BanglaFormatter.toBanglaDigits(W, "en")} decimals."
            }
            "R3" -> "Seller's name is missing from the owner list in the latest BS khatian for this plot."
            "R4" -> "Seller has already sold more land than his total khatian share."
            "R5" -> "An e-Mutation application by another person is currently pending on this plot."
            "R6" -> "Total ownership shares in the khatian exceed the actual plot area."
            "R7a" -> "Sub-registry records indicate seller sold the land before acquiring it."
            "R7b" -> "Land was resold within 90 days in the sub-registry office (rapid resale)."
            "R8a" -> "Seller's deed number was not found in sample sub-registry registers."
            "R8b" -> "Mismatch found between seller's deed details and sub-registry volume records."
            "R8c" -> "Multiple deeds with the same number and year exist in sub-registry registers."
            else -> "Rule verification observation."
        }
    }

    return when (finding.rule) {
        "R1" -> "খতিয়ান প্রকাশের পর বিক্রেতা এই দাগে সাব-রেজিস্ট্রি দলিলে জমি বিক্রি করেছেন যা এখনও ই-নামজারিতে অন্তর্ভুক্ত হয়নি।"
        "R2" -> {
            val L = ev?.get("L")?.jsonPrimitive?.contentOrNull ?: ""
            val W = ev?.get("W")?.jsonPrimitive?.contentOrNull ?: ""
            "বিক্রেতার খতিয়ান অনুযায়ী অবশিষ্ট জমি রয়েছে ${BanglaFormatter.toBanglaDigits(L)} শতাংশ, কিন্তু তিনি ${BanglaFormatter.toBanglaDigits(W)} শতাংশ জমি বিক্রি করতে চাচ্ছেন।"
        }
        "R3" -> "বিক্রেতার নাম এই দাগের সর্বশেষ বিএস খতিয়ানের মূল মালিকের তালিকায় পাওয়া যায়নি।"
        "R4" -> "বিক্রেতা ইতোমধ্যে তার মোট খতিয়ান অংশের চেয়েও বেশি জমি সাব-রেজিস্ট্রি দলিলে বিক্রি করে ফেলেছেন।"
        "R5" -> "এই দাগের ওপর অন্য এক ব্যক্তির ই-নামজারি (মিউটেশন) আবেদন বর্তমানে প্রক্রিয়াধীন অবস্থায় আছে।"
        "R6" -> "সর্বশেষ খতিয়ানে অন্তর্ভুক্ত সব মালিকদের মোট অংশের যোগফল দাগের প্রকৃত জমির চেয়ে বেশি।"
        "R7a" -> "বিক্রেতা সাব-রেজিস্ট্রি রেকর্ডে জমিটি অর্জনের নির্ধারিত তারিখের আগেই বিক্রি করে দিয়েছেন।"
        "R7b" -> "জমিটি সাম্প্রতিক ৯০ দিনের মধ্যে সাব-রেজিস্ট্রি অফিসে হাতবদল হয়েছে (দ্রুত পুনর্বিক্রয়)।"
        "R8a" -> "বিক্রেতার দেওয়া সাবেক দলিল নম্বরটি আমাদের নমুনা রেজিস্ট্রি বালামে পাওয়া যায়নি।"
        "R8b" -> "বিক্রেতার সাবেক দলিলের নাম, দাগ বা পরিমাণের তথ্যের সাথে বালাম বহির তথ্যের গরমিল রয়েছে।"
        "R8c" -> "রেজিস্ট্রি বালাম বহিতে একই নম্বর ও সালের একাধিক দলিল সংরক্ষিত আছে।"
        else -> "নিয়ম পরীক্ষা পর্যবেক্ষণ।"
    }
}

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
