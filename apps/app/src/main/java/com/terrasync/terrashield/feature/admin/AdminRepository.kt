package com.terrasync.terrashield.feature.admin

import com.terrasync.terrashield.domain.model.LandData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AdminRepository {

    private val _plots = MutableStateFlow<List<AdminPlotRecord>>(emptyList())
    val plots: StateFlow<List<AdminPlotRecord>> = _plots.asStateFlow()

    private val _khatians = MutableStateFlow<List<AdminKhatianRecord>>(emptyList())
    val khatians: StateFlow<List<AdminKhatianRecord>> = _khatians.asStateFlow()

    private val _deeds = MutableStateFlow<List<AdminDeedRecord>>(emptyList())
    val deeds: StateFlow<List<AdminDeedRecord>> = _deeds.asStateFlow()

    private val _namjari = MutableStateFlow<List<AdminNamjariRecord>>(emptyList())
    val namjari: StateFlow<List<AdminNamjariRecord>> = _namjari.asStateFlow()

    private val _auditLogs = MutableStateFlow<List<AuditLogEntry>>(emptyList())
    val auditLogs: StateFlow<List<AuditLogEntry>> = _auditLogs.asStateFlow()

    private fun logAction(action: String, recordType: String, recordId: String, comment: String? = null) {
        val entry = AuditLogEntry(
            user = AdminAuth.getCurrentUser() ?: "demo.admin@terrashield.local",
            action = action,
            recordType = recordType,
            recordId = recordId,
            comment = comment
        )
        _auditLogs.value = listOf(entry) + _auditLogs.value
    }

    // Plots CRUD
    fun addPlot(plot: AdminPlotRecord) {
        val updatedHistory = plot.history + RecordHistoryItem(
            fromStatus = AdminRecordStatus.DRAFT,
            toStatus = plot.status,
            reason = "রেকর্ড ড্রাফট তৈরি করা হয়েছে"
        )
        val record = plot.copy(history = updatedHistory)
        _plots.value = _plots.value + record
        logAction("CREATE", "DAG/PLOT", record.id, "নতুন দাগ #${record.dag} যোগ করা হয়েছে (Status: ${record.status})")
    }

    fun updatePlotStatus(recordId: String, newStatus: AdminRecordStatus, rejectionReason: String? = null) {
        _plots.value = _plots.value.map { item ->
            if (item.id == recordId) {
                val newHistory = item.history + RecordHistoryItem(
                    fromStatus = item.status,
                    toStatus = newStatus,
                    reason = rejectionReason ?: "স্ট্যাটাস পরিবর্তন: ${newStatus.name}"
                )
                val updated = item.copy(
                    status = newStatus,
                    rejectionReason = if (newStatus == AdminRecordStatus.REJECTED) rejectionReason else item.rejectionReason,
                    history = newHistory
                )
                logAction("STATUS_CHANGE", "DAG/PLOT", recordId, "${item.status} -> $newStatus (${rejectionReason ?: "N/A"})")
                updated
            } else item
        }
    }

    // Khatian CRUD
    fun addKhatian(khatian: AdminKhatianRecord) {
        val updatedHistory = khatian.history + RecordHistoryItem(
            fromStatus = AdminRecordStatus.DRAFT,
            toStatus = khatian.status,
            reason = "রেকর্ড তৈরি করা হয়েছে"
        )
        val record = khatian.copy(history = updatedHistory)
        _khatians.value = _khatians.value + record
        logAction("CREATE", "KHATIAN", record.id, "খতিয়ান #${record.khatianNo} যোগ করা হয়েছে")
    }

    fun updateKhatianStatus(recordId: String, newStatus: AdminRecordStatus, rejectionReason: String? = null) {
        _khatians.value = _khatians.value.map { item ->
            if (item.id == recordId) {
                val newHistory = item.history + RecordHistoryItem(
                    fromStatus = item.status,
                    toStatus = newStatus,
                    reason = rejectionReason ?: "স্ট্যাটাস পরিবর্তন: ${newStatus.name}"
                )
                val updated = item.copy(
                    status = newStatus,
                    rejectionReason = if (newStatus == AdminRecordStatus.REJECTED) rejectionReason else item.rejectionReason,
                    history = newHistory
                )
                logAction("STATUS_CHANGE", "KHATIAN", recordId, "${item.status} -> $newStatus")
                updated
            } else item
        }
    }

    // Deed CRUD
    fun addDeed(deed: AdminDeedRecord) {
        val updatedHistory = deed.history + RecordHistoryItem(
            fromStatus = AdminRecordStatus.DRAFT,
            toStatus = deed.status,
            reason = "দলিল তৈরি করা হয়েছে"
        )
        val record = deed.copy(history = updatedHistory)
        _deeds.value = _deeds.value + record
        logAction("CREATE", "DEED", record.id, "দলিল #${record.deedNo} যোগ করা হয়েছে")
    }

    fun updateDeedStatus(recordId: String, newStatus: AdminRecordStatus, rejectionReason: String? = null) {
        _deeds.value = _deeds.value.map { item ->
            if (item.id == recordId) {
                val newHistory = item.history + RecordHistoryItem(
                    fromStatus = item.status,
                    toStatus = newStatus,
                    reason = rejectionReason ?: "স্ট্যাটাস পরিবর্তন: ${newStatus.name}"
                )
                val updated = item.copy(
                    status = newStatus,
                    rejectionReason = if (newStatus == AdminRecordStatus.REJECTED) rejectionReason else item.rejectionReason,
                    history = newHistory
                )
                logAction("STATUS_CHANGE", "DEED", recordId, "${item.status} -> $newStatus")
                updated
            } else item
        }
    }

    // Namjari CRUD
    fun addNamjari(namjariRec: AdminNamjariRecord) {
        val updatedHistory = namjariRec.history + RecordHistoryItem(
            fromStatus = AdminRecordStatus.DRAFT,
            toStatus = namjariRec.status,
            reason = "নামজারি কেস তৈরি করা হয়েছে"
        )
        val record = namjariRec.copy(history = updatedHistory)
        _namjari.value = _namjari.value + record
        logAction("CREATE", "NAMJARI", record.id, "নামজারি কেস #${record.caseNo} যোগ করা হয়েছে")
    }

    fun updateNamjariStatus(recordId: String, newStatus: AdminRecordStatus, rejectionReason: String? = null) {
        _namjari.value = _namjari.value.map { item ->
            if (item.id == recordId) {
                val newHistory = item.history + RecordHistoryItem(
                    fromStatus = item.status,
                    toStatus = newStatus,
                    reason = rejectionReason ?: "স্ট্যাটাস পরিবর্তন: ${newStatus.name}"
                )
                val updated = item.copy(
                    status = newStatus,
                    rejectionReason = if (newStatus == AdminRecordStatus.REJECTED) rejectionReason else item.rejectionReason,
                    history = newHistory
                )
                logAction("STATUS_CHANGE", "NAMJARI", recordId, "${item.status} -> $newStatus")
                updated
            } else item
        }
    }

    // Reset action
    fun resetData() {
        _plots.value = emptyList()
        _khatians.value = emptyList()
        _deeds.value = emptyList()
        _namjari.value = emptyList()
        _auditLogs.value = emptyList()
        logAction("RESET", "ALL", "ALL", "সকল এডমিন ডেটা মুছে ডিফল্ট অবস্থায় নেওয়া হয়েছে")
    }

    /**
     * ISOLATION RULE:
     * Only APPROVED admin records affect manual checks!
     * Draft, Review, Rejected, and Archived records DO NOT affect manual checks.
     */
    fun getApprovedLandData(baseData: LandData): LandData {
        val approvedPlots = _plots.value.filter { it.status == AdminRecordStatus.APPROVED }.map { it.toPlot() }
        val approvedKhatians = _khatians.value.filter { it.status == AdminRecordStatus.APPROVED }.map { it.toKhatian() }
        val approvedDeeds = _deeds.value.filter { it.status == AdminRecordStatus.APPROVED }.map { it.toDeed() }
        val approvedNamjari = _namjari.value.filter { it.status == AdminRecordStatus.APPROVED }.map { it.toNamjari() }

        return baseData.copy(
            plots = baseData.plots + approvedPlots,
            khatians = baseData.khatians + approvedKhatians,
            deeds = baseData.deeds + approvedDeeds,
            namjari = baseData.namjari + approvedNamjari
        )
    }
}
