package com.terrasync.terrashield.feature.judge

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.automirrored.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.theme.CadastralGold
import com.terrasync.terrashield.ui.theme.StatusGreen
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusYellow
import kotlinx.coroutines.delay

data class StoryStep(
    val stepIndex: Int,
    val titleBn: String,
    val titleEn: String,
    val subtitleBn: String,
    val subtitleEn: String,
    val descriptionBn: String,
    val descriptionEn: String,
    val icon: ImageVector,
    val highlightColor: Color
) {
    fun title(isEnglish: Boolean): String = if (isEnglish) titleEn else titleBn
    fun subtitle(isEnglish: Boolean): String = if (isEnglish) subtitleEn else subtitleBn
    fun description(isEnglish: Boolean): String = if (isEnglish) descriptionEn else descriptionBn
}

val STORY_STEPS = listOf(
    StoryStep(
        stepIndex = 1,
        titleBn = "১. মৌজা ও দাগ নম্বর নির্বাচন",
        titleEn = "1. Select Mouza & Plot Number",
        subtitleBn = "সঠিক মৌজা ও জমি চিহ্নিতকরণ",
        subtitleEn = "Identify target Mouza & Land Plot",
        descriptionBn = "ব্যবহারকারী মৌজা ও নির্দিষ্ট দাগ নম্বর (যেমন: দাগ ১০৩) প্রবেশ করান। সিস্টেম সাথে সাথে নকশায় জমি ও মোট আয়তন প্রদর্শন করে।",
        descriptionEn = "User enters Mouza and Plot No. 103. System instantly renders parcel map & total area.",
        icon = Icons.Rounded.Map,
        highlightColor = Color(0xFF0D9488)
    ),
    StoryStep(
        stepIndex = 2,
        titleBn = "২. খতিয়ান ও বিক্রেতা মেলা",
        titleEn = "2. Match Khatian & Seller Share",
        subtitleBn = "মালিকানার খতিয়ান হিস্যা পরীক্ষা",
        subtitleEn = "Verify ownership share in Khatian",
        descriptionBn = "বিএস খতিয়ানে বিক্রেতার নাম ও প্রাপ্য অংশের জমি (S=50 শতাংশ) সংক্রিয়ভাবে মূল রেকর্ড থেকে রিড করা হয়।",
        descriptionEn = "Seller's name and total khatian share (S = 50 decimals) are automatically retrieved.",
        icon = Icons.Rounded.Person,
        highlightColor = StatusGreen
    ),
    StoryStep(
        stepIndex = 3,
        titleBn = "৩. বায়া দলিল ও হস্তান্তর ট্রেইল",
        titleEn = "3. Deed History & Sales Trail",
        subtitleBn = "পূর্বে সম্পন্ন বিক্রয় হিসেব",
        subtitleEn = "Analyze past land transfers",
        descriptionBn = "পূর্বে বিক্রেতা কোনো অংশ বিক্রি করেছেন কিনা তা পূর্ববর্তী রেজিস্ট্রি দলিল ঘেঁটে বের করা হয় (যেমন: A=40 শতাংশ বিক্রি সম্পন্ন)।",
        descriptionEn = "Checks if seller sold land earlier via registered deeds (A = 40 decimals sold).",
        icon = Icons.AutoMirrored.Rounded.ReceiptLong,
        highlightColor = StatusYellow
    ),
    StoryStep(
        stepIndex = 4,
        titleBn = "৪. অতিরিক্ত জমি বিক্রি রোধ (R2)",
        titleEn = "4. Prevent Over-Selling (Rule R2)",
        subtitleBn = "অবশিষ্ট জমি হিসাব (L = S - A)",
        subtitleEn = "Calculate remaining balance (L = S - A)",
        descriptionBn = "বিক্রেতার অবশিষ্ট প্রাপ্য জমি L = 10 শতাংশ। নতুন ক্রেতা ২০ শতাংশ কিনতে চাইলে সিস্টেম রুল R2 প্রয়োগ করে লাল ফ্ল্যাগ দেয়।",
        descriptionEn = "Remaining share L = 10 decimals. Buyer wants 20 decimals -> Rule R2 flags HIGH RISK RED.",
        icon = Icons.Rounded.Warning,
        highlightColor = StatusRed
    ),
    StoryStep(
        stepIndex = 5,
        titleBn = "৫. স্বয়ংক্রিয় ৮ রুল ইঞ্জিনের শক্তি",
        titleEn = "5. Power of 8-Rule Engine",
        subtitleBn = "তাৎক্ষণিক ৮টি ঝুঁকি ক্যাটাগরি বিশ্লেষণ",
        subtitleEn = "Instant 8-category risk audit",
        descriptionBn = "R1 থেকে R8 পর্যন্ত সকল শর্ত মাত্র ১ সেকেন্ডে ব্যাকগ্রাউন্ডে যাচাই করে নির্ভুল স্ট্যাটাস ও পরামর্শ তৈরি হয়।",
        descriptionEn = "Scans R1 through R8 rules in under 1 second offline to issue risk alerts.",
        icon = Icons.Rounded.Shield,
        highlightColor = CadastralGold
    ),
    StoryStep(
        stepIndex = 6,
        titleBn = "৬. প্রমাণপত্র ও সময়রেখা প্রকাশ",
        titleEn = "6. Digital Evidence & PDF Report",
        subtitleBn = "সম্পূর্ণ ডিজিটাল হিস্ট্রি ও PDF প্রমাণপত্র",
        subtitleEn = "Complete timeline & exportable PDF",
        descriptionBn = "সকল দলিলের কালানুক্রমিক টাইমলাইন ও কিউআর-কোডযুক্ত আদালত-বান্ধব ডিজিটাল বিবাদ মুক্ত রিপোর্ট জেনারেট করা যায়।",
        descriptionEn = "Generates chronological deed history timeline & exportable digital verification report.",
        icon = Icons.Rounded.History,
        highlightColor = StatusGreen
    )
)

