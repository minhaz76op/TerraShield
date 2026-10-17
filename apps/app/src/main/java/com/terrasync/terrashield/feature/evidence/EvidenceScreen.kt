package com.terrasync.terrashield.feature.evidence

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Assignment
import androidx.compose.material.icons.automirrored.rounded.MenuBook
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.window.core.layout.WindowWidthSizeClass
import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.CheckResult
import com.terrasync.terrashield.domain.model.Deed
import com.terrasync.terrashield.domain.model.Khatian
import com.terrasync.terrashield.domain.model.LandData
import com.terrasync.terrashield.domain.model.Namjari
import com.terrasync.terrashield.ui.components.TagSim
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.StatusRedContainer
import com.terrasync.terrashield.ui.theme.StatusYellowContainer
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EvidenceScreen(
    input: CheckInput,
    result: CheckResult,
    landData: LandData,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
    val isTablet = windowSizeClass.windowWidthSizeClass != WindowWidthSizeClass.COMPACT

    val isEnglish = BanglaFormatter.isEnglish()

    val dagInt = RuleEngine.normalizeDigits(input.dag).toIntOrNull() ?: -1
    val mouza = landData.locations.mouzas.find { it.id == input.mouzaId }
    val mouzaName = mouza?.name?.text(isEnglish) ?: input.mouzaId

    val khatian = RuleEngine.findKhatian(landData, input.mouzaId, dagInt)
    val deeds = RuleEngine.deedsOnDag(landData, input.mouzaId, dagInt)
    val namjaris = landData.namjari.filter { it.mouzaId == input.mouzaId && it.dag == dagInt }

    val ruleIds = RuleEngine.ruleIds(result)

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isEnglish) "Record Evidence Comparison" else "রেকর্ডভিত্তিক প্রমাণ তুলনা",
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
                    TagSim(text = if (isEnglish) "Sample Data" else "কাল্পনিক / নমুনা", modifier = Modifier.padding(end = 16.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        if (isTablet) {
            // Multi-column tablet layout
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    SectionHeader(if (isEnglish) "1. Latest Khatian (BS)" else "১. সর্বশেষ খতিয়ান (বিএস)", Icons.AutoMirrored.Rounded.MenuBook)
                    Spacer(modifier = Modifier.height(12.dp))
                    KhatianEvidenceContent(khatian = khatian, input = input, ruleIds = ruleIds, landData = landData)
                }

                Column(modifier = Modifier.weight(1f)) {
                    SectionHeader(if (isEnglish) "2. Sub-Registry Deed Volume" else "২. সাব-রেজিস্ট্রি দলিল বহিসমূহ", Icons.Rounded.Description)
                    Spacer(modifier = Modifier.height(12.dp))
                    DeedsEvidenceContent(deeds = deeds, input = input, ruleIds = ruleIds, landData = landData)
                }

                Column(modifier = Modifier.weight(1f)) {
                    SectionHeader(if (isEnglish) "3. e-Mutation Database" else "৩. ই-নামজারি ডাটাবেস", Icons.AutoMirrored.Rounded.Assignment)
                    Spacer(modifier = Modifier.height(12.dp))
                    NamjariEvidenceContent(namjaris = namjaris, input = input, ruleIds = ruleIds, landData = landData)
                }
            }
        } else {
            // Phone layout with HorizontalPager
            val scope = rememberCoroutineScope()
            val pagerState = rememberPagerState(pageCount = { 3 })
            val tabs = listOf(
                if (isEnglish) "Khatian" else "খতিয়ান",
                if (isEnglish) "Deeds Volume" else "দলিল বহিসমূহ",
                if (isEnglish) "e-Mutation" else "ই-নামজারি"
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                PrimaryTabRow(
                    selectedTabIndex = pagerState.currentPage,
                    containerColor = MaterialTheme.colorScheme.surface
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = pagerState.currentPage == index,
                            onClick = {
                                scope.launch { pagerState.animateScrollToPage(index) }
                            },
                            text = {
                                Text(
                                    text = title,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                        )
                    }
                }

                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) { page ->
                    when (page) {
                        0 -> KhatianEvidenceContent(khatian = khatian, input = input, ruleIds = ruleIds, landData = landData)
                        1 -> DeedsEvidenceContent(deeds = deeds, input = input, ruleIds = ruleIds, landData = landData)
                        2 -> NamjariEvidenceContent(namjaris = namjaris, input = input, ruleIds = ruleIds, landData = landData)
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
        )
    }
}

