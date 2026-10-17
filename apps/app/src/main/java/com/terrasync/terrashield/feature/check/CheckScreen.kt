package com.terrasync.terrashield.feature.check

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.terrasync.terrashield.core.engine.RuleEngine
import com.terrasync.terrashield.core.i18n.BanglaFormatter
import com.terrasync.terrashield.core.voice.SpokenNumberParser
import com.terrasync.terrashield.domain.model.CheckInput
import com.terrasync.terrashield.domain.model.LandData
import com.terrasync.terrashield.ui.components.StepProgress
import com.terrasync.terrashield.ui.components.TagSim
import com.terrasync.terrashield.ui.components.TsButton
import com.terrasync.terrashield.ui.components.TsButtonVariant
import com.terrasync.terrashield.ui.components.TsCard
import com.terrasync.terrashield.ui.theme.StatusYellowContainer

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CheckScreen(
    landData: LandData,
    prefilledArea: String = "",
    onRunCheck: (CheckInput) -> Unit,
    onBackToHome: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    var currentStep by remember { mutableIntStateOf(1) }

    // Input States
    var selectedMouzaId by remember { mutableStateOf("M901") }
    var dagInput by remember { mutableStateOf("103") }
    var selectedSellerId by remember { mutableStateOf<String?>("O03") }
    var customSellerName by remember { mutableStateOf("") }
    var isNotInKhatian by remember { mutableStateOf(false) }
    var areaInput by remember { mutableStateOf(prefilledArea.ifEmpty { "20" }) }
    var sellerDeedNoInput by remember { mutableStateOf("") }

    // Voice recognition states
    var voiceSpokenText by remember { mutableStateOf<String?>(null) }
    var voiceTargetField by remember { mutableStateOf<String?>(null) } // "dag" or "area"
    var parsedVoiceNumber by remember { mutableStateOf<Double?>(null) }

    // Validation error messages
    var validationErrors by remember { mutableStateOf<Map<String, String>>(emptyMap()) }

    // Auto-prefill area from Calculator if provided
    LaunchedEffect(prefilledArea) {
        if (prefilledArea.isNotBlank()) {
            areaInput = prefilledArea
        }
    }

    val speechLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { activityResult ->
        if (activityResult.resultCode == Activity.RESULT_OK) {
            val results = activityResult.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val spoken = results?.firstOrNull()
            if (!spoken.isNullOrBlank()) {
                voiceSpokenText = spoken
                parsedVoiceNumber = SpokenNumberParser.parseSpokenNumber(spoken)
            }
        } else {
            Toast.makeText(context, "ভয়েস ইনপুট গ্রহণ করা যায়নি", Toast.LENGTH_SHORT).show()
        }
    }

    fun launchVoiceInput(targetField: String) {
        voiceTargetField = targetField
        voiceSpokenText = null
        parsedVoiceNumber = null
        runCatching {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "bn-BD")
                putExtra(RecognizerIntent.EXTRA_PROMPT, "সংখ্যা বা কথা বলুন...")
            }
            speechLauncher.launch(intent)
        }.onFailure {
            Toast.makeText(context, "ভয়েস সার্ভিস পাওয়া যায়নি", Toast.LENGTH_SHORT).show()
        }
    }

    fun validateStep(step: Int): Boolean {
        val errors = mutableMapOf<String, String>()

        when (step) {
            1 -> {
                if (selectedMouzaId.isBlank()) {
                    errors["mouza"] = "অনুগ্রহ করে একটি মৌজা নির্বাচন করুন।"
                }
            }
            2 -> {
                val normDag = RuleEngine.normalizeDigits(dagInput).trim()
                if (normDag.isEmpty()) {
                    errors["dag"] = "দাগ নম্বর দেয়া আবশ্যক।"
                } else if (!Regex("^\\d+$").matches(normDag)) {
                    errors["dag"] = "দাগ নম্বর শুধুমাত্র সংখ্যায় লিখুন।"
                }
            }
            3 -> {
                if (isNotInKhatian) {
                    if (customSellerName.isBlank()) {
                        errors["seller"] = "বিক্রেতার নাম লিখুন।"
                    }
                } else if (selectedSellerId == null) {
                    errors["seller"] = "অনুগ্রহ করে বিক্রেতা নির্বাচন করুন।"
                }
            }
            4 -> {
                val normArea = RuleEngine.normalizeDigits(areaInput).trim()
                val parsed = RuleEngine.parseNumber(areaInput)
                if (normArea.isEmpty()) {
                    errors["area"] = "জমির পরিমাণ দেয়া আবশ্যক।"
                } else if (parsed == null || parsed <= 0) {
                    errors["area"] = "জমির পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।"
                }
            }
            5 -> {
                if (sellerDeedNoInput.isNotBlank()) {
                    val normDeed = RuleEngine.normalizeDeedNo(sellerDeedNoInput)
                    if (normDeed == null) {
                        errors["deed"] = "দলিল নম্বর সঠিক ফরম্যাটে দিন (যেমন: ১২৩৪/২০২০)।"
                    }
                }
            }
        }

        validationErrors = errors
        return errors.isEmpty()
    }

    val isEnglish = BanglaFormatter.isEnglish()

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isEnglish) "Land Check Wizard" else "জমির তথ্য যাচাই উইজার্ড",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = if (isEnglish) "Step $currentStep / 6" else "ধাপ ${BanglaFormatter.toBanglaDigits(currentStep)} / ৬",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (currentStep > 1) {
                            currentStep -= 1
                        } else {
                            onBackToHome()
                        }
                    }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = if (isEnglish) "Back" else "ফিরে যান"
                        )
                    }
                },
                actions = {
                    TagSim(modifier = Modifier.padding(end = 16.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            // Animated Header Progress Bar
            StepProgress(
                currentStep = currentStep,
                totalSteps = 6,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Voice SpeechRecognizer Banner Confirmation
            voiceSpokenText?.let { spoken ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "আপনি বলেছেন: \"$spoken\"",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        parsedVoiceNumber?.let { num ->
                            Text(
                                text = "ধরা হয়েছে: ${BanglaFormatter.toBanglaDigits(num)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            horizontalArrangement = Arrangement.End,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            TsButton(
                                text = "বাতিল",
                                onClick = {
                                    voiceSpokenText = null
                                    voiceTargetField = null
                                },
                                variant = TsButtonVariant.Text
                            )

                            Spacer(modifier = Modifier.width(8.dp))

                            TsButton(
                                text = "হ্যাঁ, বসান",
                                onClick = {
                                    val valToFill = parsedVoiceNumber?.let {
                                        if (it % 1.0 == 0.0) it.toInt().toString() else it.toString()
                                    } ?: BanglaFormatter.toEnglishDigits(spoken)

                                    if (voiceTargetField == "dag") {
                                        dagInput = valToFill
                                    } else if (voiceTargetField == "area") {
                                        areaInput = valToFill
                                    }
                                    voiceSpokenText = null
                                    voiceTargetField = null
                                }
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Step Content Animated Transition
            Box(modifier = Modifier.weight(1f)) {
                AnimatedContent(
                    targetState = currentStep,
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    label = "CheckWizardStepTransition"
                ) { step ->
                    when (step) {
                        1 -> Step1MouzaSelection(
                            selectedMouzaId = selectedMouzaId,
                            onSelectMouza = { selectedMouzaId = it },
                            error = validationErrors["mouza"],
                            landData = landData
                        )
                        2 -> Step2DagLookup(
                            dagInput = dagInput,
                            onDagChange = { dagInput = it },
                            error = validationErrors["dag"],
                            onVoiceClick = { launchVoiceInput("dag") },
                            selectedMouzaId = selectedMouzaId,
                            landData = landData
                        )
                        3 -> Step3SellerSelection(
                            selectedMouzaId = selectedMouzaId,
                            dagInput = dagInput,
                            selectedSellerId = selectedSellerId,
                            onSelectSellerId = {
                                selectedSellerId = it
                                isNotInKhatian = false
                            },
                            customSellerName = customSellerName,
                            onCustomNameChange = { customSellerName = it },
                            isNotInKhatian = isNotInKhatian,
                            onToggleNotInKhatian = {
                                isNotInKhatian = it
                                if (it) selectedSellerId = null
                            },
                            error = validationErrors["seller"],
                            landData = landData
                        )
                        4 -> Step4AreaInput(
                            areaInput = areaInput,
                            onAreaChange = { areaInput = it },
                            error = validationErrors["area"],
                            onVoiceClick = { launchVoiceInput("area") },
                            selectedMouzaId = selectedMouzaId,
                            dagInput = dagInput,
                            selectedSellerId = selectedSellerId,
                            landData = landData
                        )
                        5 -> Step5DeedInput(
                            deedNoInput = sellerDeedNoInput,
                            onDeedNoChange = { sellerDeedNoInput = it },
                            error = validationErrors["deed"]
                        )
                        6 -> Step6ReviewSummary(
                            selectedMouzaId = selectedMouzaId,
                            dagInput = dagInput,
                            selectedSellerId = selectedSellerId,
                            customSellerName = customSellerName,
                            isNotInKhatian = isNotInKhatian,
                            areaInput = areaInput,
                            deedNoInput = sellerDeedNoInput,
                            landData = landData,
                            onEditStep = { targetStep -> currentStep = targetStep }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Navigation CTA Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (currentStep > 1) {
                    TsButton(
                        text = if (isEnglish) "Previous Step" else "আগের ধাপ",
                        onClick = { currentStep -= 1 },
                        variant = TsButtonVariant.Outlined,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                }

                if (currentStep < 6) {
                    TsButton(
                        text = if (isEnglish) "Next Step" else "পরবর্তী ধাপ",
                        onClick = {
                            if (validateStep(currentStep)) {
                                currentStep += 1
                            }
                        },
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    TsButton(
                        text = if (isEnglish) "Run Verification" else "যাচাই করুন",
                        onClick = {
                            val cleanSellerName = if (isNotInKhatian) customSellerName.trim() else null
                            val cleanSellerId = if (!isNotInKhatian) selectedSellerId else null

                            val checkInput = CheckInput(
                                mouzaId = selectedMouzaId,
                                dag = dagInput,
                                area = areaInput,
                                sellerId = cleanSellerId,
                                sellerName = cleanSellerName,
                                sellerDeedNo = sellerDeedNoInput.takeIf { it.isNotBlank() }
                            )

                            onRunCheck(checkInput)
                        },
                        icon = Icons.Rounded.Shield,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(110.dp))
        }
    }
}

@Composable
private fun Step1MouzaSelection(
    selectedMouzaId: String,
    onSelectMouza: (String) -> Unit,
    error: String?,
    landData: LandData
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val mouzas = landData.locations.mouzas

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = if (isEnglish) "1. Select Mouza" else "১. মৌজা নির্বাচন করুন",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = if (isEnglish) "Choose the mouza where the land is located:" else "যে মৌজায় জমি অবস্থিত তা বেছে নিন:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        items(mouzas.size) { idx ->
            val mouza = mouzas[idx]
            val isSelected = selectedMouzaId == mouza.id

            TsCard(
                modifier = Modifier.fillMaxWidth(),
                onClick = { onSelectMouza(mouza.id) },
                borderColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f) else MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = mouza.name.text(isEnglish),
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = if (isEnglish) "J.L. No: ${mouza.jl} · ${landData.locations.upazila.name.text(isEnglish)}" else "জে.এল. নম্বর: ${BanglaFormatter.toBanglaDigits(mouza.jl)} · ${landData.locations.upazila.name.bn}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (isSelected) {
                        Icon(
                            imageVector = Icons.Rounded.CheckCircle,
                            contentDescription = if (isEnglish) "Selected" else "নির্বাচিত",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        error?.let {
            item {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Step2DagLookup(
    dagInput: String,
    onDagChange: (String) -> Unit,
    error: String?,
    onVoiceClick: () -> Unit,
    selectedMouzaId: String,
    landData: LandData
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val sampleDags = landData.plots
        .filter { it.mouzaId == selectedMouzaId }
        .map { it.dag.toString() }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = if (isEnglish) "2. Enter Plot / Dag Number" else "২. দাগ নম্বর দিন",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = if (isEnglish) "Type the plot number or choose from sample chips below:" else "জমির দাগ বা প্লট নম্বর টাইপ করুন বা নিচের নমুনা থেকে বাছাই করুন:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            OutlinedTextField(
                value = dagInput,
                onValueChange = onDagChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(if (isEnglish) "Plot / Dag Number (e.g. 103)" else "দাগ নম্বর (যেমন: ১০৩)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                trailingIcon = {
                    IconButton(onClick = onVoiceClick) {
                        Icon(
                            imageVector = Icons.Rounded.Mic,
                            contentDescription = if (isEnglish) "Voice input" else "ভয়েস ইনপুট",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                isError = error != null,
                singleLine = true
            )

            error?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        item {
            Text(
                text = if (isEnglish) "Sample Plot Numbers:" else "নমুনা দাগ নম্বরের চিপস:",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(6.dp))

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                sampleDags.forEach { dagStr ->
                    val dagDisplay = BanglaFormatter.toBanglaDigits(dagStr, if (isEnglish) "en" else "bn")
                    val isSelected = RuleEngine.normalizeDigits(dagInput) == dagStr

                    AssistChip(
                        onClick = { onDagChange(dagStr) },
                        label = { Text(text = dagDisplay) },
                        leadingIcon = if (isSelected) {
                            {
                                Icon(
                                    imageVector = Icons.Rounded.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        } else null
                    )
                }
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isEnglish) "Showing records from sample database. Not an official server." else "নমুনা ডাটাবেসের রেকর্ড দেখানো হচ্ছে। এটি আসল ভূমি সার্ভার নয়।",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun Step3SellerSelection(
    selectedMouzaId: String,
    dagInput: String,
    selectedSellerId: String?,
    onSelectSellerId: (String) -> Unit,
    customSellerName: String,
    onCustomNameChange: (String) -> Unit,
    isNotInKhatian: Boolean,
    onToggleNotInKhatian: (Boolean) -> Unit,
    error: String?,
    landData: LandData
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val dagInt = RuleEngine.normalizeDigits(dagInput).toIntOrNull() ?: -1
    val khatian = RuleEngine.findKhatian(landData, selectedMouzaId, dagInt)
    val owners = khatian?.owners ?: emptyList()
    val peopleMap = landData.people.associateBy { it.id }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = if (isEnglish) "3. Select Seller" else "৩. বিক্রেতা নির্বাচন করুন",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = if (isEnglish) "Select seller from the latest BS khatian owners list:" else "সর্বশেষ খতিয়ান (বিএস) এর মালিকদের তালিকা হতে বিক্রেতা বেছে নিন:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (owners.isEmpty()) {
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = StatusYellowContainer
                ) {
                    Text(
                        text = if (isEnglish) "No owners found in sample khatian for this plot. Type seller name directly below." else "এই দাগে নমুনা খতিয়ানের কোনো মালিকের তালিকা পাওয়া যায়নি। বিক্রেতার নাম নিচে সরাসরি টাইপ করুন।",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF78350F),
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        } else {
            items(owners.size) { idx ->
                val owner = owners[idx]
                val ownerName = peopleMap[owner.personId]?.name?.text(isEnglish) ?: owner.personId
                val isSelected = !isNotInKhatian && selectedSellerId == owner.personId

                TsCard(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { onSelectSellerId(owner.personId) },
                    borderColor = if (isSelected) MaterialTheme.colorScheme.primary else null,
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f) else MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { onSelectSellerId(owner.personId) }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = ownerName,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = if (isEnglish) "Khatian Share: ${BanglaFormatter.toBanglaDigits(owner.share, "en")} decimals" else "খতিয়ানে অংশ: ${BanglaFormatter.toBanglaDigits(owner.share)} শতাংশ",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }

        item {
            TsCard(
                modifier = Modifier.fillMaxWidth(),
                onClick = { onToggleNotInKhatian(true) },
                borderColor = if (isNotInKhatian) MaterialTheme.colorScheme.error else null,
                containerColor = if (isNotInKhatian) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = isNotInKhatian,
                            onClick = { onToggleNotInKhatian(true) }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isEnglish) "Not in list / Different seller (triggers R3 rule)" else "তালিকায় নেই / অন্য বিক্রেতা (R3 নিয়ম ট্রিগার করবে)",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    if (isNotInKhatian) {
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = customSellerName,
                            onValueChange = onCustomNameChange,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text(if (isEnglish) "Type seller name (e.g. Habib Rahman)" else "বিক্রেতার নাম লিখুন (যেমন: হাবিব রহমান)") },
                            singleLine = true
                        )
                    }
                }
            }
        }

        error?.let {
            item {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun Step4AreaInput(
    areaInput: String,
    onAreaChange: (String) -> Unit,
    error: String?,
    onVoiceClick: () -> Unit,
    selectedMouzaId: String,
    dagInput: String,
    selectedSellerId: String?,
    landData: LandData
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val currentNum = RuleEngine.parseNumber(areaInput) ?: 0.0

    fun adjust(delta: Double) {
        val next = (currentNum + delta).coerceAtLeast(0.0)
        onAreaChange(RuleEngine.round2(next).toString())
    }

    val dagInt = RuleEngine.normalizeDigits(dagInput).toIntOrNull() ?: -1
    val khatian = RuleEngine.findKhatian(landData, selectedMouzaId, dagInt)
    val ownerShare = khatian?.owners?.find { it.personId == selectedSellerId }?.share ?: 20.0

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = if (isEnglish) "4. Enter Land Area" else "৪. জমির পরিমাণ দিন",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = if (isEnglish) "Specify proposed purchasing land area in decimals:" else "যে পরিমাণ জমি কিনতে চাচ্ছেন তা শতাংশে (decimal) উল্লেখ করুন:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            OutlinedTextField(
                value = areaInput,
                onValueChange = onAreaChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(if (isEnglish) "Land area (in decimals, e.g. 20)" else "জমির পরিমাণ (শতাংশে, যেমন: ২০)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                trailingIcon = {
                    IconButton(onClick = onVoiceClick) {
                        Icon(
                            imageVector = Icons.Rounded.Mic,
                            contentDescription = if (isEnglish) "Voice input" else "ভয়েস ইনপুট",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                isError = error != null,
                singleLine = true
            )

            error?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        // Quick adjust buttons
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { adjust(-1.0) },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("- 1.0")
                }
                OutlinedButton(
                    onClick = { adjust(-0.1) },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("- 0.1")
                }
                OutlinedButton(
                    onClick = { adjust(+0.1) },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("+ 0.1")
                }
                OutlinedButton(
                    onClick = { adjust(+1.0) },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("+ 1.0")
                }
            }
        }

        // Shortcut button: "Purong-Ansho"
        item {
            TsButton(
                text = if (isEnglish) "Buying entire share? (Set ${BanglaFormatter.toBanglaDigits(ownerShare, "en")} decimals)" else "পুরো অংশ কিনছেন? (${BanglaFormatter.toBanglaDigits(ownerShare)} শতাংশ বসান)",
                onClick = { onAreaChange(ownerShare.toString()) },
                variant = TsButtonVariant.Secondary,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun Step5DeedInput(
    deedNoInput: String,
    onDeedNoChange: (String) -> Unit,
    error: String?
) {
    val isEnglish = BanglaFormatter.isEnglish()

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = if (isEnglish) "5. Seller's Deed Number (Optional)" else "৫. বিক্রেতার সাবেক দলিল নম্বর (ঐচ্ছিক)",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = if (isEnglish) "Providing seller's acquisition deed number triggers rule R8 checks:" else "বিক্রেতা যে দলিলের মাধ্যমে জমি অর্জন করেছিলেন সেই নম্বর দিলে R8 নিয়ম পরীক্ষা চালু হবে:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            OutlinedTextField(
                value = deedNoInput,
                onValueChange = onDeedNoChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(if (isEnglish) "e.g. 0109/2010" else "যেমন: ০১০৯/২০১০") },
                placeholder = { Text("1234/2020") },
                isError = error != null,
                singleLine = true
            )

            error?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isEnglish) "Optional field. If skipped, remaining rules will be verified." else "এটি বাধ্যতামূলক নয়। না দিলে দলিল যাচাই স্কিপ করে বাকি নিয়মগুলো চেক করা হবে।",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun Step6ReviewSummary(
    selectedMouzaId: String,
    dagInput: String,
    selectedSellerId: String?,
    customSellerName: String,
    isNotInKhatian: Boolean,
    areaInput: String,
    deedNoInput: String,
    landData: LandData,
    onEditStep: (Int) -> Unit
) {
    val isEnglish = BanglaFormatter.isEnglish()
    val mouza = landData.locations.mouzas.find { it.id == selectedMouzaId }
    val mouzaName = mouza?.name?.text(isEnglish) ?: selectedMouzaId

    val peopleMap = landData.people.associateBy { it.id }
    val sellerDisplay = if (isNotInKhatian) customSellerName else peopleMap[selectedSellerId]?.name?.text(isEnglish) ?: selectedSellerId ?: if (isEnglish) "Selected Seller" else "নির্বাচিত"

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = if (isEnglish) "6. Summary & Confirmation" else "৬. আপনার দেওয়া তথ্যের সারসংক্ষেপ",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = if (isEnglish) "Review input details before running verification (tap any row to edit):" else "যাচাই শুরু করার আগে তথ্যগুলো মিলিয়ে নিন (যেকোনো সারিতে ট্যাপ করে এডিট করতে পারেন):",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        item {
            TsCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    ReviewRow(
                        label = if (isEnglish) "Mouza & Upazila" else "মৌজা ও উপজেলা",
                        value = "$mouzaName (${landData.locations.upazila.name.text(isEnglish)})",
                        onEdit = { onEditStep(1) }
                    )
                    ReviewRow(
                        label = if (isEnglish) "Dag / Plot Number" else "দাগ নম্বর",
                        value = BanglaFormatter.toBanglaDigits(dagInput, if (isEnglish) "en" else "bn"),
                        onEdit = { onEditStep(2) }
                    )
                    ReviewRow(
                        label = if (isEnglish) "Seller Name" else "বিক্রেতার নাম",
                        value = sellerDisplay,
                        onEdit = { onEditStep(3) }
                    )
                    ReviewRow(
                        label = if (isEnglish) "Land Area" else "জমির পরিমাণ",
                        value = if (isEnglish) "${BanglaFormatter.toBanglaDigits(areaInput, "en")} decimals" else "${BanglaFormatter.toBanglaDigits(areaInput)} শতাংশ",
                        onEdit = { onEditStep(4) }
                    )
                    ReviewRow(
                        label = if (isEnglish) "Seller's Deed No." else "সাবেক দলিল নম্বর",
                        value = if (deedNoInput.isNotBlank()) BanglaFormatter.toBanglaDigits(deedNoInput, if (isEnglish) "en" else "bn") else if (isEnglish) "Not provided (Optional)" else "দেওয়া হয়নি (ঐচ্ছিক)",
                        onEdit = { onEditStep(5) }
                    )
                }
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Shield,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isEnglish) "Tapping 'Run Verification' will check records against 8 security rules instantly." else "নিচের 'যাচাই করুন' বাটনে চাপ দিলে ৮টি সুরক্ষা নিয়মে তথ্য দ্রুত স্ক্যান হবে।",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

@Composable
private fun ReviewRow(
    label: String,
    value: String,
    onEdit: () -> Unit
) {
    val isEnglish = BanglaFormatter.isEnglish()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable { onEdit() }
            .padding(vertical = 8.dp, horizontal = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        IconButton(onClick = onEdit) {
            Icon(
                imageVector = Icons.Rounded.Edit,
                contentDescription = if (isEnglish) "Edit" else "সম্পাদনা করুন",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