@Composable
fun StoryPlayerScreen(
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    var currentStepIndex by remember { mutableIntStateOf(0) }
    var isPaused by remember { mutableStateOf(false) }
    var stepProgress by remember { mutableFloatStateOf(0f) }

    // 10 seconds per step timer loop
    LaunchedEffect(currentStepIndex, isPaused) {
        if (!isPaused) {
            val totalMillis = 10000L
            val stepInterval = 100L
            var elapsed = (stepProgress * totalMillis).toLong()

            while (elapsed < totalMillis) {
                delay(stepInterval)
                if (!isPaused) {
                    elapsed += stepInterval
                    stepProgress = elapsed.toFloat() / totalMillis.toFloat()
                }
            }

            // Move to next step or loop back
            stepProgress = 0f
            currentStepIndex = (currentStepIndex + 1) % STORY_STEPS.size
        }
    }

    val currentStep = STORY_STEPS[currentStepIndex]

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPaused = true
                        tryAwaitRelease()
                        isPaused = false
                    }
                )
            }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Section: Step Indicators & Header Controls
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    STORY_STEPS.forEachIndexed { idx, _ ->
                        val progress = when {
                            idx < currentStepIndex -> 1f
                            idx == currentStepIndex -> stepProgress
                            else -> 0f
                        }

                        LinearProgressIndicator(
                            progress = { progress },
                            modifier = Modifier
                                .weight(1f)
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = CadastralGold,
                            trackColor = Color.White.copy(alpha = 0.2f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    EyebrowPill(
                        text = "৬০ সেকেন্ড ডেমো ওয়াকথ্রু (${currentStepIndex + 1}/৬)",
                        containerColor = CadastralGold.copy(alpha = 0.2f),
                        contentColor = CadastralGold
                    )

                    IconButton(
                        onClick = onClose,
                        modifier = Modifier.size(52.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = "বন্ধ করুন",
                            tint = Color.White
                        )
                    }
                }
            }

            // Middle Section: Animated Card
            AnimatedContent(
                targetState = currentStep,
                transitionSpec = {
                    fadeIn() togetherWith fadeOut()
                },
                label = "StoryStepTransition"
            ) { step ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    color = Color(0xFF1E293B)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(step.highlightColor.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = step.icon,
                                contentDescription = null,
                                tint = step.highlightColor,
                                modifier = Modifier.size(44.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

                        Text(
                            text = step.title(isEnglish),
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 22.sp
                            ),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.semantics { heading() }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = step.subtitle(isEnglish),
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = step.highlightColor,
                                fontWeight = FontWeight.SemiBold
                            ),
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = step.description(isEnglish),
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = Color(0xFFCBD5E1),
                                lineHeight = 26.sp
                            ),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            // Bottom Section: Playback Controls & Hint
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (isPaused) "⏸️ সাময়িক বিরতি (হাত রাখায় থেমেছে)" else "💡 স্ক্রিনে আঙুল চেপে রাখলে ওয়াকথ্রু থেমে থাকবে",
                    style = MaterialTheme.typography.labelMedium.copy(color = Color.White.copy(alpha = 0.7f))
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = {
                            stepProgress = 0f
                            currentStepIndex = if (currentStepIndex > 0) currentStepIndex - 1 else STORY_STEPS.size - 1
                        },
                        modifier = Modifier.size(52.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "আগের স্টেপ",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    IconButton(
                        onClick = { isPaused = !isPaused },
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(CadastralGold)
                    ) {
                        Icon(
                            imageVector = if (isPaused) Icons.Rounded.PlayArrow else Icons.Rounded.Pause,
                            contentDescription = if (isPaused) "প্লে করুন" else "পজ করুন",
                            tint = Color.Black,
                            modifier = Modifier.size(32.dp)
                        )
                    }

                    IconButton(
                        onClick = {
                            stepProgress = 0f
                            currentStepIndex = (currentStepIndex + 1) % STORY_STEPS.size
                        },
                        modifier = Modifier.size(52.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                            contentDescription = "পরের স্টেপ",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }
        }
    }
}