@Composable
private fun KhatianEvidenceContent(
    khatian: Khatian?,
    input: CheckInput,
    ruleIds: List<String>,
    landData: LandData
) {
    if (khatian == null) {
        TsCard(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = "এই দাগের কোনো বিএস খতিয়ান নমুনা ডাটাবেসে পাওয়া যায়নি।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    } else {
        val peopleMap = landData.people.associateBy { it.id }
        val hasR3 = ruleIds.contains("R3")
        val hasR6 = ruleIds.contains("R6")

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                TsCard(
                    modifier = Modifier.fillMaxWidth(),
                    borderColor = if (hasR3 || hasR6) MaterialTheme.colorScheme.error else null
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "খতিয়ান নং: ${BanglaFormatter.toBanglaDigits(khatian.khatianNo)}",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = "জরিপ: ${khatian.survey}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "রেকর্ড তারিখ: ${BanglaFormatter.formatDate(khatian.recordDate)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "মালিকানা ও অংশের তালিকা (কলাম ৭ ও ৮):",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        khatian.owners.forEach { owner ->
                            val ownerName = peopleMap[owner.personId]?.name?.bn ?: owner.personId
                            val isSelectedSeller = input.sellerId == owner.personId

                            CellCard(
                                title = ownerName,
                                subtitle = "অংশ: ${BanglaFormatter.toBanglaDigits(owner.share)} শতাংশ",
                                isMismatch = hasR3 && isSelectedSeller,
                                mismatchTag = if (hasR3 && isSelectedSeller) "বিক্রেতা অনুপস্থিত" else null
                            )
                        }

                        if (hasR6) {
                            Spacer(modifier = Modifier.height(8.dp))
                            MismatchBanner(text = "R6: খতিয়ানের মোট মালিকানা অংশ দাগের মোট এরিয়া অতিক্রম করেছে।")
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

@Composable
private fun DeedsEvidenceContent(
    deeds: List<Deed>,
    input: CheckInput,
    ruleIds: List<String>,
    landData: LandData
) {
    if (deeds.isEmpty()) {
        TsCard(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = "রেকর্ড তারিখের পর এই দাগে কোনো নিবন্ধিত দলিল পাওয়া যায়নি।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    } else {
        val peopleMap = landData.people.associateBy { it.id }
        val hasR1 = ruleIds.contains("R1")
        val hasR2 = ruleIds.contains("R2")
        val hasR4 = ruleIds.contains("R4")
        val hasR8c = ruleIds.contains("R8c")

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(deeds) { deed ->
                val sellerName = peopleMap[deed.sellerId]?.name?.bn ?: deed.sellerId
                val buyerName = peopleMap[deed.buyerId]?.name?.bn ?: deed.buyerId

                val isDeedConflict = hasR8c && RuleEngine.normalizeDeedNo(input.sellerDeedNo) == RuleEngine.normalizeDeedNo(deed.deedNo)

                TsCard(
                    modifier = Modifier.fillMaxWidth(),
                    borderColor = if (isDeedConflict) MaterialTheme.colorScheme.error else null
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "দলিল নং: ${BanglaFormatter.toBanglaDigits(deed.deedNo)}",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = BanglaFormatter.formatDate(deed.date),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = "বিক্রেতা: $sellerName", style = MaterialTheme.typography.bodyMedium)
                        Text(text = "ক্রেতা: $buyerName", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = "বিক্রিত জমি: ${BanglaFormatter.toBanglaDigits(deed.area)} শতাংশ",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                        )

                        if (isDeedConflict) {
                            Spacer(modifier = Modifier.height(8.dp))
                            MismatchBanner(text = "R8c: একই দলিল নম্বর ও সালের একাধিক ভুক্তি বহিতে আছে।")
                        } else if (deed.sellerId == input.sellerId && (hasR1 || hasR2 || hasR4)) {
                            Spacer(modifier = Modifier.height(8.dp))
                            MismatchBanner(text = "বিক্রিত এই জমিসমূহ বিক্রেতার অবশিষ্ট অংশ হ্রাস করেছে।")
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

@Composable
private fun NamjariEvidenceContent(
    namjaris: List<Namjari>,
    input: CheckInput,
    ruleIds: List<String>,
    landData: LandData
) {
    val peopleMap = landData.people.associateBy { it.id }
    val hasR5 = ruleIds.contains("R5")

    if (namjaris.isEmpty()) {
        TsCard(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = "এই দাগে কোনো ই-নামজারি ভুক্তি রেকর্ড পাওয়া যায়নি।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    } else {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(namjaris) { namjari ->
                val applicantName = peopleMap[namjari.applicantId]?.name?.bn ?: namjari.applicantId
                val isPending = namjari.status == "pending"

                TsCard(
                    modifier = Modifier.fillMaxWidth(),
                    borderColor = if (isPending && hasR5) StatusYellowContainer else null
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "ই-নামজারি কেস: ${BanglaFormatter.toBanglaDigits(namjari.caseNo)}",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            val statusLabel = when (namjari.status) {
                                "approved" -> "মঞ্জুরকৃত"
                                "pending" -> "চলমান"
                                else -> "বাতিল"
                            }
                            Text(
                                text = statusLabel,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = if (isPending) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = "আবেদনকারী: $applicantName", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = "আবেদনের তারিখ: ${BanglaFormatter.formatDate(namjari.date)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        if (isPending && hasR5) {
                            Spacer(modifier = Modifier.height(8.dp))
                            MismatchBanner(text = "R5: অন্য ব্যক্তির ই-নামজারি আবেদন প্রক্রিয়াধীন থাকার কারণে জমিতে দাবি তৈরি হতে পারে।")
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

@Composable
private fun CellCard(
    title: String,
    subtitle: String,
    isMismatch: Boolean = false,
    mismatchTag: String? = null
) {
    val bgColor = if (isMismatch) StatusRedContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    val borderColor = if (isMismatch) MaterialTheme.colorScheme.error else Color.Transparent
    val cellShape = RoundedCornerShape(10.dp)

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = cellShape,
        color = bgColor,
        border = if (isMismatch) BorderStroke(1.dp, borderColor) else null
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (isMismatch && mismatchTag != null) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = MaterialTheme.colorScheme.error
                ) {
                    Text(
                        text = mismatchTag,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun MismatchBanner(text: String) {
    val bannerShape = RoundedCornerShape(10.dp)
    Surface(
        shape = bannerShape,
        color = StatusRedContainer,
        contentColor = MaterialTheme.colorScheme.onErrorContainer,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Rounded.ErrorOutline,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}
