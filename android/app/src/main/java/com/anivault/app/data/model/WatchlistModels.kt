package com.anivault.app.data.model

import com.google.gson.annotations.SerializedName

data class WatchlistItem(
    val id: Int,
    @SerializedName("user_id")
    val userId: Int,
    @SerializedName("mal_id")
    val malId: Int?,
    val name: String,
    @SerializedName("image_url")
    val imageUrl: String?,
    val genre: String?,
    val description: String?,
    @SerializedName("created_at")
    val createdAt: String?
)

data class AddWatchlistRequest(
    val name: String,
    @SerializedName("image_url")
    val imageUrl: String?,
    @SerializedName("mal_id")
    val malId: Int?,
    val genre: String?,
    val description: String?
)

data class WatchlistResponse(
    val success: Boolean,
    val count: Int = 0,
    val data: List<WatchlistItem> = emptyList()
)
