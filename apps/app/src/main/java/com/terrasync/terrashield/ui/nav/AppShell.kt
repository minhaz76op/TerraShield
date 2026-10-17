package com.terrasync.terrashield.ui.nav

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import android.os.Build
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.sp
import com.terrashield.app.R
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.data.prefs.UserPreferences
import com.terrasync.terrashield.data.repository.LandRecordRepositoryImpl
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.CheckResult
import com.terrasync.terrashield.feature.admin.AdminAuth
import com.terrasync.terrashield.feature.admin.AdminDashboardScreen
import com.terrasync.terrashield.feature.admin.AdminLoginScreen
import com.terrasync.terrashield.feature.admin.AdminRepository
import com.terrasync.terrashield.feature.calculator.CalculatorGuideScreen
import com.terrasync.terrashield.feature.check.CheckScreen
import com.terrasync.terrashield.feature.checking.CheckingScanScreen
import com.terrasync.terrashield.feature.evidence.EvidenceScreen
import com.terrasync.terrashield.feature.help.AboutScreen
import com.terrasync.terrashield.feature.help.FaqScreen
import com.terrasync.terrashield.feature.help.HelpSettingsScreen
import com.terrasync.terrashield.feature.history.HistoryTimelineScreen
import com.terrasync.terrashield.feature.home.HomeScreen
import com.terrasync.terrashield.feature.judge.JudgePanelScreen
import com.terrasync.terrashield.feature.judge.StoryPlayerScreen
import com.terrasync.terrashield.feature.result.ResultScreen
import com.terrasync.terrashield.feature.samples.SamplesScreen
import com.terrasync.terrashield.ui.components.EyebrowPill
import com.terrasync.terrashield.ui.motion.MotionTokens
import com.terrasync.terrashield.ui.theme.StatusYellowContainer
import kotlinx.coroutines.delay

enum class CheckSubDest {
    WIZARD, SCANNING, RESULT, EVIDENCE, HISTORY
}

enum class HelpSubDest {
    MAIN, SAMPLES, JUDGE, STORY_PLAYER, FAQ, ABOUT, ADMIN_LOGIN, ADMIN_DASHBOARD
}

