package com.terrasync.terrashield.feature.admin

import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.data.repository.LandRecordRepositoryImpl
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.KhatianOwner
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.InputStreamReader

class AdminAuthAndIsolationTest {

    private lateinit var baseRepository: LandRecordRepositoryImpl
    private lateinit var adminRepository: AdminRepository

    @Before
    fun setUp() {
        baseRepository = LandRecordRepositoryImpl.createFromResources { path ->
            val isStream = javaClass.classLoader?.getResourceAsStream(path)
                ?: throw IllegalArgumentException("Resource not found: $path")
            InputStreamReader(isStream, Charsets.UTF_8).use { it.readText() }
        }
        adminRepository = AdminRepository()
    }

    @Test
    fun testPBKDF2PasswordHashingAndLogin() {
        // Test correct login
        val successRes = AdminAuth.login(AdminAuth.DEMO_EMAIL, AdminAuth.DEMO_PASSWORD)
        assertTrue("Correct credentials should log in successfully", successRes.success)
        assertTrue("Session should be valid after successful login", AdminAuth.isSessionValid())

        // Test logout
        AdminAuth.logout()
        assertFalse("Session should be invalid after logout", AdminAuth.isSessionValid())

        // Test wrong password
        val wrongPassRes = AdminAuth.login(AdminAuth.DEMO_EMAIL, "WrongPassword2026")
        assertFalse("Wrong password should fail login", wrongPassRes.success)
    }

    @Test
    fun testIsolationRuleForDraftAndReviewRecords() {
        val baseData = baseRepository.getLandData()

        // Create a draft plot in admin repository
        val draftPlot = AdminPlotRecord(
            mouzaId = "M901",
            dag = 999,
            totalArea = 100.0,
            status = AdminRecordStatus.DRAFT
        )
        adminRepository.addPlot(draftPlot)

        // Verify draft plot is NOT present in approved land data
        val landDataWithDraft = adminRepository.getApprovedLandData(baseData)
        val checkInput = CheckInput(mouzaId = "M901", dag = "999", area = "10", sellerId = "O01")
        val resultWithDraft = RuleEngine.check(checkInput, landDataWithDraft)

        assertEquals("Draft record must be isolated and return grey status", "grey", resultWithDraft.status)

        // Approve the draft plot
        adminRepository.updatePlotStatus(draftPlot.id, AdminRecordStatus.APPROVED)

        // Add an approved khatian for plot 999 so seller O01 owns land
        val approvedKhatian = AdminKhatianRecord(
            khatianNo = "K-999",
            mouzaId = "M901",
            dag = 999,
            recordDate = "2020-01-01",
            owners = listOf(KhatianOwner(personId = "O01", share = 50.0)),
            status = AdminRecordStatus.APPROVED
        )
        adminRepository.addKhatian(approvedKhatian)

        // Verify approved records now affect manual check
        val approvedLandData = adminRepository.getApprovedLandData(baseData)
        val resultApproved = RuleEngine.check(checkInput, approvedLandData)

        assertEquals("Approved admin record should enable manual check and return green status", "green", resultApproved.status)
    }

    @Test
    fun testRejectionRequiresReasonAndRemainsIsolated() {
        val baseData = baseRepository.getLandData()

        val deed = AdminDeedRecord(
            deedNo = "7777/2026",
            sellerId = "O01",
            buyerId = "P05",
            mouzaId = "M901",
            dag = 101,
            area = 30.0,
            date = "2026-02-01",
            status = AdminRecordStatus.REVIEW
        )
        adminRepository.addDeed(deed)

        // Reject deed with reason
        val rejectionReason = "দলিলের স্বাক্ষরে অমিল পাওয়া গেছে"
        adminRepository.updateDeedStatus(deed.id, AdminRecordStatus.REJECTED, rejectionReason)

        val rejectedRecord = adminRepository.deeds.value.first { it.id == deed.id }
        assertEquals(AdminRecordStatus.REJECTED, rejectedRecord.status)
        assertEquals(rejectionReason, rejectedRecord.rejectionReason)

        // Ensure rejected deed does not affect base test case 1 (Mouza M901, Dag 101, area 20)
        val checkInputCase1 = CheckInput(mouzaId = "M901", dag = "101", area = "20", sellerId = "O01")
        val resultCase1 = RuleEngine.check(checkInputCase1, adminRepository.getApprovedLandData(baseData))

        assertEquals("Rejected deed must remain isolated and keep base case green", "green", resultCase1.status)
    }
}
