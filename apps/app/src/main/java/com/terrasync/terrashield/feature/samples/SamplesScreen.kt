package com.terrasync.terrashield.feature.samples

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.FilterList
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
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
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.StatusGreen
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusYellow
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SamplesScreen(
    onRunSample: (CheckInput) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val allCases = remember(context) { SampleCaseRepository.loadAllCases(context) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredCases = remember(allCases, searchQuery, selectedFilter) {
        allCases.filter { case ->
            val matchesFilter = when (selectedFilter) {
                "GREEN" -> case.level == "green"
                "YELLOW" -> case.level == "yellow"
                "RED" -> case.level == "red"
                "GREY" -> case.level == "grey"
                else -> true
            }

            val matchesSearch = searchQuery.isBlank() ||
                    case.title.bn.contains(searchQuery, ignoreCase = true) ||
                    case.story.bn.contains(searchQuery, ignoreCase = true) ||
                    case.id.contains(searchQuery, ignoreCase = true)

            matchesFilter && matchesSearch
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "নমুনা কেসসমূহ (Shared Test Cases)",
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
            item {
                Text(
                    text = "মোট ১৪টি প্রমিত পরীক্ষা কেস",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )
                Text(
                    text = "প্রতিটি কেসে বাস্তব জমি রেজিস্ট্রি ও ঝুঁকির সত্য দৃশ্যপট চিত্রিত হয়েছে। যেকোনো কেসের 'রান করে দেখুন' বাটনে চাপ দিয়ে সরাসরি যাচাই করুন।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Filter chips
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val filters = listOf(
                        "ALL" to "সবগুলো (${allCases.size})",
                        "GREEN" to "সবুজ / নিরাপদ",
                        "YELLOW" to "হলুদ / মাঝারি",
                        "RED" to "লাল / উচ্চ ঝুঁকি",
                        "GREY" to "ধূসর / অজানা"
                    )

                    items(filters) { (key, label) ->
                        FilterChip(
                            selected = selectedFilter == key,
                            onClick = { selectedFilter = key },
                            label = { Text(label, style = MaterialTheme.typography.labelMedium) },
                            modifier = Modifier.height(48.dp)
                        )
                    }
                }
            }

            // Case List
            items(filteredCases, key = { it.id }) { sampleCase ->
                SampleCaseCard(
                    sampleCase = sampleCase,
                    onRun = {
                        onRunSample(sampleCase.input.toCheckInput())
                    }
                )
            }

            item {
                Spacer(modifier = Modifier.height(110.dp))
            }
        }
    }
}

@Composable
private fun SampleCaseCard(
    sampleCase: SampleCase,
    onRun: () -> Unit
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    val (statusColor, containerColor, statusText, statusIcon) = when (sampleCase.level) {
        "green" -> Quadruple(StatusGreen, StatusGreen.copy(alpha = 0.12f), if (isEnglish) "Safe" else "নিরাপদ", Icons.Rounded.CheckCircle)
        "yellow" -> Quadruple(StatusYellow, StatusYellowContainer, if (isEnglish) "Caution" else "সতর্কতা", Icons.Rounded.Warning)
        "red" -> Quadruple(StatusRed, StatusRed.copy(alpha = 0.12f), if (isEnglish) "High Risk" else "উচ্চ ঝুঁকি", Icons.Rounded.Warning)
        else -> Quadruple(Color.Gray, Color.LightGray.copy(alpha = 0.3f), if (isEnglish) "Unknown" else "অজানা জমি", Icons.Rounded.Shield)
    }

    TsCard(
        modifier = Modifier.fillMaxWidth(),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Text(
                        text = sampleCase.id,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        ),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                EyebrowPill(
                    text = statusText,
                    icon = statusIcon,
                    containerColor = containerColor,
                    contentColor = statusColor
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = sampleCase.title.text(isEnglish),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.semantics { heading() }
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = sampleCase.story.text(isEnglish),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Details Box
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        text = if (isEnglish) "Inputs: Mouza: ${sampleCase.input.mouzaId} · Dag: ${sampleCase.input.dag} · Area: ${sampleCase.input.area} decimals" else "ইনপুট তথ্য: মৌজা ID: ${sampleCase.input.mouzaId} · দাগ: ${sampleCase.input.dag} · জমি: ${sampleCase.input.area} শতাংশ",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (!sampleCase.input.sellerId.isNullOrBlank()) {
                        Text(
                            text = if (isEnglish) "Seller ID: ${sampleCase.input.sellerId}" else "বিক্রেতা ID: ${sampleCase.input.sellerId}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (sampleCase.expect.rules.isNotEmpty()) {
                        Text(
                            text = if (isEnglish) "Expected Rules: ${sampleCase.expect.rules.joinToString(", ")}" else "প্রত্যাশিত রুল: ${sampleCase.expect.rules.joinToString(", ")}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = statusColor
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            TsButton(
                text = if (isEnglish) "Run Test Case" else "রান করে দেখুন",
                onClick = onRun,
                icon = Icons.Rounded.PlayArrow,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
