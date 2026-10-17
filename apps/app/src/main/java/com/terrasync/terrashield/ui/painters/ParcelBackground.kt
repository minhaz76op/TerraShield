package com.terrasync.terrashield.ui.painters

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke

private val DASH_INTERVALS = floatArrayOf(12f, 8f)

@Composable
fun ParcelBackground(
    modifier: Modifier = Modifier,
    primaryColor: Color = Color(0xFF0F381E),
    secondaryColor: Color = Color(0xFF1B5E20),
    lineColor: Color = Color(0x3381C784)
) {
    val strokeWidth = 1.5f
    val gridStep = 70f
    val poly1Stroke = remember { Stroke(width = 2f) }
    val poly2Stroke = remember { Stroke(width = 2.5f) }
    val poly1Color = remember(lineColor) { lineColor.copy(alpha = 0.15f) }
    val poly2Color = remember(lineColor) { lineColor.copy(alpha = 0.25f) }

    Spacer(
        modifier = modifier
            .fillMaxSize()
            .drawWithCache {
                val width = size.width
                val height = size.height

                val bgBrush = Brush.verticalGradient(
                    colors = listOf(primaryColor, secondaryColor, primaryColor),
                    startY = 0f,
                    endY = height
                )

                val path1 = Path().apply {
                    moveTo(width * 0.1f, height * 0.2f)
                    lineTo(width * 0.45f, height * 0.15f)
                    lineTo(width * 0.38f, height * 0.55f)
                    lineTo(width * 0.08f, height * 0.48f)
                    close()
                }

                val path2 = Path().apply {
                    moveTo(width * 0.45f, height * 0.15f)
                    lineTo(width * 0.88f, height * 0.22f)
                    lineTo(width * 0.82f, height * 0.65f)
                    lineTo(width * 0.38f, height * 0.55f)
                    close()
                }

                // Pre-compute grid lines once when size is measured
                val gridLines = Path().apply {
                    var x = -gridStep
                    while (x < width + gridStep) {
                        moveTo(x, 0f)
                        lineTo(x + height * 0.3f, height)
                        x += gridStep
                    }
                    var y = 0f
                    while (y < height + gridStep) {
                        moveTo(0f, y)
                        lineTo(width, y + width * 0.15f)
                        y += gridStep
                    }
                }

                val staticDashEffect = PathEffect.dashPathEffect(DASH_INTERVALS, 0f)
                val gridStroke = Stroke(width = strokeWidth, pathEffect = staticDashEffect)

                onDrawBehind {
                    // 1. Forest Gradient Background
                    drawRect(brush = bgBrush)

                    // 2. Pre-cached Cadastral Grid Path Pass
                    drawPath(
                        path = gridLines,
                        color = lineColor,
                        style = gridStroke
                    )

                    // 3. Cadastral Polygons
                    drawPath(
                        path = path1,
                        color = poly1Color,
                        style = poly1Stroke
                    )
                    drawPath(
                        path = path2,
                        color = poly2Color,
                        style = poly2Stroke
                    )
                }
            }
    )
}
