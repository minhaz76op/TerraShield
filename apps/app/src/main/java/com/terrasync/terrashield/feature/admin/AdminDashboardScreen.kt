package com.terrasync.terrashield.feature.admin

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Archive
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Logout
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.domain.model.KhatianOwner
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsButtonVariant
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.StatusGreen
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusYellow
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    adminRepository: AdminRepository,
    onLogout: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabTitles = listOf("দাগ (Plots)", "খতিয়ান", "দলিল", "নামজারি", "অডিট লগ")

    val plots by adminRepository.plots.collectAsState()
    val khatians by adminRepository.khatians.collectAsState()
    val deeds by adminRepository.deeds.collectAsState()
    val namjari by adminRepository.namjari.collectAsState()
    val auditLogs by adminRepository.auditLogs.collectAsState()

    // Dialog States
    var showAddPlotDialog by remember { mutableStateOf(false) }
    var showAddKhatianDialog by remember { mutableStateOf(false) }
    var showAddDeedDialog by remember { mutableStateOf(false) }
    var showAddNamjariDialog by remember { mutableStateOf(false) }

    // Rejection reason dialog state
    var rejectingTarget by remember { mutableStateOf<Triple<String, String, AdminRecordStatus>?>(null) } // type, id, newStatus
    var rejectionReasonInput by remember { mutableStateOf("") }

    // History Dialog State
    var historyTarget by remember { mutableStateOf<Pair<String, List<RecordHistoryItem>>?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "এডমিন ড্যাশবোর্ড (Record CRUD)",
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
                },
                actions = {
                    IconButton(
                        onClick = {
                            AdminAuth.logout()
                            onLogout()
                        },
                        modifier = Modifier.size(52.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Logout,
                            contentDescription = "লগআউট"
                        )
                    }
                }
            )
        },
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Isolation Rule Banner
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "আইসোলেশন নীতি: শুধুমাত্র Approved রেকর্ড ম্যানুয়াল অনুসন্ধানে কার্যকর হবে। base test cases সুরক্ষিত থাকবে।",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            // Tabs Header
            PrimaryTabRow(
                selectedTabIndex = selectedTab,
                modifier = Modifier.fillMaxWidth()
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, style = MaterialTheme.typography.labelMedium) },
                        modifier = Modifier.height(48.dp)
                    )
                }
            }

            // Tab Contents
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp)
            ) {
                when (selectedTab) {
                    0 -> PlotManagementTab(
                        plots = plots,
                        onAdd = { showAddPlotDialog = true },
                        onUpdateStatus = { id, newStatus ->
                            if (newStatus == AdminRecordStatus.REJECTED) {
                                rejectingTarget = Triple("PLOT", id, newStatus)
                                rejectionReasonInput = ""
                            } else {
                                adminRepository.updatePlotStatus(id, newStatus)
                            }
                        },
                        onShowHistory = { id, hist -> historyTarget = Pair(id, hist) },
                        onResetAll = { adminRepository.resetData() }
                    )

                    1 -> KhatianManagementTab(
                        khatians = khatians,
                        onAdd = { showAddKhatianDialog = true },
                        onUpdateStatus = { id, newStatus ->
                            if (newStatus == AdminRecordStatus.REJECTED) {
                                rejectingTarget = Triple("KHATIAN", id, newStatus)
                                rejectionReasonInput = ""
                            } else {
                                adminRepository.updateKhatianStatus(id, newStatus)
                            }
                        },
                        onShowHistory = { id, hist -> historyTarget = Pair(id, hist) }
                    )

                    2 -> DeedManagementTab(
                        deeds = deeds,
                        onAdd = { showAddDeedDialog = true },
                        onUpdateStatus = { id, newStatus ->
                            if (newStatus == AdminRecordStatus.REJECTED) {
                                rejectingTarget = Triple("DEED", id, newStatus)
                                rejectionReasonInput = ""
                            } else {
                                adminRepository.updateDeedStatus(id, newStatus)
                            }
                        },
                        onShowHistory = { id, hist -> historyTarget = Pair(id, hist) }
                    )

                    3 -> NamjariManagementTab(
                        namjariList = namjari,
                        onAdd = { showAddNamjariDialog = true },
                        onUpdateStatus = { id, newStatus ->
                            if (newStatus == AdminRecordStatus.REJECTED) {
                                rejectingTarget = Triple("NAMJARI", id, newStatus)
                                rejectionReasonInput = ""
                            } else {
                                adminRepository.updateNamjariStatus(id, newStatus)
                            }
                        },
                        onShowHistory = { id, hist -> historyTarget = Pair(id, hist) }
                    )

                    4 -> AuditLogTab(auditLogs = auditLogs)
                }
            }
        }
    }

    // Add Plot Dialog
    if (showAddPlotDialog) {
        AddPlotModal(
            onDismiss = { showAddPlotDialog = false },
            onSave = { record ->
                adminRepository.addPlot(record)
                showAddPlotDialog = false
            }
        )
    }

    // Add Khatian Dialog
    if (showAddKhatianDialog) {
        AddKhatianModal(
            onDismiss = { showAddKhatianDialog = false },
            onSave = { record ->
                adminRepository.addKhatian(record)
                showAddKhatianDialog = false
            }
        )
    }

    // Add Deed Dialog
    if (showAddDeedDialog) {
        AddDeedModal(
            onDismiss = { showAddDeedDialog = false },
            onSave = { record ->
                adminRepository.addDeed(record)
                showAddDeedDialog = false
            }
        )
    }

    // Add Namjari Dialog
    if (showAddNamjariDialog) {
        AddNamjariModal(
            onDismiss = { showAddNamjariDialog = false },
            onSave = { record ->
                adminRepository.addNamjari(record)
                showAddNamjariDialog = false
            }
        )
    }

    // Rejection Reason Mandatory Modal
    if (rejectingTarget != null) {
        AlertDialog(
            onDismissRequest = { rejectingTarget = null },
            title = {
                Text(
                    text = "বাতিলের সুনির্দিষ্ট কারণ (Mandatory Rejection Reason)",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )
            },
            text = {
                Column {
                    Text(
                        text = "রেকর্ডটি বাতিল (Rejected) করার পূর্বের প্রশাসনিক কারণ উল্লেখ বাধ্যতামূলক:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = rejectionReasonInput,
                        onValueChange = { rejectionReasonInput = it },
                        label = { Text("বাতিলের কারণ (Rejection Reason)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        rejectingTarget?.let { (type, id, newStatus) ->
                            if (rejectionReasonInput.isNotBlank()) {
                                when (type) {
                                    "PLOT" -> adminRepository.updatePlotStatus(id, newStatus, rejectionReasonInput)
                                    "KHATIAN" -> adminRepository.updateKhatianStatus(id, newStatus, rejectionReasonInput)
                                    "DEED" -> adminRepository.updateDeedStatus(id, newStatus, rejectionReasonInput)
                                    "NAMJARI" -> adminRepository.updateNamjariStatus(id, newStatus, rejectionReasonInput)
                                }
                                rejectingTarget = null
                            }
                        }
                    },
                    enabled = rejectionReasonInput.isNotBlank()
                ) {
                    Text("বাতিল নিশ্চিত করুন")
                }
            },
            dismissButton = {
                TextButton(onClick = { rejectingTarget = null }) {
                    Text("বাতিল করুন")
                }
            }
        )
    }

    // History Dialog
    historyTarget?.let { (recordId, historyItems) ->
        AlertDialog(
            onDismissRequest = { historyTarget = null },
            title = {
                Text(
                    text = "রেকর্ড পরিবর্তনের হিস্ট্রি (#$recordId)",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(historyItems) { item ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = "${item.fromStatus.name} ➔ ${item.toStatus.name}",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "ব্যবহারকারী: ${item.user}",
                                    style = MaterialTheme.typography.labelSmall
                                )
                                if (!item.reason.isNullOrBlank()) {
                                    Text(
                                        text = "কারণ/নোট: ${item.reason}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { historyTarget = null }) {
                    Text("বন্ধ করুন")
                }
            }
        )
    }
}

@Composable
private fun PlotManagementTab(
    plots: List<AdminPlotRecord>,
    onAdd: () -> Unit,
    onUpdateStatus: (String, AdminRecordStatus) -> Unit,
    onShowHistory: (String, List<RecordHistoryItem>) -> Unit,
    onResetAll: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "দাগ নম্বর রেকর্ডস (${plots.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TsButton(
                        text = "নতুন দাগ",
                        onClick = onAdd,
                        icon = Icons.Rounded.Add
                    )
                    IconButton(onClick = onResetAll) {
                        Icon(imageVector = Icons.Rounded.Refresh, contentDescription = "রিসেট")
                    }
                }
            }
        }

        if (plots.isEmpty()) {
            item {
                Text(
                    text = "কোনো এডমিন দাগ রেকর্ড নেই। 'নতুন দাগ' বাটনে চাপ দিয়ে ড্রাফট তৈরি করুন।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(plots, key = { it.id }) { plot ->
            AdminRecordCard(
                title = "দাগ নম্বর: ${plot.dag} (মৌজা: ${plot.mouzaId})",
                subtitle = "মোট জমি: ${plot.totalArea} শতাংশ",
                status = plot.status,
                rejectionReason = plot.rejectionReason,
                onTransition = { newStatus -> onUpdateStatus(plot.id, newStatus) },
                onHistory = { onShowHistory(plot.id, plot.history) }
            )
        }

        item { Spacer(modifier = Modifier.height(110.dp)) }
    }
}

