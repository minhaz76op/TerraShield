package com.terrasync.terrashield.feature.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Lightbulb
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.terrashield.app.R
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.components.TagSim
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsButtonVariant
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.painters.MouzaMap
import com.terrasync.terrashield.ui.painters.ParcelBackground
import com.terrasync.terrashield.ui.theme.CadastralGold
import com.terrasync.terrashield.ui.theme.StatusGreen
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusYellow
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

@Immutable
data class RuleInfo(
    val code: String,
    val titleBn: String,
    val titleEn: String = titleBn,
    val summaryBn: String,
    val summaryEn: String = summaryBn,
    val detailBn: String,
    val detailEn: String = detailBn,
    val exampleBn: String,
    val exampleEn: String = exampleBn
) {
    fun title(isEnglish: Boolean): String = if (isEnglish) titleEn else titleBn
    fun summary(isEnglish: Boolean): String = if (isEnglish) summaryEn else summaryBn
    fun detail(isEnglish: Boolean): String = if (isEnglish) detailEn else detailBn
    fun example(isEnglish: Boolean): String = if (isEnglish) exampleEn else exampleBn
}

val RULE_LIST = listOf(
    RuleInfo(
        code = "R1",
        titleBn = "খতিয়ানে বিক্রেতার মালিকানা",
        titleEn = "Seller Ownership in Khatian",
        summaryBn = "খতিয়ানে বিক্রেতার নাম ও মালিকানার অংশ সঠিক কিনা যাচাই করে।",
        summaryEn = "Verifies seller's name and ownership share in the khatian.",
        detailBn = "খতিয়ানের মালিকের তালিকার সাথে বিক্রেতার এনআইডি বা নাম এবং মালিকানার শতাংশের হিস্যা সরাসরি মেলানো হয়। যদি নাম না থাকে বা খতিয়ান রেকর্ড না মেলে, তবে সতর্কবার্তা তৈরি হয়।",
        detailEn = "Directly matches seller's name and share percentage against the official khatian record.",
        exampleBn = "উদাহরণ: বিক্রেতা রহিম উদ্দিন ১/২ অংশের মালিক দাবি করছেন, কিন্তু বিএস খতিয়ানে তার নাম মাত্র ১/৪ অংশে রয়েছে।",
        exampleEn = "Example: Seller claims 1/2 share, but BS Khatian shows only 1/4 share."
    ),
    RuleInfo(
        code = "R2",
        titleBn = "মোট জমির চেয়ে অতিরিক্ত বিক্রি",
        titleEn = "Selling More Than Entitled",
        summaryBn = "দাগের মোট ক্ষেত্রফলের চেয়ে অতিরিক্ত জমি বিক্রির চেষ্টা ঠেকায়।",
        summaryEn = "Prevents selling more area than seller's remaining share in plot.",
        detailBn = "একটি দাগে বিক্রেতার প্রাপ্য মোট জমির চেয়ে বেশি জমি বিক্রি করতে চাইলে এই নিয়মটি ফ্ল্যাগ করে। সাবেক ও সাম্প্রতিক দলিলের যোগফল হিসাব করা হয়।",
        detailEn = "Flags if seller attempts to sell more land than available remaining share after past sales.",
        exampleBn = "উদাহরণ: দাগে বিক্রেতার মোট প্রাপ্য ২০ শতাংশ, কিন্তু তিনি দলিল করছেন ২৫ শতাংশের।",
        exampleEn = "Example: Seller has 20 decimals remaining, but attempts to sell 25 decimals."
    ),
    RuleInfo(
        code = "R3",
        titleBn = "বিক্রয়ের আগের দলিলের ধারাবাহিকতা",
        titleEn = "Chain of Title & Past Deeds",
        summaryBn = "বিক্রেতা যার কাছ থেকে কিনেছিলেন তার বায়ো-ডাটা বা দলিলের ট্রেইল যাচাই।",
        summaryEn = "Verifies seller's acquisition deed trail and registry office records.",
        detailBn = "বিক্রেতা যে দলিলের মূলে জমির মালিক হয়েছেন (ভায়া দলিল) তা সঠিক রেজিস্ট্রি অফিসে নিবন্ধিত কিনা এবং বায়া দলিলের দাতা ও গ্রহীতার তথ্য মিলছে কিনা পরীক্ষা করে।",
        detailEn = "Verifies if seller's acquisition deed (via deed) is legally registered and matches buyer/seller records.",
        exampleBn = "উদাহরণ: বিক্রেতার বায়না দলিলে উল্লেখিত রেজিস্ট্রি নম্বর ১০১২/২০১৯ হলেও সাব-রেজিস্ট্রি রেকর্ডে ওই নম্বরে অন্য জমি নিবন্ধিত।",
        exampleEn = "Example: Deed number 1012/2019 belongs to a different plot in sub-registry records."
    ),
    RuleInfo(
        code = "R4",
        titleBn = "নামজারি ও খতিয়ান সামঞ্জস্য",
        titleEn = "Mutation & Khatian Consistency",
        summaryBn = "নামজারি খতিয়ান (মিউটেশন) আসল কিনা এবং বিএস খতিয়ানের সাথে মিল আছে কিনা।",
        summaryEn = "Verifies if AC Land mutation records match official BS khatian records.",
        detailBn = "সহকারী কমিশনার (ভূমি) কার্যালয়ের নামজারি খতিয়ান কেস নম্বর ও খতিয়ান ডুপ্লিকেট কার্বন রসিদ (ডি সি আর) নম্বর মিলিয়ে দেখা হয়।",
        detailEn = "Verifies AC Land mutation case number and DCR receipt against official records.",
        exampleBn = "উদাহরণ: বিক্রেতা একটি নামজারি খতিয়ান উপস্থাপন করেছেন যার কেস নম্বর ভুয়া বা রসিদে তারিখের অসঙ্গতি।",
        exampleEn = "Example: Mutation case number is fake or receipt date mismatches."
    ),
    RuleInfo(
        code = "R5",
        titleBn = "জরিপ ধারাবাহিকতা (CS/SA/RS/BS)",
        titleEn = "Survey Continuity (CS/SA/RS/BS)",
        summaryBn = "সিএস, এসএ, আরএস থেকে বিএস খতিয়ানে দাগের পরিবর্তনের ট্রেইল।",
        summaryEn = "Tracks plot number changes from historic CS/SA/RS to BS surveys.",
        detailBn = "ঐতিহাসিক সিএস জরিপ থেকে শুরু করে বর্তমান বিএস জরিপ পর্যন্ত জমির সাবেক ও হাল দাগ নম্বরের রূপান্তর সঠিক কিনা পরীক্ষা করা হয়।",
        detailEn = "Validates plot number mapping across historic CS, SA, RS, and modern BS land surveys.",
        exampleBn = "উদাহরণ: আরএস ৫০ নম্বর দাগ বিএস ১০৩ নম্বর দাগে রূপান্তর দেখানো হয়েছে, কিন্তু রেকর্ড বইয়ে এটি ১০৫ নম্বর দাগ ছিল।",
        exampleEn = "Example: RS plot 50 mapped to BS plot 103 instead of actual BS plot 105."
    ),
    RuleInfo(
        code = "R6",
        titleBn = "একই জমির সাম্প্রতিক বারবার বিক্রি",
        titleEn = "Rapid Resale & Multiple Transfers",
        summaryBn = "স্বল্প সময়ে একই জমি একের অধিক ব্যক্তির কাছে হস্তান্তর বা জালিয়াতি।",
        summaryEn = "Detects multiple sales or transfers of the same land within short duration.",
        detailBn = "গত ৩ বছরের মধ্যে একই দাগের নির্দিষ্ট অংশ একাধিক ব্যক্তির কাছে বিক্রি বা বায়না করা হয়েছে কিনা তা অনুসন্ধান করে।",
        detailEn = "Detects rapid resales or multiple sales of the same land parcel within a short duration.",
        exampleBn = "উদাহরণ: দাগ ১০৩ এর ১০ শতাংশ জমি ৩ মাস আগে বিক্রি করা সত্ত্বেও পুনরায় অন্য ক্রেতার কাছে বিক্রির চেষ্টা।",
        exampleEn = "Example: 10 decimals sold 3 months ago is offered to another buyer again."
    ),
    RuleInfo(
        code = "R7",
        titleBn = "অপ্রাপ্তবয়স্ক বা যৌথ মালিকানা ঝুঁকি",
        titleEn = "Minor Heirs & Joint Ownership Risk",
        summaryBn = "মালিকদের মধ্যে নাবালক ওয়ারিশ বা যৌথ অংশীদারের সসম্মতিহীন বিক্রি।",
        summaryEn = "Checks co-sharer consent and court orders for minor heir properties.",
        detailBn = "পৈত্রিক সম্পত্তিতে সকল নিবন্ধিত ওয়ারিশদের প্রাপ্য হিস্যা ও নাবালকদের ক্ষেত্রে আদালতের অনুমতিপত্র আছে কিনা তা পরীক্ষা করে।",
        detailEn = "Checks co-sharers' consent and court permission required when selling minor heirs' land.",
        exampleBn = "উদাহরণ: ৫ জন ওয়ারিশের মধ্যে ৩ জন মিলে নাবালক ছোট ভাইয়ের অংশ বাদ দিয়ে পুরো জমি বিক্রির চেষ্টা করছে।",
        exampleEn = "Example: 3 out of 5 heirs attempt to sell without minor brother's court permission."
    ),
    RuleInfo(
        code = "R8",
        titleBn = "সরকারি / খাস / অর্পিত সম্পত্তি চিহ্নিতকরণ",
        titleEn = "Government / Khash / Vested Property",
        summaryBn = "জমিটি সরকারি খাস জমি, অর্পিত (Vested) বা নদী/খাল শ্রেণীভুক্ত কিনা।",
        summaryEn = "Identifies if plot falls under government khash, vested, or canal categories.",
        detailBn = "খাস জমি বা সরকারি ভেস্টেড প্রপার্টির গজেট তালিকার সাথে মৌজা ও দাগ নম্বর মিলিয়ে তাৎক্ষণিক লাল সতর্কবার্তা দেয়।",
        detailEn = "Checks if plot is listed under government vested property, khash land, or riverbanks.",
        exampleBn = "উদাহরণ: দাগ ১০৩ এর জমিটি 'ক' তফসিলভুক্ত অর্পিত সম্পত্তি বা সরকারি খাস জমি হিসেবে চিহ্নিত।",
        exampleEn = "Example: Plot 103 is gazetted as Schedule 'A' Vested Government Property."
    )
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun HomeScreen(
    onNavigateToCheck: () -> Unit,
    onNavigateToCalculator: () -> Unit,
    onNavigateToSamples: (() -> Unit)? = null,
    onNavigateToStoryPlayer: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var selectedRule by remember { mutableStateOf<RuleInfo?>(null) }
    val sheetState = rememberModalBottomSheetState()
    val onRuleClickLambda = remember { { rule: RuleInfo -> selectedRule = rule } }
    val onLearnMoreLambda = remember(onNavigateToSamples) { { onNavigateToSamples?.invoke(); Unit } }
    val onOpenStoryPlayerLambda = remember(onNavigateToStoryPlayer) { { onNavigateToStoryPlayer?.invoke(); Unit } }

    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Hero Section
        item(key = "hero", contentType = "hero") {
            HeroSection(
                onStartCheck = onNavigateToCheck,
                onLearnMore = onLearnMoreLambda,
                onOpenStoryPlayer = onOpenStoryPlayerLambda
            )
        }

        // 2. Problem Statement Section
        item(key = "problem", contentType = "problem") {
            ProblemSection()
        }

        // 3. 4 Steps Verification
        item(key = "steps", contentType = "steps") {
            FourStepsSection(onStartCheck = onNavigateToCheck)
        }

        // 4. 8 Rule Cards Header
        item(key = "rules_header", contentType = "rules_header") {
            RulesSectionHeader()
        }

        // 4b. Lazy Rule Cards for 120 FPS scrolling
        items(
            items = RULE_LIST,
            key = { it.code },
            contentType = { "rule_card" }
        ) { rule ->
            RuleCardItem(
                rule = rule,
                isEnglish = isEnglish,
                onRuleClick = onRuleClickLambda
            )
        }

        // 5. What it does / What it doesn't do
        item(key = "comparison", contentType = "comparison") {
            ComparisonSection()
        }

        // 6. Status Chips
        item(key = "status_chips", contentType = "status_chips") {
            StatusChipsSection()
        }

        // 7. Data Source & Disclaimer
        item(key = "disclaimer", contentType = "disclaimer") {
            DisclaimerSection()
        }
    }

    // Bottom Sheet for Rule Details
    selectedRule?.let { ruleInfo ->
        ModalBottomSheet(
            onDismissRequest = { selectedRule = null },
            sheetState = sheetState,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            RuleDetailBottomSheetContent(
                rule = ruleInfo,
                onClose = { selectedRule = null }
            )
        }
    }
}

