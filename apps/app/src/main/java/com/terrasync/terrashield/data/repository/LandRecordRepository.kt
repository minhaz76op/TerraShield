package com.terrasync.terrashield.data.repository

import android.content.Context
import com.terrasync.terrashield.domain.model.*
import kotlinx.serialization.json.Json

interface LandRecordRepository {
    fun getLandData(): LandData
    fun getUnitsData(): UnitsData
    fun addExtraDeeds(extraDeeds: List<Deed>)
    fun resetData()
}

class LandRecordRepositoryImpl(
    private val jsonProvider: (String) -> String
) : LandRecordRepository {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private var initialLandData: LandData = LandData()
    private var currentLandData: LandData = LandData()
    private var cachedUnitsData: UnitsData = UnitsData()

    init {
        loadData()
    }

    companion object {
        fun createFromAssets(context: Context): LandRecordRepositoryImpl {
            return LandRecordRepositoryImpl { path ->
                context.assets.open(path).bufferedReader().use { it.readText() }
            }
        }

        fun createFromResources(loader: (String) -> String): LandRecordRepositoryImpl {
            return LandRecordRepositoryImpl(loader)
        }
    }

    private fun loadData() {
        runCatching {
            val locations = json.decodeFromString<LocationsData>(jsonProvider("data/locations.json"))
            val plots = json.decodeFromString<PlotsData>(jsonProvider("data/plots.json")).plots
            val khatians = json.decodeFromString<KhatiansData>(jsonProvider("data/khatians.json")).khatians
            val deeds = json.decodeFromString<DeedsData>(jsonProvider("data/deeds.json")).deeds
            val namjari = json.decodeFromString<NamjariData>(jsonProvider("data/namjari.json")).namjari
            val people = json.decodeFromString<PeopleData>(jsonProvider("data/people.json")).people

            initialLandData = LandData(
                locations = locations,
                plots = plots,
                khatians = khatians,
                deeds = deeds,
                namjari = namjari,
                people = people
            )
            currentLandData = initialLandData
        }

        runCatching {
            cachedUnitsData = json.decodeFromString<UnitsData>(jsonProvider("config/units.json"))
        }
    }

    override fun getLandData(): LandData = currentLandData

    override fun getUnitsData(): UnitsData = cachedUnitsData

    override fun addExtraDeeds(extraDeeds: List<Deed>) {
        currentLandData = currentLandData.copy(
            deeds = currentLandData.deeds + extraDeeds
        )
    }

    override fun resetData() {
        currentLandData = initialLandData
    }
}