@Composable
private fun KhatianManagementTab(
    khatians: List<AdminKhatianRecord>,
    onAdd: () -> Unit,
    onUpdateStatus: (String, AdminRecordStatus) -> Unit,
    onShowHistory: (String, List<RecordHistoryItem>) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "খতিয়ান রেকর্ডস (${khatians.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )

                TsButton(
                    text = "নতুন খতিয়ান",
                    onClick = onAdd,
                    icon = Icons.Rounded.Add
                )
            }
        }

        if (khatians.isEmpty()) {
            item {
                Text(
                    text = "কোনো এডমিন খতিয়ান রেকর্ড নেই।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(khatians, key = { it.id }) { khatian ->
            AdminRecordCard(
                title = "খতিয়ান নম্বর: ${khatian.khatianNo} (দাগ: ${khatian.dag})",
                subtitle = "জরিপ: ${khatian.survey} · তারিখ: ${khatian.recordDate} · মালিকগণ: ${khatian.owners.joinToString { "${it.personId}: ${it.share}" }}",
                status = khatian.status,
                rejectionReason = khatian.rejectionReason,
                onTransition = { newStatus -> onUpdateStatus(khatian.id, newStatus) },
                onHistory = { onShowHistory(khatian.id, khatian.history) }
            )
        }

        item { Spacer(modifier = Modifier.height(110.dp)) }
    }
}