@Composable
private fun HeroSection(
    onStartCheck: () -> Unit,
    onLearnMore: () -> Unit,
    onOpenStoryPlayer: (() -> Unit)? = null
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp))
    ) {
        // Animated Canvas Background
        ParcelBackground(
            modifier = Modifier.matchParentSize()
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.tslogo),
                        contentDescription = "TerraShield Logo",
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Fit
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "TerraShield",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    TagSim(text = if (isEnglish) "Demo" else "নমুনা")
                }

                EyebrowPill(
                    text = if (isEnglish) "60s Overview" else "৬০ সেকেন্ডে দেখুন",
                    icon = Icons.Rounded.PlayCircle,
                    containerColor = CadastralGold.copy(alpha = 0.2f),
                    contentColor = CadastralGold,
                    modifier = Modifier.clickable { onOpenStoryPlayer?.invoke() }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (isEnglish) "Verify Land Information Quickly & Easily" else "জমির তথ্য দ্রুত ও সহজভাবে যাচাই করুন",
                style = MaterialTheme.typography.displayMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 26.sp,
                lineHeight = 36.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (isEnglish) "Verify plot, khatian, and seller records to make risk-free decisions before paying or registering land." else "দাগ, খতিয়ান ও বিক্রেতার তথ্য মিলিয়ে ঝুঁকি মুক্ত সিদ্ধান্ত নিন। বায়না বা রেজিস্ট্রি করার আগে ভুয়া রেকর্ড থেকে রক্ষা পান।",
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFFD1FAE5),
                lineHeight = 24.sp
            )

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TsButton(
                    text = if (isEnglish) "Start Check" else "যাচাই শুরু করুন",
                    onClick = onStartCheck,
                    icon = Icons.Rounded.VerifiedUser,
                    modifier = Modifier.weight(1f)
                )

                TsButton(
                    text = if (isEnglish) "View Samples" else "নমুনা দেখুন",
                    onClick = onLearnMore,
                    variant = TsButtonVariant.Outlined,
                    contentColor = Color.White,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Embedded Mouza Map Preview
            Text(
                text = if (isEnglish) "Sample Map (Plot 103 highlighted):" else "নমুনা নকশা (দাগ ১০৩ চিহ্নিত):",
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFFA7F3D0)
            )

            Spacer(modifier = Modifier.height(8.dp))

            MouzaMap(
                highlightedDag = 103,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            )
        }
    }
}

