package com.terrasync.terrashield.feature.calculator

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.automirrored.rounded.MenuBook
import androidx.compose.material.icons.rounded.Calculate
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.CheckBox
import androidx.compose.material.icons.rounded.CheckBoxOutlineBlank
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.terrasync.terrashield.core.calc.LandCalculator
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.CadastralGold
import com.terrasync.terrashield.ui.theme.MonoStyle
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalculatorGuideScreen(
    onSendToVerifyForm: (areaDecimalStr: String) -> Unit,
    modifier: Modifier = Modifier
) {
    val isEnglish = BanglaFormatter.isEnglish()
    var selectedTabIndex by remember { mutableStateOf(0) }
    val tabs = listOf(
        Triple(if (isEnglish) "Share Calculator" else "হিস্যা ক্যালকুলেটর", Icons.Rounded.Calculate, 0),
        Triple(if (isEnglish) "Unit Converter" else "একক রূপান্তর", Icons.Rounded.SwapHoriz, 1),
        Triple(if (isEnglish) "Land Guide" else "ভূমি নির্দেশিকা", Icons.AutoMirrored.Rounded.MenuBook, 2)
    )

    Column(modifier = modifier.fillMaxSize()) {
        Surface(
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(modifier = Modifier.statusBarsPadding()) {
                PrimaryTabRow(selectedTabIndex = selectedTabIndex) {
                    tabs.forEach { (title, icon, index) ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = title,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                }
                            }
                        )
                    }
                }
            }
        }

        Box(modifier = Modifier.weight(1f)) {
            when (selectedTabIndex) {
                0 -> ShareCalculatorTab(onSendToVerifyForm = onSendToVerifyForm)
                1 -> UnitConverterTab()
                2 -> GuideTab()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun ShareCalculatorTab(onSendToVerifyForm: (String) -> Unit) {
    var totalAreaInput by remember { mutableStateOf("50") }
    var shareInput by remember { mutableStateOf("1/3") }
    var selectedUnit by remember { mutableStateOf("decimal") }

    val calcResult = remember(totalAreaInput, shareInput, selectedUnit) {
        LandCalculator.shareArea(
            totalText = totalAreaInput,
            totalUnit = selectedUnit,
            shareText = shareInput
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "জমির হিস্যা ও অংশ হিসাব",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "দাগের মোট জমি এবং খতিয়ানের অংশ/আনা ইনপুট দিয়ে নিজের প্রাপ্য শতক বের করুন।",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Inputs
        item {
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "১. দাগের মোট জমির পরিমাণ:",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = totalAreaInput,
                        onValueChange = { totalAreaInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("মোট জমি (যেমন: ৫০)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "২. বিক্রয়/প্রাপ্ত অংশ (হিস্যা):",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = shareInput,
                        onValueChange = { shareInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("অংশ / ভগ্নাংশ / আনা / % (যেমন: 1/3, 0.33, 25%)") },
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Quick Picks
                    Text(
                        text = "দ্রুত অপশন (Quick Picks):",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    val quickPicks = listOf(
                        "1/2" to "১/২ (৮ আনা)",
                        "1/3" to "১/৩",
                        "1/4" to "১/৪ (৪ আনা)",
                        "1/8" to "১/৮ (২ আনা)",
                        "1/16" to "১/১৬ (১ আনা)",
                        "1.0" to "সম্পূর্ণ (১৬ আনা)"
                    )

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        quickPicks.forEach { (valStr, labelStr) ->
                            Surface(
                                onClick = { shareInput = valStr },
                                shape = RoundedCornerShape(20.dp),
                                color = if (shareInput == valStr) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Text(
                                    text = labelStr,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = if (shareInput == valStr) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                    ),
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Live Result Display
        item {
            TsCard(
                modifier = Modifier.fillMaxWidth(),
                containerColor = if (calcResult.ok) Color(0xFFF0FDF4) else Color(0xFFFEF2F2),
                borderColor = if (calcResult.ok) Color(0xFFBBF7D0) else Color(0xFFFECACA)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "হিসাবের ফলাফল (Live Result):",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (calcResult.ok) Color(0xFF166534) else Color(0xFF991B1B)
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    if (calcResult.ok) {
                        val formattedDecimal = LandCalculator.round(calcResult.areaDecimal)
                        val banglaArea = BanglaFormatter.toBanglaDigits(formattedDecimal)

                        Text(
                            text = "$banglaArea শতাংশ (Decimal)",
                            style = MaterialTheme.typography.displayMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "মোট দাগ ${BanglaFormatter.toBanglaDigits(LandCalculator.round(calcResult.totalDecimal))} শতক × অংশ ${BanglaFormatter.toBanglaDigits(LandCalculator.round(calcResult.share * 100))}%",
                            style = MonoStyle.copy(fontSize = 12.sp),
                            color = Color(0xFF15803D)
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        TsButton(
                            text = "যাচাই ফর্মে নিন",
                            onClick = { onSendToVerifyForm(formattedDecimal) },
                            icon = Icons.AutoMirrored.Rounded.ArrowForward,
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        Text(
                            text = "ইনপুট সঠিকভাবে দিন (যেমন: মোট ৫০, অংশ ১/৩)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFF991B1B)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun UnitConverterTab() {
    var amountInput by remember { mutableStateOf("10") }
    var fromUnitId by remember { mutableStateOf("decimal") }

    val convResult = remember(amountInput, fromUnitId) {
        LandCalculator.convert(amountInput, fromUnitId)
    }

    val units = listOf(
        "decimal" to "শতাংশ / শতক",
        "katha" to "কাঠা",
        "bigha" to "বিঘা",
        "acre" to "একর",
        "sqft" to "বর্গফুট",
        "sqm" to "বর্গমিটার"
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "জমির পরিমাপের একক রূপান্তর",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "শতাংশ, কাঠা, বিঘা, একর, বর্গফুট ও বর্গমিটারের তাৎক্ষণিক রূপান্তর।",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "পরিমাণ ও প্রারম্ভিক একক:",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = amountInput,
                            onValueChange = { amountInput = it },
                            modifier = Modifier.weight(1f),
                            label = { Text("পরিমাণ") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true
                        )

                        // Unit Selector Chips
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "একক নির্বাচন:",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            units.take(3).forEach { (id, label) ->
                                Surface(
                                    onClick = { fromUnitId = id },
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (fromUnitId == id) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 2.dp)
                                ) {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelMedium.copy(
                                            color = if (fromUnitId == id) Color.White else MaterialTheme.colorScheme.onSurface
                                        ),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Conversion Table
        if (convResult.ok) {
            item {
                TsCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "সমতুল্য পরিমাপ তালিকা:",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        convResult.rows.forEach { row ->
                            val unitLabel = units.find { it.first == row.id }?.second ?: row.id
                            val valBn = BanglaFormatter.toBanglaDigits(LandCalculator.round(row.value))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = unitLabel,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    if (row.regional) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        EyebrowPill(
                                            text = "এলাকাভেদে ভিন্ন",
                                            containerColor = StatusYellowContainer,
                                            contentColor = Color(0xFF78350F)
                                        )
                                    }
                                }

                                Text(
                                    text = "$valBn $unitLabel",
                                    style = MonoStyle.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }

        // Regional & Mathematical Disclaimer
        item {
            TsCard(
                modifier = Modifier.fillMaxWidth(),
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Warning,
                        contentDescription = null,
                        tint = CadastralGold,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "সতর্কবার্তা ও দ্রষ্টব্য:",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "১. ঢাকায় ১ কাঠা = ৭২০ বর্গফুট (১.৬৫ শতাংশ প্রায়)। কিন্তু আঞ্চলিক বিধা/কাঠা ভিন্ন হতে পারে।\n২. এটি গাণিতিক হিসাব মাত্র, প্রাতিষ্ঠানিক বা আমিনিক সীমানা জরিপ নয়।",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(110.dp))
        }
    }
}

@Composable
private fun GuideTab() {
    val checklistState = remember { mutableStateListOf(false, false, false, false, false, false, false) }

    val checklistItems = listOf(
        "১. বিএস ও বায়া খতিয়ানে বিক্রিয়াকারীর নাম ও অংশের শতভাগ সঠিকতা পরীক্ষা করা হয়েছে।",
        "২. ভূমিতে সরজমিনে গিয়ে প্রস্তাবিত জমি ও সীমানা দখলদারদের সাথে কথা বলে যাচাই করা হয়েছে।",
        "৩. সাম্প্রতিক সাব-রেজিস্ট্রি দলিলের সার্টিফাইড কপি ও বায়া দলিলের ধারাবাহিকতা দেখা হয়েছে।",
        "৪. সহকারী কমিশনার (ভূমি) অফিস থেকে নামজারি খতিয়ান ও ডি সি আর আসল কিনা নিশ্চিত করা হয়েছে।",
        "৫. জমিটি সরকারি খাস, অর্পিত সম্পত্তি বা একয়ারভুক্ত কিনা তহসিলদার থেকে জানা হয়েছে।",
        "৬. নাবালক বা যৌথ ওয়ারিশদের স্বত্ব সংক্রান্ত বিজ্ঞ আইনজীবীর মতামত (Legal Opinion) নেওয়া হয়েছে।",
        "৭. বায়না করার আগে রেজিস্ট্রি অফিসের মূল বালাম বই এ সার্চিং সম্পন্ন করা হয়েছে।"
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Text(
                text = "ভূমি কেনাবেচা সহায়িকা ও গাইড",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "খতিয়ান, দাগ, নামজারি ও সাব-রেজিস্ট্রি দলিলের দরকারি পরিভাষা ও সচেতনতামূলক গাইড।",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Section 1: Basic Terms Explained
        item {
            Text(
                text = "১. মৌলিক চার পরিভাষা:",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(8.dp))

            val terms = listOf(
                Pair("খতিয়ান (Khatian)", "মালিকানার প্রাতিষ্ঠানিক রেকর্ডপত্র। জরিপ অনুযায়ী সিএস, এসএ, আরএস ও বিএস খতিয়ানে জমির মালিকদের নাম, অংশ ও দাগ নম্বর থাকে।"),
                Pair("দাগ নম্বর (Dag)", "মৌজা মানচিত্রে নির্দিষ্ট একখণ্ড জমির জন্য দেওয়া স্বতন্ত্র পরিচিতি নম্বর।"),
                Pair("দলিল (Deed)", "সাব-রেজিস্ট্রি অফিসে জমি কেনাবেচা বা হস্তান্তরের রেজিস্ট্রিকৃত আইনি চুক্তিপত্র।"),
                Pair("নামজারি (Namjari / Mutation)", "পূর্বের মালিকের নাম কেটে এসিল্যান্ড কর্তৃক সরকারি রেকর্ডে নতুন মালিকের নাম অন্তর্ভুক্ত করার প্রক্রিয়া।")
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                terms.forEach { (t, d) ->
                    TsCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = t,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = d,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        // Section 2: 7 Step Buying Workflow
        item {
            Text(
                text = "২. জমি কেনার ৭টি প্রধান ধাপ:",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(8.dp))

            val steps = listOf(
                "১. খতিয়ান ও রেকর্ড পরীক্ষা" to "সিএস থেকে বিএস খতিয়ানের ধারাবাহিকতা দেখা।",
                "২. সরজমিন পরিদর্শেন" to "জমির বাস্তৱ সীমানা ও দখল চাক্ষুষ করা।",
                "৩. রেজিস্ট্রি সার্চিং" to "সাব-রেজিস্ট্রি অফিসে বালাম সার্চ করা।",
                "৪. বায়না চুক্তি করা" to "নির্দিষ্ট মেয়াদের বায়না করা ও প্রমাণ রাখা।",
                "৫. রেজিস্ট্রি ও সাফ-কবলা" to "সরকারি ফি জমা দিয়ে দলিল সম্পাদন।",
                "৬. নামজারি খতিয়ান খোলা" to "এসিল্যান্ড অফিসে নামজারি সম্পন্ন করা।",
                "৭. খতিয়ান ও খাজনা রসিদ" to "নিয়মিত সরকারি ভূমি উন্নয়ন কর পরিশোধ।"
            )

            steps.forEach { (st, sd) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Check,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = st,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = sd,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Section 3: Interactive Buying Checklist
        item {
            TsCard(
                modifier = Modifier.fillMaxWidth(),
                containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
                borderColor = MaterialTheme.colorScheme.primary
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "৩. জমি কেনাকাটা ইন্টারেক্টিভ চেকলিস্ট",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        val completedCount = checklistState.count { it }
                        EyebrowPill(text = "$completedCount / 7 সম্পন্ন")
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    checklistItems.forEachIndexed { index, itemText ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { checklistState[index] = !checklistState[index] }
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Checkbox(
                                checked = checklistState[index],
                                onCheckedChange = { checklistState[index] = it },
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = itemText,
                                style = MaterialTheme.typography.bodySmall,
                                color = if (checklistState[index]) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }
    }
}
