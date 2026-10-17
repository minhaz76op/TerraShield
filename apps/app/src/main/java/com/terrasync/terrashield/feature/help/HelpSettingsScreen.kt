package com.terrasync.terrashield.feature.help

import android.content.Intent
import android.net.Uri
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.automirrored.rounded.HelpOutline
import androidx.compose.material.icons.automirrored.rounded.VolumeUp
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.Gavel
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.PhoneInTalk
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.os.LocaleListCompat
import com.terrashield.app.R
import com.terrasync.terrashield.data.prefs.ThemeMode
import com.terrasync.terrashield.data.prefs.UserPreferences
import com.terrasync.terrashield.data.prefs.UserPreferencesRepository
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsButtonVariant
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.StatusYellowContainer
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpSettingsScreen(
    currentLang: String,
    onToggleLang: () -> Unit,
    onNavigateToFaq: () -> Unit,
    onNavigateToAbout: () -> Unit,
    onNavigateToJudge: () -> Unit,
    onNavigateToAdmin: () -> Unit,
    userPreferences: UserPreferences = UserPreferences(),
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val prefsRepository = remember(context) { UserPreferencesRepository(context) }
    val preferencesState by prefsRepository.userPreferencesFlow.collectAsState(initial = userPreferences)

    val activeLang = preferencesState.language
    val isEnglish = activeLang.lowercase().startsWith("en")

    fun callHotline(number: String) {
        val intent = Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$number")
        }
        context.startActivity(intent)
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = if (isEnglish) "Help & App Settings" else "সহায়তা ও অ্যাপ সেটিংস",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.semantics { heading() }
            )
            Text(
                text = if (isEnglish) "Land service hotlines, app preferences, FAQ, and developer panel." else "ভূমি সেবার হটলাইন, অ্যাপ পছন্দসমূহ, FAQ, এবং ডেভেলপার প্যানেল।",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // 1. Government Land Service Hotline 16122 Card
        item {
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.PhoneInTalk,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isEnglish) "Govt Land Hotline (16122)" else "সরকারি ভূমি সেবা হটলাইন (১৬১২২)",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                modifier = Modifier.semantics { heading() }
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        EyebrowPill(
                            text = if (isEnglish) "24/7 Direct" else "২৪/৭ সরাসরি",
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = if (isEnglish) "Call for government land information, mutation, khatian, or Ministry of Land inquiries." else "ভূমি সংক্রান্ত সরকারি খাস জমি, নামজারি, খতিয়ান বা সরাসরি ভূমি মন্ত্রণালয়ের তথ্য ও অভিযোগের জন্য কল করুন।",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Notice / Disclaimer Card
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                        color = StatusYellowContainer.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isEnglish) "TerraShield is an offline educational demo app, not an official government service." else "TerraShield কোনো সরকারি সেবা নয়, এটি একটি অফলাইন শিক্ষামূলক ও তথ্যভিত্তিক ডেমো অ্যাপ।",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                ),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    TsButton(
                        text = if (isEnglish) "Call 16122" else "১৬১২২ নম্বরে কল করুন",
                        onClick = { callHotline("16122") },
                        icon = Icons.Rounded.Call,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // 2. Legal-Aid Hotline 16430 Card (Behind BuildConfig Check)
        val showLegalAid = try {
            val clazz = Class.forName("com.terrashield.app.BuildConfig")
            clazz.getField("SHOW_LEGAL_AID_HOTLINE").getBoolean(null)
        } catch (_: Throwable) {
            false
        }

        if (showLegalAid) {
            item {
                TsCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isEnglish) "Legal Aid Hotline (16430)" else "আইনি সহায়তা হটলাইন (১৬৪৩০)",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                modifier = Modifier
                                    .weight(1f)
                                    .semantics { heading() }
                            )

                            Spacer(modifier = Modifier.width(8.dp))

                            EyebrowPill(
                                text = if (isEnglish) "Free Legal Aid" else "বিনামূল্যে আইনি সেবা",
                                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = if (isEnglish) "Government Legal Aid Center for land dispute guidance." else "ভূমি বিবাদ ও বিনামূল্যে আইনি পরামর্শের জন্য সরকারি লিগ্যাল এইড কল সেন্টার।",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        TsButton(
                            text = if (isEnglish) "Call 16430" else "১৬৪৩০ নম্বরে কল করুন",
                            onClick = { callHotline("16430") },
                            icon = Icons.Rounded.Call,
                            variant = TsButtonVariant.Outlined,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }

        // 3. Application Preferences (Language, Voice, Theme, Reset)
        item {
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = if (isEnglish) "App Preferences" else "অ্যাপ পছন্দসমূহ (Preferences)",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.semantics { heading() }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Language Selector
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Language,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = stringResource(R.string.pref_language),
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    val languages = listOf(
                        Pair("bn", "বাংলা (Bangla)"),
                        Pair("en", "English")
                    )
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        languages.forEachIndexed { index, (code, label) ->
                            val isSelected = if (code == "en") isEnglish else !isEnglish
                            SegmentedButton(
                                selected = isSelected,
                                onClick = {
                                    if (!isSelected) {
                                        coroutineScope.launch {
                                            prefsRepository.setLanguage(code)
                                            val currentLocales = AppCompatDelegate.getApplicationLocales()
                                            if (currentLocales.isEmpty || currentLocales.get(0)?.language != code) {
                                                AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(code))
                                            }
                                        }
                                        onToggleLang()
                                    }
                                },
                                shape = SegmentedButtonDefaults.itemShape(index = index, count = languages.size)
                            ) {
                                Text(label, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Voice Assistance Switch
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.VolumeUp,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = stringResource(R.string.pref_voice),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = if (isEnglish) "Spoken guidance for results" else "ফলাফল ও দিকনির্দেশনা বাংলায় শুনতে",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Switch(
                            checked = preferencesState.voiceEnabled,
                            onCheckedChange = { enabled ->
                                coroutineScope.launch {
                                    prefsRepository.setVoiceEnabled(enabled)
                                }
                            }
                        )
                    }

                    // Theme Selector Row
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.pref_theme),
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    val themes = listOf(
                        Triple("system", stringResource(R.string.theme_system), ThemeMode.SYSTEM),
                        Triple("light", stringResource(R.string.theme_light), ThemeMode.LIGHT),
                        Triple("dark", stringResource(R.string.theme_dark), ThemeMode.DARK)
                    )
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        themes.forEachIndexed { index, (_, label, mode) ->
                            SegmentedButton(
                                selected = preferencesState.themeMode == mode,
                                onClick = {
                                    coroutineScope.launch {
                                        prefsRepository.setThemeMode(mode)
                                    }
                                },
                                shape = SegmentedButtonDefaults.itemShape(index = index, count = themes.size),
                                modifier = Modifier.height(48.dp)
                            ) {
                                Text(label, style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Reset Preferences Action
                    TsButton(
                        text = if (isEnglish) "Reset Preferences" else "পছন্দসমূহ রিসেট করুন",
                        onClick = {
                            coroutineScope.launch {
                                prefsRepository.resetPreferences()
                                AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("bn"))
                            }
                        },
                        icon = Icons.Rounded.Refresh,
                        variant = TsButtonVariant.Outlined,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // 4. FAQ & About Navigation Cards
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TsCard(
                    onClick = onNavigateToFaq,
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.HelpOutline,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isEnglish) "FAQ" else "সাধারণ প্রশ্নাবলি (FAQ)",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.semantics { heading() }
                        )
                        Text(
                            text = if (isEnglish) "Answers & Guidance" else "উত্তর ও দিকনির্দেশনা",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                TsCard(
                    onClick = onNavigateToAbout,
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Icon(
                            imageVector = Icons.Rounded.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isEnglish) "About TerraShield" else "TerraShield সম্পর্কে",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.semantics { heading() }
                        )
                        Text(
                            text = if (isEnglish) "Team & Citation" else "টিম ও সাইটেশন",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // 5. Developer Judge Panel & Admin Panel Links
        item {
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = if (isEnglish) "Admin & Developer Panel" else "এডমিন ও ডেভেলপার প্যানেল",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.semantics { heading() }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Judge Panel Button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToJudge() }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.Gavel,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Judge Panel & Live Test Mode",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = if (isEnglish) "14 test cases & sales simulator" else "১৪টি টেস্ট কেস ও ডেমো বিক্রি সিমুলেটর",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Admin Panel Button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToAdmin() }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.AdminPanelSettings,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = if (isEnglish) "Admin Dashboard (CRUD)" else "এডমিন রেকর্ড ড্যাশবোর্ড (CRUD)",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = if (isEnglish) "Plot, khatian, deed & audit log" else "দাগ, খতিয়ান, দলিল ও অডিট লগ",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}
