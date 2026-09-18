package com.anivault.app.data.model

import com.google.gson.annotations.SerializedName

data class Anime(
    @SerializedName("mal_id")
    val malId: Int? = null,
    val title: String = "",
    @SerializedName("original_title")
    val originalTitle: String? = null,
    @SerializedName("image_url")
    val imageUrl: String? = null,
    val rating: Double = 0.0,
    val episodes: Int? = null,
    val status: String? = null,
    val broadcast: String? = null,
    @SerializedName("broadcast_time")
    val broadcastTime: String? = null,
    @SerializedName("airing_date")
    val airingDate: String? = null,
    val day: String? = null,
    val genres: List<String> = emptyList(),
    val genre: String? = null,
    val synopsis: String? = null,
    val year: Int? = null
)

data class Pagination(
    @SerializedName("current_page")
    val currentPage: Int = 1,
    @SerializedName("has_next_page")
    val hasNextPage: Boolean = false,
    @SerializedName("last_visible_page")
    val lastVisiblePage: Int = 1,
    @SerializedName("total_items")
    val totalItems: Int? = null
)

data class OngoingResponse(
    val success: Boolean,
    val data: List<Anime> = emptyList(),
    val pagination: Pagination? = null
)

data class ScheduleResponse(
    val success: Boolean,
    val day: String? = null,
    val date: String? = null,
    val weekOffset: Int = 0,
    val count: Int = 0,
    val data: List<Anime> = emptyList()
)

data class AnimeListResponse(
    val success: Boolean,
    val count: Int = 0,
    val data: List<Anime> = emptyList()
)
