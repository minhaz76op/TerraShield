package com.terrasync.terrashield.data.prefs

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.userPreferencesDataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

enum class ThemeMode {
    SYSTEM, LIGHT, DARK
}

data class UserPreferences(
    val language: String = "bn",
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val voiceEnabled: Boolean = true
) {
    val theme: String get() = themeMode.name.lowercase()
}

class UserPreferencesRepository(private val context: Context) {

    companion object {
        val KEY_LANGUAGE = stringPreferencesKey("language")
        val KEY_THEME = stringPreferencesKey("theme")
        val KEY_VOICE = booleanPreferencesKey("voice_enabled")
    }

    val userPreferencesFlow: Flow<UserPreferences> = context.userPreferencesDataStore.data.map { preferences ->
        val themeStr = preferences[KEY_THEME] ?: "system"
        val themeMode = when (themeStr.lowercase()) {
            "light" -> ThemeMode.LIGHT
            "dark" -> ThemeMode.DARK
            else -> ThemeMode.SYSTEM
        }
        UserPreferences(
            language = preferences[KEY_LANGUAGE] ?: "bn",
            themeMode = themeMode,
            voiceEnabled = preferences[KEY_VOICE] ?: true
        )
    }

    suspend fun setLanguage(language: String) {
        context.userPreferencesDataStore.edit { preferences ->
            preferences[KEY_LANGUAGE] = language
        }
    }

    suspend fun setThemeMode(themeMode: ThemeMode) {
        context.userPreferencesDataStore.edit { preferences ->
            preferences[KEY_THEME] = themeMode.name.lowercase()
        }
    }

    suspend fun setTheme(theme: String) {
        val mode = when (theme.lowercase()) {
            "light" -> ThemeMode.LIGHT
            "dark" -> ThemeMode.DARK
            else -> ThemeMode.SYSTEM
        }
        setThemeMode(mode)
    }

    suspend fun setVoiceEnabled(enabled: Boolean) {
        context.userPreferencesDataStore.edit { preferences ->
            preferences[KEY_VOICE] = enabled
        }
    }

    suspend fun resetPreferences() {
        context.userPreferencesDataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
