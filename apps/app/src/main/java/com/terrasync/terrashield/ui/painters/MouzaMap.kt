package com.terrasync.terrashield.ui.painters

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.theme.CadastralGold
import com.terrasync.terrashield.ui.theme.StatusRed
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

private val NORMAL_PLOT_BG = Color(0x2281C784)
private val NORMAL_PLOT_STROKE_COLOR = Color(0xFF81C784)
private val NORMAL_STROKE = Stroke(width = 3f)
private val HIGHLIGHT_STROKE = Stroke(width = 5f)
private val HATCH_COLOR = StatusRed.copy(alpha = 0.6f)

@Composable
fun MouzaMap(
    modifier: Modifier = Modifier,
    highlightedDag: Int = 103,
    mouzaName: String = "কাল্পনিক মৌজা (জে.এল. ৪৫)"
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val displayMouzaName = if (mouzaName == "কাল্পনিক মৌজা (জে.এল. ৪৫)") {
        if (isEnglish) "Demo Mouza (J.L. 45)" else "কাল্পনিক মৌজা (জে.এল. ৪৫)"
    } else mouzaName

    val textPaint = remember {
        Paint().apply {
            color = android.graphics.Color.WHITE
            textSize = 32f
            typeface = Typeface.DEFAULT_BOLD
            textAlign = Paint.Align.CENTER
        }
    }

    val highlightTextPaint = remember {
        Paint().apply {
            color = StatusRed.toArgb()
            textSize = 36f
            typeface = Typeface.DEFAULT_BOLD
            textAlign = Paint.Align.CENTER
        }
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0F2618))
            .border(1.dp, Color(0x4481C784), RoundedCornerShape(16.dp))
            .drawWithCache {
                val w = size.width
                val h = size.height

                val p101 = Path().apply {
                    moveTo(w * 0.05f, h * 0.12f)
                    lineTo(w * 0.48f, h * 0.10f)
                    lineTo(w * 0.42f, h * 0.45f)
                    lineTo(w * 0.05f, h * 0.42f)
                    close()
                }

                val p102 = Path().apply {
                    moveTo(w * 0.48f, h * 0.10f)
                    lineTo(w * 0.95f, h * 0.15f)
                    lineTo(w * 0.90f, h * 0.48f)
                    lineTo(w * 0.42f, h * 0.45f)
                    close()
                }

                val p103 = Path().apply {
                    moveTo(w * 0.05f, h * 0.42f)
                    lineTo(w * 0.42f, h * 0.45f)
                    lineTo(w * 0.38f, h * 0.85f)
                    lineTo(w * 0.05f, h * 0.80f)
                    close()
                }

                val p104 = Path().apply {
                    moveTo(w * 0.42f, h * 0.45f)
                    lineTo(w * 0.90f, h * 0.48f)
                    lineTo(w * 0.85f, h * 0.88f)
                    lineTo(w * 0.38f, h * 0.85f)
                    close()
                }

                val isHighlighted = (highlightedDag == 103)
                val highlightBg = if (isHighlighted) Color(0x44DC2626) else Color(0x2281C784)
                val highlightStroke = if (isHighlighted) StatusRed else CadastralGold

                val langTag = if (isEnglish) "en" else "bn"
                val text101 = BanglaFormatter.toBanglaDigits("101", langTag)
                val text102 = BanglaFormatter.toBanglaDigits("102", langTag)
                val text104 = BanglaFormatter.toBanglaDigits("104", langTag)
                val label103 = if (isEnglish) "Plot " + BanglaFormatter.toBanglaDigits("103", "en") else "দাগ " + BanglaFormatter.toBanglaDigits("103", "bn")

                // Pre-compute hatch line Offsets inside cache block
                val hatchLines = mutableListOf<Pair<Offset, Offset>>()
                if (isHighlighted) {
                    val step = w * 0.08f
                    var x = w * 0.05f
                    while (x < w * 0.42f) {
                        hatchLines.add(Offset(x, h * 0.45f) to Offset(x + 30f, h * 0.82f))
                        x += step
                    }
                }

                onDrawBehind {
                    // 1. Draw Normal Plots
                    drawPath(path = p101, color = NORMAL_PLOT_BG)
                    drawPath(path = p101, color = NORMAL_PLOT_STROKE_COLOR, style = NORMAL_STROKE)

                    drawPath(path = p102, color = NORMAL_PLOT_BG)
                    drawPath(path = p102, color = NORMAL_PLOT_STROKE_COLOR, style = NORMAL_STROKE)

                    drawPath(path = p104, color = NORMAL_PLOT_BG)
                    drawPath(path = p104, color = NORMAL_PLOT_STROKE_COLOR, style = NORMAL_STROKE)

                    // 2. Draw Highlighted Plot 103
                    drawPath(path = p103, color = highlightBg)
                    drawPath(path = p103, color = highlightStroke, style = HIGHLIGHT_STROKE)

                    // Draw pre-calculated hatch lines without allocations
                    for (i in hatchLines.indices) {
                        val line = hatchLines[i]
                        drawLine(
                            color = HATCH_COLOR,
                            start = line.first,
                            end = line.second,
                            strokeWidth = 3f
                        )
                    }

                    // 3. Draw Text
                    drawContext.canvas.nativeCanvas.apply {
                        drawText(text101, w * 0.24f, h * 0.28f, textPaint)
                        drawText(text102, w * 0.66f, h * 0.30f, textPaint)
                        val paint103 = if (isHighlighted) highlightTextPaint else textPaint
                        drawText(label103, w * 0.22f, h * 0.65f, paint103)
                        drawText(text104, w * 0.62f, h * 0.68f, textPaint)
                    }
                }
            }
    ) {
        // Top Overlay: Mouza Label
        Text(
            text = displayMouzaName,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFE2E8F0),
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(10.dp)
        )

        // Bottom Overlay: Fictional Tag / Badge
        EyebrowPill(
            text = if (isEnglish) "Demo Mouza Map (Sample)" else "কাল্পনিক মৌজা নকশা (নমুনা)",
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp),
            containerColor = StatusYellowContainer.copy(alpha = 0.9f)
        )
    }
}
