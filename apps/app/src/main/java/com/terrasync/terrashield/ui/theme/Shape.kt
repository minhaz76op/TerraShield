package com.terrasync.terrashield.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val CardShape = RoundedCornerShape(18.dp)
val ButtonShape = RoundedCornerShape(12.dp)
val SheetShape = RoundedCornerShape(topStart = 22.dp, topEnd = 22.dp)
val ChipShape = RoundedCornerShape(50)

val Shapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = ButtonShape,           // 12dp
    medium = CardShape,            // 18dp
    large = SheetShape,            // 22dp top rounded
    extraLarge = RoundedCornerShape(28.dp)
)