@Composable
private fun DeedManagementTab(
    deeds: List<AdminDeedRecord>,
    onAdd: () -> Unit,
    onUpdateStatus: (String, AdminRecordStatus) -> Unit,
    onShowHistory: (String, List<RecordHistoryItem>) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "দলিল রেকর্ডস (${deeds.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )

                TsButton(
                    text = "নতুন দলিল",
                    onClick = onAdd,
                    icon = Icons.Rounded.Add
                )
            }
        }

        if (deeds.isEmpty()) {
            item {
                Text(
                    text = "কোনো এডমিন দলিল রেকর্ড নেই।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(deeds, key = { it.id }) { deed ->
            AdminRecordCard(
                title = "দলিল নম্বর: ${deed.deedNo} (দাগ: ${deed.dag})",
                subtitle = "বিক্রেতা: ${deed.sellerId} ➔ ক্রেতা: ${deed.buyerId} · জমি: ${deed.area} শতাংশ",
                status = deed.status,
                rejectionReason = deed.rejectionReason,
                onTransition = { newStatus -> onUpdateStatus(deed.id, newStatus) },
                onHistory = { onShowHistory(deed.id, deed.history) }
            )
        }

        item { Spacer(modifier = Modifier.height(110.dp)) }
    }
}

@Composable
private fun NamjariManagementTab(
    namjariList: List<AdminNamjariRecord>,
    onAdd: () -> Unit,
    onUpdateStatus: (String, AdminRecordStatus) -> Unit,
    onShowHistory: (String, List<RecordHistoryItem>) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "নামজারি কেস (${namjariList.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )

                TsButton(
                    text = "নতুন নামজারি",
                    onClick = onAdd,
                    icon = Icons.Rounded.Add
                )
            }
        }

        if (namjariList.isEmpty()) {
            item {
                Text(
                    text = "কোনো এডমিন নামজারি রেকর্ড নেই।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(namjariList, key = { it.id }) { namjari ->
            AdminRecordCard(
                title = "কেস নম্বর: ${namjari.caseNo} (দাগ: ${namjari.dag})",
                subtitle = "আবেদনকারী: ${namjari.applicantId} · স্ট্যাটাস: ${namjari.namjariStatus} · তারিখ: ${namjari.date}",
                status = namjari.status,
                rejectionReason = namjari.rejectionReason,
                onTransition = { newStatus -> onUpdateStatus(namjari.id, newStatus) },
                onHistory = { onShowHistory(namjari.id, namjari.history) }
            )
        }

        item { Spacer(modifier = Modifier.height(110.dp)) }
    }
}

