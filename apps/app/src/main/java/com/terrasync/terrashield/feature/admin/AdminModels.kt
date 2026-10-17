package com.terrasync.terrashield.feature.admin

import com.terrasync.terrashield.domain.model.Deed
import com.terrasync.terrashield.domain.model.Khatian
import com.terrasync.terrashield.domain.model.KhatianOwner
import com.terrasync.terrashield.domain.model.LocalizedText
import com.terrasync.terrashield.domain.model.Namjari
import com.terrasync.terrashield.domain.model.Plot

enum class AdminRecordStatus(val displayNameBn: String) {
    DRAFT("ড্রাফট (Draft)"),
    REVIEW("রিভিউাধীন (Review)"),
    APPROVED("অনুমোদিত (Approved)"),
    REJECTED("বাতিলকৃত (Rejected)"),
    ARCHIVED("আর্কাইভকৃত (Archived)")
}

data class RecordHistoryItem(
    val timestampMs: Long = System.currentTimeMillis(),
    val user: String = "demo.admin@terrashield.local",
    val fromStatus: AdminRecordStatus,
    val toStatus: AdminRecordStatus,
    val reason: String? = null
)

data class AuditLogEntry(
    val id: String = java.util.UUID.randomUUID().toString(),
    val timestampMs: Long = System.currentTimeMillis(),
    val user: String = "demo.admin@terrashield.local",
    val action: String,
    val recordType: String,
    val recordId: String,
    val comment: String? = null
)

data class AdminPlotRecord(
    val id: String = java.util.UUID.randomUUID().toString(),
    val mouzaId: String,
    val dag: Int,
    val totalArea: Double,
    val status: AdminRecordStatus = AdminRecordStatus.DRAFT,
    val rejectionReason: String? = null,
    val history: List<RecordHistoryItem> = emptyList()
) {
    fun toPlot(): Plot = Plot(mouzaId = mouzaId, dag = dag, totalArea = totalArea)
}

data class AdminKhatianRecord(
    val id: String = java.util.UUID.randomUUID().toString(),
    val khatianNo: String,
    val mouzaId: String,
    val dag: Int,
    val survey: String = "BS",
    val recordDate: String,
    val owners: List<KhatianOwner>,
    val status: AdminRecordStatus = AdminRecordStatus.DRAFT,
    val rejectionReason: String? = null,
    val history: List<RecordHistoryItem> = emptyList()
) {
    fun toKhatian(): Khatian = Khatian(
        khatianNo = khatianNo,
        mouzaId = mouzaId,
        dag = dag,
        survey = survey,
        recordDate = recordDate,
        owners = owners
    )
}

data class AdminDeedRecord(
    val id: String = java.util.UUID.randomUUID().toString(),
    val deedNo: String,
    val office: String = "Sub-Registry Office",
    val date: String,
    val sellerId: String,
    val buyerId: String,
    val mouzaId: String,
    val dag: Int,
    val area: Double,
    val status: AdminRecordStatus = AdminRecordStatus.DRAFT,
    val rejectionReason: String? = null,
    val history: List<RecordHistoryItem> = emptyList()
) {
    fun toDeed(): Deed = Deed(
        id = id,
        deedNo = deedNo,
        office = office,
        date = date,
        sellerId = sellerId,
        buyerId = buyerId,
        mouzaId = mouzaId,
        dag = dag,
        area = area
    )
}

data class AdminNamjariRecord(
    val id: String = java.util.UUID.randomUUID().toString(),
    val caseNo: String,
    val mouzaId: String,
    val dag: Int,
    val applicantId: String,
    val basis: String,
    val deedId: String? = null,
    val namjariStatus: String = "approved",
    val date: String,
    val status: AdminRecordStatus = AdminRecordStatus.DRAFT,
    val rejectionReason: String? = null,
    val history: List<RecordHistoryItem> = emptyList()
) {
    fun toNamjari(): Namjari = Namjari(
        caseNo = caseNo,
        mouzaId = mouzaId,
        dag = dag,
        applicantId = applicantId,
        basis = basis,
        deedId = deedId,
        status = namjariStatus,
        date = date
    )
}