@Composable
private fun ProblemSection() {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Rounded.ErrorOutline,
                contentDescription = null,
                tint = StatusRed,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isEnglish) "What is the Problem?" else "সমস্যাটা কী?",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = if (isEnglish) "In Bangladesh, nearly 40% of land buyers face title or record mismatch issues. Most common frauds include:" else "বাংলাদেশে জমি কেনার সময় প্রায় ৪০% ক্রেতা স্বত্ব বা রেকর্ডের অমিলজনিত জটিলতায় পড়েন। সবচেয়ে সাধারণ প্রতারণাগুলো হল:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(12.dp))

        val problems = remember(isEnglish) {
            if (isEnglish) listOf(
                "Selling the same plot secretively to multiple buyers.",
                "Selling land without name in khatian or using fake khatians.",
                "Selling more land than the seller's actual share in the plot.",
                "Selling government khash, vested, or riverbank lands."
            ) else listOf(
                "একই দাগের জমি দুই বা ততধিক ক্রেতার কাছে গোপন বায়না করে টাকা নেওয়া।",
                "বিক্রেতার খতিয়ানে নাম না থাকলেও বা ভূয়া খতিয়ান দেখিয়ে বিক্রয়।",
                "দাগে যে পরিমাণ জমি বিক্রেতার প্রাপ্য, তার চেয়ে বেশি জমি বিক্রি করা।",
                "খাস জমি, অর্পিত সম্পত্তি বা নদী/খাল শ্রেণীভুক্ত সরকারি জমি বিক্রি।"
            )
        }

        problems.forEach { p ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = "• ",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = StatusRed
                )
                Text(
                    text = p,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
private fun FourStepsSection(onStartCheck: () -> Unit) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.Shield,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isEnglish) "4 Simple Verification Steps" else "৪ ধাপে সহজ যাচাই",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                text = if (isEnglish) "Just 1 min" else "মাত্র ১ মিনিট",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        val steps = remember(isEnglish) {
            if (isEnglish) listOf(
                Triple("1", "Select District & Mouza", "Choose target region and mouza"),
                Triple("2", "Plot & Area Info", "Enter plot number and proposed land area"),
                Triple("3", "Seller & Deed Matching", "Provide seller name & acquisition deed"),
                Triple("4", "Risk Report & Guidance", "Get automated 8-rule findings report")
            ) else listOf(
                Triple("১", "জেলা ও মৌজা নির্বাচন", "আপনার কাক্সিক্ষত এলাকা ও মৌজা সিলেক্ট করুন"),
                Triple("২", "দাগ ও পরিমাণের তথ্য", "দাগ নম্বর ও প্রস্তাবিত জমি শতাংশে দিন"),
                Triple("৩", "বিক্রেতা ও দলিল মিল", "বিক্রেতার নাম ও বায়না/বায়া দলিল দিন"),
                Triple("৪", "ঝুঁকি রিপোর্ট ও নির্দেশনা", "৮টি রুলের রেজাল্ট ও পরবর্তী পদক্ষেপ পান")
            )
        }

        steps.forEach { (num, title, sub) ->
            TsCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = num,
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = sub,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RulesSectionHeader() {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Rounded.Lightbulb,
                contentDescription = null,
                tint = CadastralGold,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isEnglish) "8 Automated Rules (Rule Engine)" else "স্বয়ংক্রিয় ৮টি নিয়ম (Rule Engine)",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = if (isEnglish) "Tap any rule to view details and real scenarios:" else "টেপ করে বিস্তারিত নীতি ও বাস্তব উদাহরণ দেখুন:",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun RuleCardItem(
    rule: RuleInfo,
    isEnglish: Boolean,
    onRuleClick: (RuleInfo) -> Unit
) {
    val onClick = remember(rule, onRuleClick) { { onRuleClick(rule) } }

    Box(modifier = Modifier.padding(horizontal = 20.dp)) {
        TsCard(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Text(
                            text = rule.code,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = rule.title(isEnglish),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = rule.summary(isEnglish),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }
                }

                Icon(
                    imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun ComparisonSection() {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Text(
            text = if (isEnglish) "What it Does / Doesn't Do" else "কী করে / কী করে না?",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // What it does
            TsCard(
                modifier = Modifier.weight(1f),
                containerColor = Color(0xFFF0FDF4),
                borderColor = Color(0xFFBBF7D0)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.CheckCircle,
                            contentDescription = null,
                            tint = StatusGreen,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isEnglish) "What it Does" else "কী করে",
                            style = MaterialTheme.typography.titleSmall,
                            color = StatusGreen,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    val does = remember(isEnglish) {
                        if (isEnglish) listOf(
                            "Matches sample records",
                            "Calculates share math",
                            "Flags automated risks",
                            "Promotes land safety"
                        ) else listOf(
                            "নমুনা রেকর্ডের সাথে তথ্য মেলায়",
                            "গণিত ও হিস্যা হিসাব করে",
                            "স্বয়ংক্রিয় ঝুঁকি ফ্ল্যাগ দেয়",
                            "সচেতনতা বৃদ্ধি করে"
                        )
                    }
                    does.forEach { item ->
                        Text(
                            text = "✓ $item",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF166534),
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                    }
                }
            }

            // What it doesn't do
            TsCard(
                modifier = Modifier.weight(1f),
                containerColor = Color(0xFFFEF2F2),
                borderColor = Color(0xFFFECACA)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = null,
                            tint = StatusRed,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isEnglish) "What it Doesn't" else "কী করে না",
                            style = MaterialTheme.typography.titleSmall,
                            color = StatusRed,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    val doesnt = remember(isEnglish) {
                        if (isEnglish) listOf(
                            "Not a legal guarantee",
                            "Not a govt office",
                            "Not an ownership proof",
                            "Not an on-site survey"
                        ) else listOf(
                            "আইনি নিশ্চিতকরণ নয়",
                            "সরকারি ভূমি অফিস নয়",
                            "মালিকানার সার্টিফিকেট নয়",
                            "আমিন দ্বারা জরিপ নয়"
                        )
                    }
                    doesnt.forEach { item ->
                        Text(
                            text = "✕ $item",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF991B1B),
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusChipsSection() {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Text(
            text = if (isEnglish) "Data Modes & Status:" else "ডেটা মোড ও স্ট্যাটাস:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            EyebrowPill(
                text = if (isEnglish) "Live Mode (API)" else "বাস্তব মোড (API)",
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
            )
            EyebrowPill(
                text = if (isEnglish) "Sample Mode (Offline)" else "নমুনা মোড (অফলাইন)",
                containerColor = StatusYellowContainer,
                contentColor = StatusYellow
            )
        }
    }
}

@Composable
private fun DisclaimerSection() {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    TsCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isEnglish) "Important Disclaimer & Sources" else "গুরুত্বপূর্ণ ঘোষণা ও তথ্যসূত্র",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (isEnglish) "TerraShield is an educational risk analysis demo app using simulated data. Before buying land, always verify physical registers at the local land office with a lawyer." else "TerraShield একটি শিক্ষামূলক ও ঝুঁকি বিশ্লেষণমূলক অ্যাপ। প্রদর্শিত তথ্যাবলি অফলাইন নমুনা ডেটাভিত্তিক। কোনো জমি কেনার সিদ্ধান্ত নেওয়ার পূর্বে অবশ্যই স্থানীয় ভূমি অফিস (এসিল্যান্ড/তহসিল) এবং বিজ্ঞ আইনজীবীর মাধ্যমে মূল বালাম বই পরীক্ষা করুন।",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun RuleDetailBottomSheetContent(
    rule: RuleInfo,
    onClose: () -> Unit
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Text(
                        text = rule.code,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = rule.title(isEnglish),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            IconButton(onClick = onClose) {
                Icon(imageVector = Icons.Rounded.Close, contentDescription = if (isEnglish) "Close" else "বন্ধ করুন")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = if (isEnglish) "Rule Detailed Description:" else "নিয়মের বিস্তারিত বিবরণ:",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = rule.detail(isEnglish),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(16.dp))

        TsCard(
            modifier = Modifier.fillMaxWidth(),
            containerColor = StatusYellowContainer.copy(alpha = 0.5f),
            borderColor = CadastralGold
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.Warning,
                        contentDescription = null,
                        tint = CadastralGold,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isEnglish) "Practical Example Scenario:" else "বাস্তব উদাহরণ দৃশ্যপট:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF78350F)
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = rule.example(isEnglish),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF78350F)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        TsButton(
            text = if (isEnglish) "Got it" else "বুঝতে পেরেছি",
            onClick = onClose,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
