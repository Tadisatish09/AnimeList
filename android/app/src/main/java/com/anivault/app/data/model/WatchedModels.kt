package com.anivault.app.data.model

import com.google.gson.annotations.SerializedName

data class WatchedItem(
    val id: Int,
    @SerializedName("user_id")
    val userId: Int,
    @SerializedName("mal_id")
    val malId: Int?,
    val title: String,
    @SerializedName("image_url")
    val imageUrl: String?,
    val rating: Double?,
    val notes: String?,
    @SerializedName("start_date")
    val startDate: String?,
    @SerializedName("completed_date")
    val completedDate: String?,
    val genre: String?,
    val description: String?,
    @SerializedName("created_at")
    val createdAt: String?
)

data class AddWatchedRequest(
    val title: String,
    @SerializedName("image_url")
    val imageUrl: String?,
    @SerializedName("mal_id")
    val malId: Int?,
    val rating: Double?,
    val notes: String?,
    @SerializedName("start_date")
    val startDate: String?,
    @SerializedName("completed_date")
    val completedDate: String?,
    val genre: String?,
    val description: String?,
    @SerializedName("remove_from_watchlist")
    val removeFromWatchlist: Boolean? = true
)

data class UpdateWatchedRequest(
    val rating: Double?,
    val notes: String?,
    @SerializedName("start_date")
    val startDate: String?,
    @SerializedName("completed_date")
    val completedDate: String?,
    val genre: String?,
    val description: String?
)

data class WatchedResponse(
    val success: Boolean,
    val count: Int = 0,
    val data: List<WatchedItem> = emptyList()
)

data class GenericResponse(
    val success: Boolean,
    val message: String?
)
