package com.terrasync.terrashield.feature.help

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.terrasync.terrashield.data.prefs.ThemeMode
import com.terrasync.terrashield.data.prefs.UserPreferences
import com.terrasync.terrashield.data.prefs.UserPreferencesRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val prefsRepository: UserPreferencesRepository
) : ViewModel() {

    val userPreferencesState: StateFlow<UserPreferences> = prefsRepository.userPreferencesFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = UserPreferences()
        )

    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch {
            prefsRepository.setThemeMode(mode)
        }
    }

    fun setLanguage(language: String) {
        viewModelScope.launch {
            prefsRepository.setLanguage(language)
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language))
        }
    }

    fun setVoiceEnabled(enabled: Boolean) {
        viewModelScope.launch {
            prefsRepository.setVoiceEnabled(enabled)
        }
    }

    fun resetPreferences() {
        viewModelScope.launch {
            prefsRepository.resetPreferences()
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("bn"))
        }
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return SettingsViewModel(UserPreferencesRepository(context)) as T
        }
    }
}