@Composable
private fun AuditLogTab(auditLogs: List<AuditLogEntry>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "প্রশাসনিক অডিট লগ (Audit Trails - ${auditLogs.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.semantics { heading() }
            )
        }

        if (auditLogs.isEmpty()) {
            item {
                Text(
                    text = "এখনো কোনো প্রশাসনিক কার্যক্রম সম্পন্ন হয়নি।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        items(auditLogs, key = { it.id }) { log ->
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        EyebrowPill(text = log.action)
                        Text(
                            text = log.user,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "টাইপ: ${log.recordType} · ID: ${log.recordId}",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )

                    if (!log.comment.isNullOrBlank()) {
                        Text(
                            text = log.comment,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(110.dp)) }
    }
}

@Composable
private fun AdminRecordCard(
    title: String,
    subtitle: String,
    status: AdminRecordStatus,
    rejectionReason: String?,
    onTransition: (AdminRecordStatus) -> Unit,
    onHistory: () -> Unit
) {
    val (statusColor, containerColor) = when (status) {
        AdminRecordStatus.DRAFT -> Pair(Color.Gray, Color.LightGray.copy(alpha = 0.3f))
        AdminRecordStatus.REVIEW -> Pair(StatusYellow, StatusYellowContainer)
        AdminRecordStatus.APPROVED -> Pair(StatusGreen, StatusGreen.copy(alpha = 0.15f))
        AdminRecordStatus.REJECTED -> Pair(StatusRed, StatusRed.copy(alpha = 0.15f))
        AdminRecordStatus.ARCHIVED -> Pair(Color.DarkGray, Color.Gray.copy(alpha = 0.2f))
    }

    TsCard(
        modifier = Modifier.fillMaxWidth(),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.semantics { heading() }
                )

                EyebrowPill(
                    text = status.displayNameBn,
                    containerColor = containerColor,
                    contentColor = statusColor
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (status == AdminRecordStatus.REJECTED && !rejectionReason.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "বাতিলের কারণ: $rejectionReason",
                    style = MaterialTheme.typography.labelSmall.copy(color = StatusRed, fontWeight = FontWeight.Bold)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Workflow Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onHistory, modifier = Modifier.size(48.dp)) {
                    Icon(imageVector = Icons.Rounded.History, contentDescription = "হিস্ট্রি দেখুন")
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    when (status) {
                        AdminRecordStatus.DRAFT -> {
                            TsButton(text = "রিভিউ পাঠান", onClick = { onTransition(AdminRecordStatus.REVIEW) })
                        }
                        AdminRecordStatus.REVIEW -> {
                            TsButton(text = "অনুমোদন (Approve)", onClick = { onTransition(AdminRecordStatus.APPROVED) })
                            TsButton(
                                text = "বাতিল (Reject)",
                                onClick = { onTransition(AdminRecordStatus.REJECTED) },
                                variant = TsButtonVariant.Outlined
                            )
                        }
                        AdminRecordStatus.APPROVED -> {
                            TsButton(text = "আর্কাইভ (Archive)", onClick = { onTransition(AdminRecordStatus.ARCHIVED) }, variant = TsButtonVariant.Outlined)
                        }
                        AdminRecordStatus.REJECTED, AdminRecordStatus.ARCHIVED -> {
                            TsButton(text = "পুনরুদ্ধার (Restore Draft)", onClick = { onTransition(AdminRecordStatus.DRAFT) })
                        }
                    }
                }
            }
        }
    }
}

