package com.terrasync.terrashield.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.runtime.remember
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.terrasync.terrashield.domain.model.OverallStatus
import com.terrasync.terrashield.domain.model.RiskLevel
import com.terrasync.terrashield.ui.theme.ButtonShape
import com.terrasync.terrashield.ui.theme.CardShape
import com.terrasync.terrashield.ui.theme.ChipShape
import com.terrasync.terrashield.ui.theme.StatusGreen
import com.terrasync.terrashield.ui.theme.StatusGreenContainer
import com.terrasync.terrashield.ui.theme.StatusGrey
import com.terrasync.terrashield.ui.theme.StatusGreyContainer
import com.terrasync.terrashield.ui.theme.StatusOnGreenContainer
import com.terrasync.terrashield.ui.theme.StatusOnGreyContainer
import com.terrasync.terrashield.ui.theme.StatusOnRedContainer
import com.terrasync.terrashield.ui.theme.StatusOnYellowContainer
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusRedContainer
import com.terrasync.terrashield.ui.theme.StatusYellow
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

enum class TsButtonVariant {
    Primary, Secondary, Outlined, Text
}

@Composable
fun TsButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: TsButtonVariant = TsButtonVariant.Primary,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
    containerColor: Color? = null,
    contentColor: Color? = null
) {
    val shape = ButtonShape

    when (variant) {
        TsButtonVariant.Primary -> {
            val bg = containerColor ?: MaterialTheme.colorScheme.primary
            val fg = contentColor ?: MaterialTheme.colorScheme.onPrimary
            Button(
                onClick = onClick,
                enabled = enabled && !loading,
                modifier = modifier,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = bg,
                    contentColor = fg
                )
            ) {
                ButtonContent(text = text, loading = loading, icon = icon, contentColor = fg)
            }
        }
        TsButtonVariant.Secondary -> {
            val bg = containerColor ?: MaterialTheme.colorScheme.secondaryContainer
            val fg = contentColor ?: MaterialTheme.colorScheme.onSecondaryContainer
            Button(
                onClick = onClick,
                enabled = enabled && !loading,
                modifier = modifier,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = bg,
                    contentColor = fg
                )
            ) {
                ButtonContent(text = text, loading = loading, icon = icon, contentColor = fg)
            }
        }
        TsButtonVariant.Outlined -> {
            val fg = contentColor ?: MaterialTheme.colorScheme.primary
            OutlinedButton(
                onClick = onClick,
                enabled = enabled && !loading,
                modifier = modifier,
                shape = shape,
                border = BorderStroke(1.5.dp, containerColor ?: MaterialTheme.colorScheme.outline),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = fg)
            ) {
                ButtonContent(text = text, loading = loading, icon = icon, contentColor = fg)
            }
        }
        TsButtonVariant.Text -> {
            val fg = contentColor ?: MaterialTheme.colorScheme.primary
            TextButton(
                onClick = onClick,
                enabled = enabled && !loading,
                modifier = modifier,
                colors = ButtonDefaults.textButtonColors(contentColor = fg)
            ) {
                ButtonContent(text = text, loading = loading, icon = icon, contentColor = fg)
            }
        }
    }
}

@Composable
private fun ButtonContent(
    text: String,
    loading: Boolean,
    icon: ImageVector?,
    contentColor: Color
) {
    if (loading) {
        CircularProgressIndicator(
            modifier = Modifier.size(18.dp),
            color = contentColor,
            strokeWidth = 2.dp
        )
        Spacer(modifier = Modifier.width(8.dp))
    } else if (icon != null) {
        Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(8.dp))
    }
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
    )
}

@Composable
fun TsCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    borderColor: Color? = MaterialTheme.colorScheme.outlineVariant,
    elevation: Dp = 0.dp,
    shape: Shape = CardShape,
    content: @Composable () -> Unit
) {
    val borderModifier = remember(borderColor) {
        if (borderColor != null) Modifier.border(1.dp, borderColor, shape) else Modifier
    }
    val clickModifier = remember(onClick) {
        if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
    }

    Box(
        modifier = modifier
            .clip(shape)
            .background(containerColor)
            .then(borderModifier)
            .then(clickModifier)
    ) {
        content()
    }
}