@Composable
fun AppShell(
    modifier: Modifier = Modifier,
    userPreferences: UserPreferences = UserPreferences(),
    isFirstLaunch: Boolean = true
) {
    val context = LocalContext.current
    val repository = remember { LandRecordRepositoryImpl.createFromAssets(context) }
    val adminRepository = remember { AdminRepository() }

    var showSplash by remember { mutableStateOf(isFirstLaunch) }
    var currentTab by remember { mutableStateOf(AppTab.HOME) }
    var showDemoBanner by remember { mutableStateOf(true) }
    var prefilledAreaForCheck by remember { mutableStateOf("") }
    val currentLang = userPreferences.language

    // Check Flow Sub-Destinations
    var checkSubDest by remember { mutableStateOf(CheckSubDest.WIZARD) }
    var currentCheckInput by remember { mutableStateOf(CheckInput()) }
    var currentCheckResult by remember { mutableStateOf<CheckResult?>(null) }

    // Help & Settings Sub-Destinations
    var helpSubDest by remember { mutableStateOf(HelpSubDest.MAIN) }

    // Active land data combines base land data + approved admin records
    val activeLandData = remember(repository, adminRepository) {
        adminRepository.getApprovedLandData(repository.getLandData())
    }

    val saveableStateHolder = rememberSaveableStateHolder()

    // Splash animation duration <= 1.1s
    LaunchedEffect(Unit) {
        delay(1100)
        showSplash = false
    }

    if (showSplash) {
        SplashScreen()
    } else {
        Scaffold(
            modifier = modifier.fillMaxSize(),
            containerColor = MaterialTheme.colorScheme.background,
            contentWindowInsets = WindowInsets(0, 0, 0, 0),
            topBar = {
                if (showDemoBanner) {
                    DemoBanner(
                        onDismiss = { showDemoBanner = false }
                    )
                }
            },
            bottomBar = {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Transparent)
                        .navigationBarsPadding(),
                    contentAlignment = Alignment.BottomCenter
                ) {
                    FloatingGlassmorphismNavBar(
                        currentTab = currentTab,
                        currentLang = currentLang,
                        onSelectTab = { tab ->
                            if (tab == AppTab.CHECK && currentTab != AppTab.CHECK) {
                                checkSubDest = CheckSubDest.WIZARD
                            } else if (tab == AppTab.HELP && currentTab != AppTab.HELP) {
                                helpSubDest = HelpSubDest.MAIN
                            }
                            currentTab = tab
                        }
                    )
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = innerPadding.calculateTopPadding())
            ) {
                saveableStateHolder.SaveableStateProvider(key = currentTab.route) {
                    when (currentTab) {
                        AppTab.HOME -> {
                            val onNavCheck = remember { { checkSubDest = CheckSubDest.WIZARD; currentTab = AppTab.CHECK } }
                            val onNavCalc = remember { { currentTab = AppTab.CALCULATOR } }
                            val onNavSamples = remember { { helpSubDest = HelpSubDest.SAMPLES; currentTab = AppTab.HELP } }
                            val onNavStory = remember { { helpSubDest = HelpSubDest.STORY_PLAYER; currentTab = AppTab.HELP } }

                            HomeScreen(
                                onNavigateToCheck = onNavCheck,
                                onNavigateToCalculator = onNavCalc,
                                onNavigateToSamples = onNavSamples,
                                onNavigateToStoryPlayer = onNavStory
                            )
                        }

                        AppTab.CHECK -> {
                            AnimatedContent(
                                targetState = checkSubDest,
                                label = "CheckSubDestTransition"
                            ) { dest ->
                                when (dest) {
                                    CheckSubDest.WIZARD -> CheckScreen(
                                        landData = activeLandData,
                                        prefilledArea = prefilledAreaForCheck,
                                        onRunCheck = { input ->
                                            currentCheckInput = input
                                            checkSubDest = CheckSubDest.SCANNING
                                        },
                                        onBackToHome = { currentTab = AppTab.HOME }
                                    )

                                    CheckSubDest.SCANNING -> CheckingScanScreen(
                                        input = currentCheckInput,
                                        onScanComplete = {
                                            currentCheckResult = RuleEngine.check(currentCheckInput, activeLandData)
                                            checkSubDest = CheckSubDest.RESULT
                                        }
                                    )

                                    CheckSubDest.RESULT -> ResultScreen(
                                        input = currentCheckInput,
                                        result = currentCheckResult ?: RuleEngine.check(currentCheckInput, activeLandData),
                                        landData = activeLandData,
                                        onBack = { checkSubDest = CheckSubDest.WIZARD },
                                        onNavigateToEvidence = { checkSubDest = CheckSubDest.EVIDENCE },
                                        onNavigateToHistory = { checkSubDest = CheckSubDest.HISTORY }
                                    )

                                    CheckSubDest.EVIDENCE -> EvidenceScreen(
                                        input = currentCheckInput,
                                        result = currentCheckResult ?: RuleEngine.check(currentCheckInput, activeLandData),
                                        landData = activeLandData,
                                        onBack = { checkSubDest = CheckSubDest.RESULT }
                                    )

                                    CheckSubDest.HISTORY -> HistoryTimelineScreen(
                                        mouzaId = currentCheckInput.mouzaId,
                                        dag = RuleEngine.normalizeDigits(currentCheckInput.dag).toIntOrNull() ?: 103,
                                        landData = activeLandData,
                                        onBack = { checkSubDest = CheckSubDest.RESULT }
                                    )
                                }
                            }
                        }

                        AppTab.CALCULATOR -> CalculatorGuideScreen(
                            onSendToVerifyForm = { areaDecimalStr ->
                                prefilledAreaForCheck = areaDecimalStr
                                checkSubDest = CheckSubDest.WIZARD
                                currentTab = AppTab.CHECK
                            }
                        )

                        AppTab.HELP -> {
                            AnimatedContent(
                                targetState = helpSubDest,
                                label = "HelpSubDestTransition"
                            ) { sub ->
                                when (sub) {
                                    HelpSubDest.MAIN -> HelpSettingsScreen(
                                        currentLang = currentLang,
                                        userPreferences = userPreferences,
                                        onToggleLang = { },
                                        onNavigateToFaq = { helpSubDest = HelpSubDest.FAQ },
                                        onNavigateToAbout = { helpSubDest = HelpSubDest.ABOUT },
                                        onNavigateToJudge = { helpSubDest = HelpSubDest.JUDGE },
                                        onNavigateToAdmin = {
                                            helpSubDest = if (AdminAuth.isSessionValid()) HelpSubDest.ADMIN_DASHBOARD else HelpSubDest.ADMIN_LOGIN
                                        }
                                    )

                                    HelpSubDest.SAMPLES -> SamplesScreen(
                                        onRunSample = { checkInput ->
                                            currentCheckInput = checkInput
                                            checkSubDest = CheckSubDest.SCANNING
                                            currentTab = AppTab.CHECK
                                        },
                                        onBack = { helpSubDest = HelpSubDest.MAIN }
                                    )

                                    HelpSubDest.JUDGE -> JudgePanelScreen(
                                        repository = repository,
                                        onOpenStoryPlayer = { helpSubDest = HelpSubDest.STORY_PLAYER },
                                        onBack = { helpSubDest = HelpSubDest.MAIN }
                                    )

                                    HelpSubDest.STORY_PLAYER -> StoryPlayerScreen(
                                        onClose = { helpSubDest = HelpSubDest.JUDGE }
                                    )

                                    HelpSubDest.FAQ -> FaqScreen(
                                        onBack = { helpSubDest = HelpSubDest.MAIN }
                                    )

                                    HelpSubDest.ABOUT -> AboutScreen(
                                        onBack = { helpSubDest = HelpSubDest.MAIN }
                                    )

                                    HelpSubDest.ADMIN_LOGIN -> AdminLoginScreen(
                                        onLoginSuccess = { helpSubDest = HelpSubDest.ADMIN_DASHBOARD },
                                        onBack = { helpSubDest = HelpSubDest.MAIN }
                                    )

                                    HelpSubDest.ADMIN_DASHBOARD -> AdminDashboardScreen(
                                        adminRepository = adminRepository,
                                        onLogout = { helpSubDest = HelpSubDest.MAIN },
                                        onBack = { helpSubDest = HelpSubDest.MAIN }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SplashScreen() {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()
    var animTrigger by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (animTrigger) 1.0f else 0.4f,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "SplashScale"
    )

    LaunchedEffect(Unit) {
        animTrigger = true
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A1D12)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.scale(scale)
        ) {
            Surface(
                modifier = Modifier.size(100.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Image(
                        painter = painterResource(id = R.drawable.tslogo),
                        contentDescription = "TerraShield Logo",
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Fit
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "TerraShield",
                style = MaterialTheme.typography.displayLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = if (isEnglish) "Land Ownership & Record Verification" else "জমির মালিকানা ও রেকর্ড যাচাইকরণ",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = Color(0xFFA7F3D0)
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            EyebrowPill(
                text = if (isEnglish) "Sample / Demo Environment" else "কাল্পনিক / নমুনা পরিবেশ",
                containerColor = StatusYellowContainer,
                contentColor = Color(0xFF78350F)
            )
        }
    }
}

@Composable
private fun DemoBanner(onDismiss: () -> Unit) {
    val isEnglish = com.terrasync.terrashield.core.i18n.BanglaFormatter.isEnglish()
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = StatusYellowContainer,
        contentColor = Color(0xFF78350F)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Info,
                    contentDescription = null,
                    tint = Color(0xFF78350F),
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isEnglish) "DEMO · Sample Data · Not a Govt Service" else "ডেমো · কাল্পনিক তথ্য · সরকারি সেবা নয়",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF78350F)
                    )
                )
            }

            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Close,
                    contentDescription = if (isEnglish) "Close" else "বন্ধ করুন",
                    tint = Color(0xFF78350F),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun FloatingGlassmorphismNavBar(
    currentTab: AppTab,
    currentLang: String,
    onSelectTab: (AppTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = MaterialTheme.colorScheme.surface.luminance() < 0.5f
    val capsuleShape = CircleShape

    // Layer 1: Pre-computed Tinted Surface (Zero GPU backdrop blur overhead)
    val glassBg = if (isDark) {
        Color(0xFF0C1F13).copy(alpha = 0.96f) // High-performance Deep Midnight Forest Tint
    } else {
        Color(0xFFFFFFFF).copy(alpha = 0.96f) // High-performance Frosted Pure White Tint
    }

    // Layer 2: Crystal Glass Highlight Border
    val glassBorderBrush = Brush.verticalGradient(
        colors = if (isDark) listOf(
            Color.White.copy(alpha = 0.28f),
            Color.White.copy(alpha = 0.06f)
        ) else listOf(
            Color.White.copy(alpha = 0.95f),
            Color(0xFFCBD5E1)
        )
    )

    // Layer 1 + Layer 2: Unblurred Surface Container
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(start = 24.dp, end = 24.dp, bottom = 12.dp)
            .shadow(
                elevation = 14.dp,
                shape = capsuleShape,
                ambientColor = if (isDark) Color.Black.copy(alpha = 0.10f) else Color.Black.copy(alpha = 0.05f),
                spotColor = if (isDark) Color.Black.copy(alpha = 0.20f) else Color.Black.copy(alpha = 0.12f)
            ),
        shape = capsuleShape,
        color = glassBg,
        border = BorderStroke(1.dp, glassBorderBrush),
        tonalElevation = 0.dp
    ) {
        // Layer 3: Razor-sharp Foreground Content (Zero blur on icons and Bengali text)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(68.dp)
                .padding(horizontal = 8.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            AppTab.entries.forEach { tab ->
                val isSelected = currentTab == tab
                val isCheckTab = tab == AppTab.CHECK
                val title = tab.title(currentLang)

                val animatedIconColor by animateColorAsState(
                    targetValue = when {
                        isSelected -> if (isDark) Color(0xFF81C784) else MaterialTheme.colorScheme.primary
                        else -> if (isDark) Color(0xFFA5D6A7) else MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    label = "NavIconColor"
                )

                val animatedTextColor by animateColorAsState(
                    targetValue = when {
                        isSelected -> if (isDark) Color(0xFF81C784) else MaterialTheme.colorScheme.primary
                        else -> if (isDark) Color(0xFFCBD5E1) else MaterialTheme.colorScheme.onSurfaceVariant
                    },
                    label = "NavTextColor"
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(CircleShape)
                        .clickable { onSelectTab(tab) }
                        .padding(vertical = 2.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        if (isCheckTab && isSelected) {
                            // High-Contrast Primary Hero Badge when "যাচাই / Check" is active
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(36.dp),
                                shadowElevation = 4.dp
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = tab.icon,
                                        contentDescription = title,
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        } else {
                            // Standard Item with Soft Indicator Pill when active, or clean icon when unselected
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(
                                        if (isSelected) {
                                            if (isDark) Color(0xFF1B432A) else MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.85f)
                                        } else Color.Transparent
                                    )
                                    .padding(horizontal = 14.dp, vertical = 3.dp)
                            ) {
                                Icon(
                                    imageVector = tab.icon,
                                    contentDescription = title,
                                    tint = animatedIconColor,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(2.dp))

                        Text(
                            text = title,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                                fontSize = 11.sp,
                                color = animatedTextColor
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}