// Modals
@Composable
private fun AddPlotModal(
    onDismiss: () -> Unit,
    onSave: (AdminPlotRecord) -> Unit
) {
    var mouzaId by remember { mutableStateOf("M901") }
    var dagStr by remember { mutableStateOf("105") }
    var totalAreaStr by remember { mutableStateOf("25.0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("নতুন দাগ তৈরি (Draft Plot)") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = mouzaId, onValueChange = { mouzaId = it }, label = { Text("মৌজা ID") })
                OutlinedTextField(value = dagStr, onValueChange = { dagStr = it }, label = { Text("দাগ নম্বর") })
                OutlinedTextField(value = totalAreaStr, onValueChange = { totalAreaStr = it }, label = { Text("মোট জমি (শতাংশ)") })
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val dag = dagStr.toIntOrNull() ?: 105
                    val area = totalAreaStr.toDoubleOrNull() ?: 25.0
                    onSave(AdminPlotRecord(mouzaId = mouzaId, dag = dag, totalArea = area))
                }
            ) { Text("সংরক্ষণ করুন") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("বাতিল") } }
    )
}

@Composable
private fun AddKhatianModal(
    onDismiss: () -> Unit,
    onSave: (AdminKhatianRecord) -> Unit
) {
    var khatianNo by remember { mutableStateOf("K-901") }
    var mouzaId by remember { mutableStateOf("M901") }
    var dagStr by remember { mutableStateOf("105") }
    var recordDate by remember { mutableStateOf("2020-01-01") }
    var ownerId by remember { mutableStateOf("O01") }
    var ownerShareStr by remember { mutableStateOf("25.0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("নতুন খতিয়ান তৈরি (Draft Khatian)") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = khatianNo, onValueChange = { khatianNo = it }, label = { Text("খতিয়ান নম্বর") })
                OutlinedTextField(value = mouzaId, onValueChange = { mouzaId = it }, label = { Text("মৌজা ID") })
                OutlinedTextField(value = dagStr, onValueChange = { dagStr = it }, label = { Text("দাগ নম্বর") })
                OutlinedTextField(value = recordDate, onValueChange = { recordDate = it }, label = { Text("রেকর্ড তারিখ (YYYY-MM-DD)") })
                OutlinedTextField(value = ownerId, onValueChange = { ownerId = it }, label = { Text("মালিক ID") })
                OutlinedTextField(value = ownerShareStr, onValueChange = { ownerShareStr = it }, label = { Text("মালিকের অংশ (শতাংশ)") })
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val dag = dagStr.toIntOrNull() ?: 105
                    val share = ownerShareStr.toDoubleOrNull() ?: 25.0
                    onSave(
                        AdminKhatianRecord(
                            khatianNo = khatianNo,
                            mouzaId = mouzaId,
                            dag = dag,
                            recordDate = recordDate,
                            owners = listOf(KhatianOwner(personId = ownerId, share = share))
                        )
                    )
                }
            ) { Text("সংরক্ষণ করুন") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("বাতিল") } }
    )
}