@Composable
fun StatusBadge(
    status: OverallStatus,
    modifier: Modifier = Modifier,
    customLabel: String? = null
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    val (bg, fg, text, icon) = when (status) {
        OverallStatus.RED -> Quadruple(
            StatusRedContainer,
            StatusOnRedContainer,
            customLabel ?: if (isEnglish) "Serious Mismatch" else "গুরুতর অমিল",
            Icons.Rounded.ErrorOutline
        )
        OverallStatus.YELLOW -> Quadruple(
            StatusYellowContainer,
            StatusOnYellowContainer,
            customLabel ?: if (isEnglish) "Caution Needed" else "যাচাই প্রয়োজন",
            Icons.Rounded.Warning
        )
        OverallStatus.GREEN -> Quadruple(
            StatusGreenContainer,
            StatusOnGreenContainer,
            customLabel ?: if (isEnglish) "All Verified" else "সব ঠিক আছে",
            Icons.Rounded.CheckCircle
        )
        OverallStatus.GREY -> Quadruple(
            StatusGreyContainer,
            StatusOnGreyContainer,
            customLabel ?: if (isEnglish) "Record Not Found" else "তথ্য পাওয়া যায়নি",
            Icons.Rounded.Info
        )
        OverallStatus.INVALID -> Quadruple(
            StatusRedContainer,
            StatusOnRedContainer,
            customLabel ?: if (isEnglish) "Invalid Entry" else "অকার্যকর তথ্য",
            Icons.Rounded.ErrorOutline
        )
    }

    Surface(
        modifier = modifier,
        shape = ChipShape,
        color = bg,
        contentColor = fg
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = fg
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = fg
            )
        }
    }
}

@Composable
fun RiskBadge(
    riskLevel: RiskLevel,
    modifier: Modifier = Modifier
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()

    val status = when (riskLevel) {
        RiskLevel.HIGH -> OverallStatus.RED
        RiskLevel.MEDIUM -> OverallStatus.YELLOW
        RiskLevel.INFO -> OverallStatus.GREEN
    }
    val label = when (riskLevel) {
        RiskLevel.HIGH -> if (isEnglish) "High Risk" else "উচ্চ ঝুঁকি"
        RiskLevel.MEDIUM -> if (isEnglish) "Medium Risk" else "মাঝারি ঝুঁকি"
        RiskLevel.INFO -> if (isEnglish) "Info" else "তথ্য"
    }
    StatusBadge(status = status, modifier = modifier, customLabel = label)
}

@Composable
fun EyebrowPill(
    text: String,
    modifier: Modifier = Modifier,
    containerColor: Color = MaterialTheme.colorScheme.primaryContainer,
    contentColor: Color = MaterialTheme.colorScheme.onPrimaryContainer,
    icon: ImageVector? = null
) {
    Box(
        modifier = modifier
            .clip(ChipShape)
            .background(containerColor)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp),
                    tint = contentColor
                )
                Spacer(modifier = Modifier.width(4.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                color = contentColor
            )
        }
    }
}

@Composable
fun TagSim(
    modifier: Modifier = Modifier,
    text: String = "কাল্পনিক / সিমুলেটেড"
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()
    val displayTag = if (text == "কাল্পনিক / সিমুলেটেড") {
        if (isEnglish) "Sample / Demo Data" else "কাল্পনিক / সিমুলেটেড"
    } else text

    EyebrowPill(
        text = displayTag,
        modifier = modifier,
        containerColor = StatusYellowContainer,
        contentColor = StatusOnYellowContainer,
        icon = Icons.Rounded.Info
    )
}

@Composable
fun StepProgress(
    currentStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier,
    stepTitle: String? = null
) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()
    val progress = currentStep.toFloat() / totalSteps.coerceAtLeast(1).toFloat()
    val animatedProgress by animateFloatAsState(targetValue = progress, label = "StepProgress")

    Column(modifier = modifier) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stepTitle ?: if (isEnglish) "Step $currentStep / $totalSteps" else "ধাপ ${com.terrasync.terrashield.core.i18n.BanglaFormatter.toBanglaDigits(currentStep)} / ${com.terrasync.terrashield.core.i18n.BanglaFormatter.toBanglaDigits(totalSteps)}",
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "${(animatedProgress * 100).toInt()}%",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { animatedProgress },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(CircleShape),
            color = MaterialTheme.colorScheme.primary,
            trackColor = MaterialTheme.colorScheme.primaryContainer
        )
    }
}

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
