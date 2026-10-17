package com.terrashield.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import com.terrasync.terrashield.data.prefs.ThemeMode
import com.terrasync.terrashield.ui.theme.TerraShieldTheme as CoreTerraShieldTheme

@Composable
fun TerraShieldTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    darkTheme: Boolean = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    },
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    CoreTerraShieldTheme(
        themeMode = themeMode,
        darkTheme = darkTheme,
        dynamicColor = dynamicColor,
        content = content
    )
}
