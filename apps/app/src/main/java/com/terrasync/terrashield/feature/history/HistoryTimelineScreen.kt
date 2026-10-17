package com.terrasync.terrashield.feature.history

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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Assignment
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.History
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.domain.model.Deed
import com.terrasync.terrashield.domain.model.LandData
import com.terrasync.terrashield.domain.model.Namjari
import com.terrasync.terrashield.domain.model.OverallStatus
import com.terrasync.terrashield.ui.components.StatusBadge
import com.terrasync.terrashield.ui.components.TagSim
import com.terrasync.terrashield.ui.components.TsCard

sealed interface HistoryEvent {
    val date: String
    data class DeedEvent(val deed: Deed, val sellerName: String, val buyerName: String) : HistoryEvent {
        override val date: String get() = deed.date
    }
    data class NamjariEvent(val namjari: Namjari, val applicantName: String) : HistoryEvent {
        override val date: String get() = namjari.date
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryTimelineScreen(
    mouzaId: String,
    dag: Int,
    landData: LandData,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isEnglish = BanglaFormatter.isEnglish()

    val mouza = landData.locations.mouzas.find { it.id == mouzaId }
    val mouzaName = mouza?.name?.text(isEnglish) ?: mouzaId

    val peopleMap = landData.people.associateBy { it.id }

    val deeds = landData.deeds.filter { it.mouzaId == mouzaId && it.dag == dag }
        .map { deed ->
            HistoryEvent.DeedEvent(
                deed = deed,
                sellerName = peopleMap[deed.sellerId]?.name?.text(isEnglish) ?: deed.sellerId,
                buyerName = peopleMap[deed.buyerId]?.name?.text(isEnglish) ?: deed.buyerId
            )
        }

    val namjaris = landData.namjari.filter { it.mouzaId == mouzaId && it.dag == dag }
        .map { namjari ->
            HistoryEvent.NamjariEvent(
                namjari = namjari,
                applicantName = peopleMap[namjari.applicantId]?.name?.text(isEnglish) ?: namjari.applicantId
            )
        }

    val events: List<HistoryEvent> = (deeds + namjaris).sortedBy { it.date }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isEnglish) "Land Ownership History" else "জমির মালিকানার ইতিহাস",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = if (isEnglish) "$mouzaName · Dag No. ${BanglaFormatter.toBanglaDigits(dag, "en")}" else "$mouzaName · দাগ নং ${BanglaFormatter.toBanglaDigits(dag)}",
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
        if (events.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Rounded.History,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = if (isEnglish) "No history records found for this plot." else "এই দাগের কোনো ইতিহাস রেকর্ড পাওয়া যায়নি",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                item {
                    Text(
                        text = if (isEnglish) "Chronological Deeds & Mutation Events (${BanglaFormatter.toBanglaDigits(events.size, "en")}):" else "সময়ানুক্রমিক লেনদেন ও মিউটেশন রেকর্ড (${BanglaFormatter.toBanglaDigits(events.size)} টি)",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                itemsIndexed(events) { index, event ->
                    TimelineItemRow(
                        event = event,
                        isLast = index == events.lastIndex
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(110.dp))
                }
            }
        }
    }
}

@Composable
private fun TimelineItemRow(
    event: HistoryEvent,
    isLast: Boolean
) {
    val isEnglish = BanglaFormatter.isEnglish()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = if (isLast) 16.dp else 0.dp)
    ) {
        // Timeline Indicator Column
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(36.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = when (event) {
                    is HistoryEvent.DeedEvent -> MaterialTheme.colorScheme.primary
                    is HistoryEvent.NamjariEvent -> MaterialTheme.colorScheme.secondary
                },
                modifier = Modifier.size(28.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = when (event) {
                            is HistoryEvent.DeedEvent -> Icons.Rounded.Description
                            is HistoryEvent.NamjariEvent -> Icons.AutoMirrored.Rounded.Assignment
                        },
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(110.dp)
                        .background(MaterialTheme.colorScheme.outlineVariant)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Event Card
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(bottom = 16.dp)
        ) {
            Text(
                text = BanglaFormatter.formatDate(event.date),
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(4.dp))

            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    when (event) {
                        is HistoryEvent.DeedEvent -> {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isEnglish) "Deed No: ${BanglaFormatter.toBanglaDigits(event.deed.deedNo, "en")}" else "দলিল নং: ${BanglaFormatter.toBanglaDigits(event.deed.deedNo)}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Text(
                                        text = if (isEnglish) "Sub-Registry" else "সাব-রেজিস্ট্রি",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = if (isEnglish) "Seller: ${event.sellerName}" else "বিক্রেতা: ${event.sellerName}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                text = if (isEnglish) "Buyer: ${event.buyerName}" else "ক্রেতা: ${event.buyerName}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = if (isEnglish) "Area: ${BanglaFormatter.toBanglaDigits(event.deed.area, "en")} decimals" else "জমির পরিমাণ: ${BanglaFormatter.toBanglaDigits(event.deed.area)} শতাংশ",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        is HistoryEvent.NamjariEvent -> {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isEnglish) "e-Mutation Case: ${BanglaFormatter.toBanglaDigits(event.namjari.caseNo, "en")}" else "ই-নামজারি কেস: ${BanglaFormatter.toBanglaDigits(event.namjari.caseNo)}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )

                                val status = when (event.namjari.status) {
                                    "approved" -> OverallStatus.GREEN
                                    "pending" -> OverallStatus.YELLOW
                                    else -> OverallStatus.RED
                                }
                                val statusLabel = when (event.namjari.status) {
                                    "approved" -> if (isEnglish) "Approved" else "মঞ্জুরকৃত"
                                    "pending" -> if (isEnglish) "Pending" else "চলমান"
                                    else -> if (isEnglish) "Rejected" else "বাতিল"
                                }
                                StatusBadge(status = status, customLabel = statusLabel)
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = if (isEnglish) "Applicant: ${event.applicantName}" else "আবেদনকারী: ${event.applicantName}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                text = if (isEnglish) "Basis: ${if (event.namjari.basis == "deed") "Registered Deed" else "Inheritance"}" else "ভিত্তি: ${if (event.namjari.basis == "deed") "দলিল সূত্রে" else "ওয়ারিশ সূত্রে"}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}
