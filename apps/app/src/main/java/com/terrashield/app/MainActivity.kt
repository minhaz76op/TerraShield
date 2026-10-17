package com.terrashield.app

import android.os.Bundle
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.os.LocaleListCompat
import com.terrasync.terrashield.data.prefs.UserPreferences
import com.terrasync.terrashield.data.prefs.UserPreferencesRepository
import com.terrasync.terrashield.ui.nav.AppShell
import com.terrasync.terrashield.ui.theme.TerraShieldTheme

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(
                android.graphics.Color.TRANSPARENT
            ),
            navigationBarStyle = SystemBarStyle.dark(
                android.graphics.Color.TRANSPARENT
            )
        )

        val isFirstLaunch = savedInstanceState == null

        setContent {
            val userPreferencesRepository = remember { UserPreferencesRepository(applicationContext) }

            val currentAppLanguage = remember {
                val locales = AppCompatDelegate.getApplicationLocales()
                if (!locales.isEmpty && !locales.get(0)?.language.isNullOrEmpty()) {
                    locales.get(0)!!.language
                } else {
                    "bn"
                }
            }
            val initialPrefs = remember { UserPreferences(language = currentAppLanguage) }
            val preferences by userPreferencesRepository.userPreferencesFlow.collectAsState(initial = initialPrefs)

            LaunchedEffect(preferences.language) {
                val currentLocales = AppCompatDelegate.getApplicationLocales()
                val activeLang = if (!currentLocales.isEmpty) currentLocales.get(0)?.language else null
                if (activeLang != preferences.language) {
                    AppCompatDelegate.setApplicationLocales(
                        LocaleListCompat.forLanguageTags(preferences.language)
                    )
                }
            }

            TerraShieldTheme(themeMode = preferences.themeMode) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppShell(
                        userPreferences = preferences,
                        isFirstLaunch = isFirstLaunch
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun AppShellPreview() {
    TerraShieldTheme {
        AppShell()
    }
}
