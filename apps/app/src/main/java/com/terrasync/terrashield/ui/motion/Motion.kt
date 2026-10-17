package com.terrasync.terrashield.ui.motion

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.staticCompositionLocalOf

object MotionTokens {
    const val Fast = 150
    const val Base = 280
    const val Slow = 420
    const val Hero = 600
}

/**
 * CompositionLocal to determine whether the user has requested reduced motion.
 * Defaults to false.
 */
val LocalReduceMotion = staticCompositionLocalOf { false }

@Composable
fun <T> motionTween(
    durationMillis: Int = MotionTokens.Base,
    delayMillis: Int = 0
): FiniteAnimationSpec<T> {
    val reduceMotion = LocalReduceMotion.current
    return if (reduceMotion) {
        tween(durationMillis = 0)
    } else {
        tween(
            durationMillis = durationMillis,
            delayMillis = delayMillis,
            easing = FastOutSlowInEasing
        )
    }
}

@Composable
fun <T> motionSpring(
    dampingRatio: Float = Spring.DampingRatioLowBouncy,
    stiffness: Float = Spring.StiffnessLow
): AnimationSpec<T> {
    val reduceMotion = LocalReduceMotion.current
    return if (reduceMotion) {
        tween(durationMillis = 0)
    } else {
        spring(
            dampingRatio = dampingRatio,
            stiffness = stiffness
        )
    }
}
