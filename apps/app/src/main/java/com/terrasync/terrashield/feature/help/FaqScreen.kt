package com.terrasync.terrashield.feature.help

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.HelpOutline
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.HelpOutline
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.ui.components.TsCard

data class FaqItem(
    val id: String,
    val questionBn: String,
    val questionEn: String,
    val answerBn: String,
    val answerEn: String
) {
    fun question(isEnglish: Boolean): String = if (isEnglish) questionEn else questionBn
    fun answer(isEnglish: Boolean): String = if (isEnglish) answerEn else answerBn
}

val FAQ_LIST = listOf(
    FaqItem(
        id = "faq-1",
        questionBn = "TerraShield কীভাবে কাজ করে?",
        questionEn = "How does TerraShield work?",
        answerBn = "TerraShield ভূমি রেকর্ডের খতিয়ান, বায়া দলিল ও নামজারির তথ্য মিলিয়ে স্বয়ংক্রিয় ৮টি নিয়ম (Rules) প্রয়োগ করে। এটি বিক্রেতার প্রকৃত প্রাপ্য হিস্যার সাথে প্রস্তাবিত বিক্রয়ের পরিমাণ গাণিতিকভাবে মিলিয়ে ঝুঁকির সতর্কতা দেয়।",
        answerEn = "TerraShield cross-references land khatians, deeds, and mutation records using an automated 8-rule engine to calculate mathematical share availability and flag risk scenarios."
    ),
    FaqItem(
        id = "faq-2",
        questionBn = "ভূমি যাচাইয়ে লাল, হলুদ, সবুজ সংকেতের অর্থ কী?",
        questionEn = "What do Green, Yellow, and Red status mean?",
        answerBn = "🟢 সবুজ: তথ্যে কোনো অসঙ্গতি পাওয়া যায়নি (নিরাপদ)।\n🟡 হলুদ: সতর্কীকরণ বা আংশিক তথ্য অনুপস্থিত (সাবধানতা কাম্য)।\n🔴 লাল: গুরুতর ঝুঁকি বা জালিয়াতির চেষ্টা ফ্ল্যাগ করা হয়েছে (উচ্চ ঝুঁকি)।\n⚪ ধূসর: জমি নমুনা রেকর্ডে অনুপস্থিত।",
        answerEn = "🟢 Green: No record mismatch found (Safe).\n🟡 Yellow: Caution / missing details required.\n🔴 Red: Serious fraud risk or double-selling detected.\n⚪ Grey: Land record not found in sample database."
    ),
    FaqItem(
        id = "faq-3",
        questionBn = "অ্যাপটি কি সম্পূর্ণ অফলাইনে কাজ করে?",
        questionEn = "Does the app work offline?",
        answerBn = "হ্যাঁ! TerraShield স্থানীয় ডিভাইসে দ্রুত লাইটওয়েট মেমোরি স্ট্রাকচার ব্যবহার করে সম্পূর্ণ অফলাইনে ১ সেকেন্ডের কম সময়ে জটিল নিয়ম বিশ্লেষণ করতে সক্ষম।",
        answerEn = "Yes! TerraShield runs 100% offline on-device, calculating complex rule matrices in under 1 second."
    ),
    FaqItem(
        id = "faq-4",
        questionBn = "স্বয়ংক্রিয় ৮টি নিয়ম (Rules) কী কী?",
        questionEn = "What are the 8 automated Rules?",
        answerBn = "R1: খতিয়ানে নামজারি\nR2: অতিরিক্ত জমি বিক্রি রোধ\nR3: বায়া দলিলের ট্রেইল\nR4: দ্বৈত বিক্রি রোধ\nR5: অন্যের নামজারি ঝুলন্ত\nR6: খতিয়ানের মোট হিস্যা অতিরিক্ত\nR7a/b: হস্তান্তরের তারিখ অসঙ্গতি ও দ্রুত হাতবদল\nR8a/b/c: ভুয়া বা ডুপ্লিকেট দলিল নম্বর।",
        answerEn = "R1: Seller in Khatian\nR2: Over-selling prevention\nR3: Acquisition deed trail\nR4: Mutation case check\nR5: Pending mutation conflicts\nR6: Khatian total share excess\nR7: Rapid resales & date anomalies\nR8: Fake or duplicate deed numbers."
    ),
    FaqItem(
        id = "faq-5",
        questionBn = "আমার দেয়া তথ্য কি সরকারি বা বাইরের সার্ভারে পাঠানো হয়?",
        questionEn = "Is my data sent to external servers?",
        answerBn = "না। আপনার প্রদেয় সকল তথ্য স্থানীয় ডিভাইসে সুরক্ষিত থাকে। TerraShield কোনো সরকারি সেবা বা বালাম বই পরিবর্তন করার পোর্টাল নয়।",
        answerEn = "No. All inputs remain strictly on your local device. TerraShield does not upload data or modify official government registers."
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FaqScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isEnglish) "Frequently Asked Questions (FAQ)" else "সাধারণ জিজ্ঞাসাবলি (FAQ)",
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
                            contentDescription = if (isEnglish) "Back" else "ফিরে যান"
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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.HelpOutline,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isEnglish) "Frequently Asked Questions" else "প্রায়শই জিজ্ঞাসিত প্রশ্নাবলি",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.semantics { heading() }
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (isEnglish) "Detailed answers regarding TerraShield usage and land record verification are provided below." else "TerraShield ব্যবহার ও ভূমি রেকর্ড যাচাইকরণ সম্পর্কিত সচরাচর প্রশ্নের উত্তর নিচে বিস্তারিত দেয়া হল।",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            items(FAQ_LIST, key = { it.id }) { item ->
                FaqCardItem(item = item, isEnglish = isEnglish)
            }

            item {
                Spacer(modifier = Modifier.height(110.dp))
            }
        }
    }
}

@Composable
private fun FaqCardItem(item: FaqItem, isEnglish: Boolean = false) {
    var expanded by remember { mutableStateOf(false) }

    TsCard(
        onClick = { expanded = !expanded },
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.question(isEnglish),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier
                        .weight(1f)
                        .semantics { heading() }
                )

                Icon(
                    imageVector = if (expanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
                    contentDescription = if (expanded) "Collapse" else "Expand",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
            }

            AnimatedVisibility(visible = expanded) {
                Column {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = item.answer(isEnglish),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
