package com.terrasync.terrashield.feature.checking

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.ui.components.TagSim
import com.terrasync.terrashield.ui.components.TsCard
import kotlinx.coroutines.delay

@Composable
fun CheckingScanScreen(
    input: CheckInput,
    onScanComplete: () -> Unit,
    reduceMotion: Boolean = false,
    modifier: Modifier = Modifier
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()
    var stepCompletedCount by remember { mutableIntStateOf(if (reduceMotion) 3 else 0) }

    LaunchedEffect(reduceMotion) {
        if (reduceMotion) {
            onScanComplete()
        } else {
            delay(350)
            stepCompletedCount = 1
            delay(350)
            stepCompletedCount = 2
            delay(350)
            stepCompletedCount = 3
            delay(250)
            onScanComplete()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            TagSim(text = if (isEnglish) "Sample / Demo Data" else "কাল্পনিক / নমুনা তথ্য")

            Spacer(modifier = Modifier.height(24.dp))

            Surface(
                modifier = Modifier.size(90.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Rounded.Shield,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(48.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = if (isEnglish) "Automated Verification in Progress..." else "স্বয়ংক্রিয় তথ্য যাচাই চলছে...",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (isEnglish) "Matching records against 8 security rules in sample database" else "নমুনা ডাটাবেসের ৮টি সুরক্ষা নিয়মে তথ্য মেলানো হচ্ছে",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))

            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    ScanCheckRow(
                        title = if (isEnglish) "1. Khatian Record Server" else "১. খতিয়ান রেকর্ড অনলাইন সার্ভার",
                        isCompleted = stepCompletedCount >= 1
                    )
                    ScanCheckRow(
                        title = if (isEnglish) "2. Sub-Registry Deed Index" else "২. সাব-রেজিস্ট্রি দলিল সূচি",
                        isCompleted = stepCompletedCount >= 2
                    )
                    ScanCheckRow(
                        title = if (isEnglish) "3. e-Mutation Database" else "৩. ই-নামজারি ও জমাভাগ ডাটাবেস",
                        isCompleted = stepCompletedCount >= 3
                    )
                }
            }
        }
    }
}

@Composable
private fun ScanCheckRow(
    title: String,
    isCompleted: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge.copy(
                fontWeight = if (isCompleted) FontWeight.Bold else FontWeight.Normal
            ),
            color = if (isCompleted) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (isCompleted) {
            AnimatedVisibility(
                visible = true,
                enter = fadeIn() + scaleIn()
            ) {
                Icon(
                    imageVector = Icons.Rounded.CheckCircle,
                    contentDescription = "সম্পন্ন",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(22.dp)
                )
            }
        } else {
            CircularProgressIndicator(
                modifier = Modifier.size(18.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.primaryContainer
            )
        }
    }
}
