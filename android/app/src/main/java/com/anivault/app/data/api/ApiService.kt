package com.anivault.app.data.api

import com.anivault.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("login/newuser")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    // Anime Search & Discover
    @GET("anime/search")
    suspend fun searchAnime(
        @Query("q") query: String,
        @Query("limit") limit: Int = 12
    ): Response<AnimeListResponse>

    @GET("anime/trending")
    suspend fun getTrending(
        @Query("limit") limit: Int = 5
    ): Response<AnimeListResponse>

    @GET("anime/ongoing")
    suspend fun getOngoing(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): Response<OngoingResponse>

    @GET("anime/schedule")
    suspend fun getSchedule(
        @Query("day") day: String = "monday",
        @Query("weekOffset") weekOffset: Int = 0,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): Response<ScheduleResponse>

    // Watchlist
    @GET("watchlist")
    suspend fun getWatchlist(): Response<WatchlistResponse>

    @POST("watchlist")
    suspend fun addToWatchlist(@Body request: AddWatchlistRequest): Response<GenericResponse>

    @DELETE("watchlist/{id}")
    suspend fun removeFromWatchlist(@Path("id") id: Int): Response<GenericResponse>

    // Watched
    @GET("watched")
    suspend fun getWatched(
        @Query("sort") sort: String = "recent"
    ): Response<WatchedResponse>

    @POST("watched")
    suspend fun addToWatched(@Body request: AddWatchedRequest): Response<GenericResponse>

    @PUT("watched/{id}")
    suspend fun updateWatched(
        @Path("id") id: Int,
        @Body request: UpdateWatchedRequest
    ): Response<GenericResponse>

    @DELETE("watched/{id}")
    suspend fun deleteWatched(@Path("id") id: Int): Response<GenericResponse>
}
