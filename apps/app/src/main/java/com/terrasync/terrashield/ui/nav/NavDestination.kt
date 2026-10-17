package com.terrasync.terrashield.ui.nav

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.HelpOutline
import androidx.compose.material.icons.rounded.Calculate
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.ui.graphics.vector.ImageVector

enum class AppTab(
    val route: String,
    val titleBn: String,
    val titleEn: String,
    val icon: ImageVector
) {
    HOME("home", "হোম", "Home", Icons.Rounded.Home),
    CHECK("check", "যাচাই", "Check", Icons.Rounded.Shield),
    CALCULATOR("calculator", "ক্যালকুলেটর", "Calculator", Icons.Rounded.Calculate),
    HELP("help", "সহায়তা", "Help", Icons.AutoMirrored.Rounded.HelpOutline);

    fun title(lang: String): String = if (lang.lowercase().startsWith("en")) titleEn else titleBn
}