@Composable
private fun AddDeedModal(
    onDismiss: () -> Unit,
    onSave: (AdminDeedRecord) -> Unit
) {
    var deedNo by remember { mutableStateOf("8801/2026") }
    var sellerId by remember { mutableStateOf("O01") }
    var buyerId by remember { mutableStateOf("P05") }
    var mouzaId by remember { mutableStateOf("M901") }
    var dagStr by remember { mutableStateOf("105") }
    var areaStr by remember { mutableStateOf("10.0") }
    var date by remember { mutableStateOf("2026-03-15") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("নতুন দলিল তৈরি (Draft Deed)") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = deedNo, onValueChange = { deedNo = it }, label = { Text("দলিল নম্বর") })
                OutlinedTextField(value = sellerId, onValueChange = { sellerId = it }, label = { Text("বিক্রেতা ID") })
                OutlinedTextField(value = buyerId, onValueChange = { buyerId = it }, label = { Text("ক্রেতা ID") })
                OutlinedTextField(value = mouzaId, onValueChange = { mouzaId = it }, label = { Text("মৌজা ID") })
                OutlinedTextField(value = dagStr, onValueChange = { dagStr = it }, label = { Text("দাগ নম্বর") })
                OutlinedTextField(value = areaStr, onValueChange = { areaStr = it }, label = { Text("জমির পরিমাণ") })
                OutlinedTextField(value = date, onValueChange = { date = it }, label = { Text("দলিলের তারিখ") })
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val dag = dagStr.toIntOrNull() ?: 105
                    val area = areaStr.toDoubleOrNull() ?: 10.0
                    onSave(
                        AdminDeedRecord(
                            deedNo = deedNo,
                            sellerId = sellerId,
                            buyerId = buyerId,
                            mouzaId = mouzaId,
                            dag = dag,
                            area = area,
                            date = date
                        )
                    )
                }
            ) { Text("সংরক্ষণ করুন") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("বাতিল") } }
    )
}

@Composable
private fun AddNamjariModal(
    onDismiss: () -> Unit,
    onSave: (AdminNamjariRecord) -> Unit
) {
    var caseNo by remember { mutableStateOf("NJ-2026-01") }
    var mouzaId by remember { mutableStateOf("M901") }
    var dagStr by remember { mutableStateOf("105") }
    var applicantId by remember { mutableStateOf("P05") }
    var date by remember { mutableStateOf("2026-04-01") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("নতুন নামজারি কেস (Draft Namjari)") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = caseNo, onValueChange = { caseNo = it }, label = { Text("কেস নম্বর") })
                OutlinedTextField(value = mouzaId, onValueChange = { mouzaId = it }, label = { Text("মৌজা ID") })
                OutlinedTextField(value = dagStr, onValueChange = { dagStr = it }, label = { Text("দাগ নম্বর") })
                OutlinedTextField(value = applicantId, onValueChange = { applicantId = it }, label = { Text("আবেদনকারী ID") })
                OutlinedTextField(value = date, onValueChange = { date = it }, label = { Text("তারিখ") })
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val dag = dagStr.toIntOrNull() ?: 105
                    onSave(
                        AdminNamjariRecord(
                            caseNo = caseNo,
                            mouzaId = mouzaId,
                            dag = dag,
                            applicantId = applicantId,
                            basis = "deed",
                            date = date
                        )
                    )
                }
            ) { Text("সংরক্ষণ করুন") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("বাতিল") } }
    )
}
