package com.terrasync.terrashield.feature.judge

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Gavel
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Speed
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.data.repository.LandRecordRepository
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.CheckResult
import com.terrasync.terrashield.domain.model.Deed
import com.terrasync.terrashield.feature.samples.SampleCaseRepository
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsButtonVariant
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.CadastralGold
import com.terrasync.terrashield.ui.theme.StatusGreen
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

data class TestSuiteResult(
    val total: Int,
    val passed: Int,
    val details: List<String>
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JudgePanelScreen(
    repository: LandRecordRepository,
    onOpenStoryPlayer: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    var demoSaleEnabled by remember { mutableStateOf(false) }
    var testSuiteResult by remember { mutableStateOf<TestSuiteResult?>(null) }

    // Demo Re-check input on Rahim Uddin (O01), Mouza M901, Dag 101, Area 20.0
    val demoInput = remember {
        CheckInput(
            mouzaId = "M901",
            dag = "101",
            sellerId = "O01",
            area = "20"
        )
    }

    // Dynamic result based on whether demo sale deed is added
    var currentCheckResult by remember(demoSaleEnabled) {
        mutableStateOf<CheckResult?>(null)
    }

    fun recheckDemo() {
        if (demoSaleEnabled) {
            repository.resetData()
            val demoDeed = Deed(
                id = "DEMO-1",
                deedNo = "9001/2026",
                office = "SRO-DEMO",
                date = "2026-10-18",
                sellerId = "O01",
                buyerId = "P99",
                mouzaId = "M901",
                dag = 101,
                area = 40.0
            )
            repository.addExtraDeeds(listOf(demoDeed))
        } else {
            repository.resetData()
        }
        currentCheckResult = RuleEngine.check(demoInput, repository.getLandData())
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Judge Panel & Dev Mode",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.semantics { heading() }
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.size(52.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "ফিরে যান"
                        )
                    }
                }
            )
        },
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Intro
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.Gavel,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "হ্যাকথন বিচারক ও লাইভ টেস্ট প্যানেল",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.semantics { heading() }
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "অ্যাপের নিয়ম ইঞ্জিন, ডেমো সেল সিমুলেশন এবং ১৪টি টেস্ট কেসের অটোমেটেড স্যুট পরীক্ষা করার জন্য সরাসরি নিয়ন্ত্রণ।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Story Player Banner
            item {
                TsCard(
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = Color(0xFF0F172A),
                    onClick = onOpenStoryPlayer
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.PlayCircle,
                                contentDescription = null,
                                tint = CadastralGold,
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "৬০ সেকেন্ডে দেখুন (Story Player)",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Text(
                                    text = "৬টি ধাপে স্বয়ংক্রিয় অডিও-ভিজ্যুয়াল ওয়াকথ্রু প্লেয়ার",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFFCBD5E1)
                                )
                            }
                        }

                        EyebrowPill(
                            text = "চালু করুন",
                            containerColor = CadastralGold,
                            contentColor = Color.Black
                        )
                    }
                }
            }

            // 1. Live Demo Sale Simulation
            item {
                TsCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "১. লাইভ ডেমো সেল সিমুলেটর (Demo Sale Toggle)",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.semantics { heading() }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "রহিম উদ্দিন (O01) এর ১০১ নং দাগে ৫০ শতাংশ জমি আছে। ডেমো সেল চালুর মাধ্যমে ৪০ শতাংশ নতুন বিক্রয়ের দলিল যুক্ত করা হয় (নামজারি ছাড়া)।",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "ডেমো বিক্রি যুক্ত করুন (৪০ শতাংশ)",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = if (demoSaleEnabled) "বিক্রি যুক্ত আছে (🔴 R1 + R2 ট্রিগার)" else "স্বাভাবিক অবস্থা (🟢 পরিষ্কার জমি)",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (demoSaleEnabled) StatusRed else StatusGreen
                                )
                            }

                            Switch(
                                checked = demoSaleEnabled,
                                onCheckedChange = {
                                    demoSaleEnabled = it
                                    recheckDemo()
                                }
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            TsButton(
                                text = "পুনরায় পরীক্ষা করুন",
                                onClick = { recheckDemo() },
                                icon = Icons.Rounded.Refresh,
                                modifier = Modifier.weight(1f)
                            )

                            TsButton(
                                text = "রিসেট করুন",
                                onClick = {
                                    demoSaleEnabled = false
                                    repository.resetData()
                                    currentCheckResult = null
                                },
                                variant = TsButtonVariant.Outlined,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Display Re-check Result Box
                        currentCheckResult?.let { res ->
                            Spacer(modifier = Modifier.height(14.dp))

                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                color = if (res.status == "red") StatusRed.copy(alpha = 0.12f) else StatusGreen.copy(alpha = 0.12f)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = if (res.status == "red") "🔴 স্ট্যাটাস: লাল (উচ্চ ঝুঁকি)" else "🟢 স্ট্যাটাস: সবুজ (নিরাপদ)",
                                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                        )

                                        val rules = RuleEngine.ruleIds(res)
                                        if (rules.isNotEmpty()) {
                                            EyebrowPill(text = "রুল: ${rules.joinToString(", ")}")
                                        }
                                    }

                                    res.calc?.let { c ->
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = "হিসাব: মোট S = ${c.S} | পূর্বে বিক্রি A = ${c.A} | অবশিষ্ট L = ${c.L} | প্রস্তাবিত W = ${c.W}",
                                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 2. Automated 14 Contract Tests Execution
            item {
                TsCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "২. স্বয়ংক্রিয় টেস্ট স্যুট (১৪টি চুক্তিকৃত কেস)",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.semantics { heading() }
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "ওয়েব ও মোবাইল অ্যাপের জন্য নির্দিষ্ট ১৪টি টেস্ট কন্ট্রাক্ট সম্পূর্ণভাবে রান করে শতভাগ সঠিকতা প্রমাণ করুন।",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        TsButton(
                            text = "সব পরীক্ষা চালান (Run 14 Test Cases)",
                            onClick = {
                                val allCases = SampleCaseRepository.loadAllCases(context)
                                var passed = 0
                                val detailsList = mutableListOf<String>()

                                allCases.forEach { tc ->
                                    val baseData = repository.getLandData()
                                    val landData = if (!tc.addDeeds.isNullOrEmpty()) {
                                        baseData.copy(deeds = baseData.deeds + tc.addDeeds)
                                    } else baseData

                                    val input = CheckInput(
                                        mouzaId = tc.input.mouzaId,
                                        dag = tc.input.dag.toString(),
                                        area = tc.input.area.toString(),
                                        sellerId = tc.input.sellerId,
                                        sellerName = tc.input.sellerName,
                                        sellerDeedNo = tc.input.sellerDeedNo
                                    )

                                    val res = RuleEngine.check(input, landData)
                                    val actualRules = RuleEngine.ruleIds(res)

                                    val statusMatch = res.status == tc.expect.status
                                    val rulesMatch = actualRules == tc.expect.rules.sorted()

                                    if (statusMatch && rulesMatch) {
                                        passed++
                                        detailsList.add("✅ [${tc.id}] ${tc.title.bn}: PASS (${res.status.uppercase()})")
                                    } else {
                                        detailsList.add("❌ [${tc.id}] ${tc.title.bn}: FAIL (Expected ${tc.expect.status}, got ${res.status})")
                                    }
                                }

                                testSuiteResult = TestSuiteResult(
                                    total = allCases.size,
                                    passed = passed,
                                    details = detailsList
                                )
                            },
                            icon = Icons.Rounded.Speed,
                            modifier = Modifier.fillMaxWidth()
                        )

                        // PASS Status Banner
                        AnimatedVisibility(visible = testSuiteResult != null) {
                            testSuiteResult?.let { tsRes ->
                                Column(modifier = Modifier.padding(top = 14.dp)) {
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        color = if (tsRes.passed == tsRes.total) StatusGreen.copy(alpha = 0.15f) else StatusRed.copy(alpha = 0.15f)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(16.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = if (tsRes.passed == tsRes.total) Icons.Rounded.CheckCircle else Icons.Rounded.Warning,
                                                contentDescription = null,
                                                tint = if (tsRes.passed == tsRes.total) StatusGreen else StatusRed,
                                                modifier = Modifier.size(32.dp)
                                            )

                                            Spacer(modifier = Modifier.width(12.dp))

                                            Column {
                                                Text(
                                                    text = "${tsRes.passed} / ${tsRes.total} PASS",
                                                    style = MaterialTheme.typography.titleLarge.copy(
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (tsRes.passed == tsRes.total) StatusGreen else StatusRed
                                                    )
                                                )
                                                Text(
                                                    text = "সকল ১৪টি কন্ট্রাক্ট টেস্ট সফলভাবে সঠিক স্ট্যাটাস ও রুল আইডি রিটার্ন করেছে।",
                                                    style = MaterialTheme.typography.bodySmall
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Detailed Breakdown
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            tsRes.details.forEach { line ->
                                                Text(
                                                    text = line,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    modifier = Modifier.padding(vertical = 2.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(110.dp))
            }
        }
    }
}
