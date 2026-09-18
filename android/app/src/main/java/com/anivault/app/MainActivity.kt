package com.anivault.app

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.anivault.app.data.api.ApiClient
import com.anivault.app.data.local.SessionManager
import com.anivault.app.data.model.*
import com.anivault.app.ui.components.*
import com.anivault.app.ui.screens.discover.DiscoverScreen
import com.anivault.app.ui.screens.login.LoginScreen
import com.anivault.app.ui.screens.schedule.ScheduleScreen
import com.anivault.app.ui.screens.watched.WatchedScreen
import com.anivault.app.ui.screens.watchlist.WatchlistScreen
import com.anivault.app.ui.theme.AniVaultTheme
import com.anivault.app.ui.theme.BgDark
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AniVaultTheme {
                AniVaultApp()
            }
        }
    }
}

@Composable
fun AniVaultApp() {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val apiService = remember { ApiClient.getInstance(context) }
    val coroutineScope = rememberCoroutineScope()

    var isLoggedIn by remember { mutableStateOf(sessionManager.isLoggedIn()) }
    var currentUser by remember { mutableStateOf(sessionManager.getUser()) }

    var currentTab by remember { mutableStateOf(AppTab.DISCOVER) }

    var watchlist by remember { mutableStateOf<List<WatchlistItem>>(emptyList()) }
    var watchedList by remember { mutableStateOf<List<WatchedItem>>(emptyList()) }
    var isLoadingLists by remember { mutableStateOf(false) }

    var ratingDialogAnime by remember { mutableStateOf<Anime?>(null) }
    var editingWatchedItem by remember { mutableStateOf<WatchedItem?>(null) }

    val watchlistIds = remember(watchlist) { watchlist.mapNotNull { it.malId }.toSet() }
    val watchedIds = remember(watchedList) { watchedList.mapNotNull { it.malId }.toSet() }

    // Fetch user lists
    fun refreshUserLists() {
        if (!isLoggedIn) return
        isLoadingLists = true
        coroutineScope.launch {
            try {
                val wlRes = apiService.getWatchlist()
                if (wlRes.isSuccessful) {
                    watchlist = wlRes.body()?.data ?: emptyList()
                }
                val wRes = apiService.getWatched()
                if (wRes.isSuccessful) {
                    watchedList = wRes.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                // Ignore network glitch
            } finally {
                isLoadingLists = false
            }
        }
    }

    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) {
            currentUser = sessionManager.getUser()
            refreshUserLists()
        }
    }

    if (!isLoggedIn) {
        LoginScreen(
            apiService = apiService,
            sessionManager = sessionManager,
            onLoginSuccess = {
                isLoggedIn = true
                currentUser = sessionManager.getUser()
                refreshUserLists()
            }
        )
    } else {
        Scaffold(
            topBar = {
                TopHeader(
                    user = currentUser,
                    onLogout = {
                        sessionManager.clearSession()
                        isLoggedIn = false
                        currentUser = null
                        watchlist = emptyList()
                        watchedList = emptyList()
                        Toast.makeText(context, "Logged out successfully", Toast.LENGTH_SHORT).show()
                    }
                )
            },
            bottomBar = {
                BottomNavBar(
                    selectedTab = currentTab,
                    onTabSelected = { currentTab = it },
                    watchlistCount = watchlist.size,
                    watchedCount = watchedList.size
                )
            },
            containerColor = BgDark
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(BgDark)
            ) {
                when (currentTab) {
                    AppTab.DISCOVER -> DiscoverScreen(
                        apiService = apiService,
                        watchlistIds = watchlistIds,
                        watchedIds = watchedIds,
                        onAddToWatchlist = { anime ->
                            coroutineScope.launch {
                                try {
                                    val res = apiService.addToWatchlist(
                                        AddWatchlistRequest(
                                            name = anime.title,
                                            imageUrl = anime.imageUrl,
                                            malId = anime.malId,
                                            genre = anime.genre ?: anime.genres.joinToString(", "),
                                            description = anime.synopsis
                                        )
                                    )
                                    if (res.isSuccessful) {
                                        Toast.makeText(context, "Added to Watchlist!", Toast.LENGTH_SHORT).show()
                                        refreshUserLists()
                                    } else {
                                        Toast.makeText(context, "Could not add to watchlist", Toast.LENGTH_SHORT).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        onMarkWatched = { anime ->
                            ratingDialogAnime = anime
                        }
                    )
                    AppTab.SCHEDULE -> ScheduleScreen(
                        apiService = apiService,
                        watchlistIds = watchlistIds,
                        watchedIds = watchedIds,
                        onAddToWatchlist = { anime ->
                            coroutineScope.launch {
                                try {
                                    val res = apiService.addToWatchlist(
                                        AddWatchlistRequest(
                                            name = anime.title,
                                            imageUrl = anime.imageUrl,
                                            malId = anime.malId,
                                            genre = anime.genre ?: anime.genres.joinToString(", "),
                                            description = anime.synopsis
                                        )
                                    )
                                    if (res.isSuccessful) {
                                        Toast.makeText(context, "Added to Watchlist!", Toast.LENGTH_SHORT).show()
                                        refreshUserLists()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        onMarkWatched = { anime ->
                            ratingDialogAnime = anime
                        }
                    )
                    AppTab.WATCHLIST -> WatchlistScreen(
                        items = watchlist,
                        isLoading = isLoadingLists,
                        onCompleteItem = { item ->
                            ratingDialogAnime = Anime(
                                malId = item.malId,
                                title = item.name,
                                imageUrl = item.imageUrl,
                                genre = item.genre,
                                synopsis = item.description
                            )
                        },
                        onRemoveItem = { id ->
                            coroutineScope.launch {
                                try {
                                    val res = apiService.removeFromWatchlist(id)
                                    if (res.isSuccessful) {
                                        Toast.makeText(context, "Removed from Watchlist", Toast.LENGTH_SHORT).show()
                                        refreshUserLists()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    )
                    AppTab.COMPLETED -> WatchedScreen(
                        items = watchedList,
                        isLoading = isLoadingLists,
                        onEditItem = { item ->
                            editingWatchedItem = item
                        },
                        onDeleteItem = { id ->
                            coroutineScope.launch {
                                try {
                                    val res = apiService.deleteWatched(id)
                                    if (res.isSuccessful) {
                                        Toast.makeText(context, "Deleted from Completed", Toast.LENGTH_SHORT).show()
                                        refreshUserLists()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    )
                }

                // Rating Dialog for Marking as Watched
                if (ratingDialogAnime != null) {
                    val anime = ratingDialogAnime!!
                    RatingDialog(
                        animeTitle = anime.title,
                        animeImageUrl = anime.imageUrl,
                        initialRating = 8.0,
                        initialNotes = "",
                        initialStartDate = null,
                        initialCompletedDate = null,
                        isEditing = false,
                        onDismiss = { ratingDialogAnime = null },
                        onSubmit = { rating, notes, startDate, completedDate, removeFromWatchlist ->
                            ratingDialogAnime = null
                            coroutineScope.launch {
                                try {
                                    val res = apiService.addToWatched(
                                        AddWatchedRequest(
                                            title = anime.title,
                                            imageUrl = anime.imageUrl,
                                            malId = anime.malId,
                                            rating = rating,
                                            notes = notes,
                                            startDate = startDate,
                                            completedDate = completedDate,
                                            genre = anime.genre ?: anime.genres.joinToString(", "),
                                            description = anime.synopsis,
                                            removeFromWatchlist = removeFromWatchlist
                                        )
                                    )
                                    if (res.isSuccessful) {
                                        Toast.makeText(context, "Logged as Completed!", Toast.LENGTH_SHORT).show()
                                        refreshUserLists()
                                    } else {
                                        Toast.makeText(context, "Failed to log as completed", Toast.LENGTH_SHORT).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    )
                }

                // Edit Dialog for Existing Completed Item
                if (editingWatchedItem != null) {
                    val item = editingWatchedItem!!
                    RatingDialog(
                        animeTitle = item.title,
                        animeImageUrl = item.imageUrl,
                        initialRating = item.rating ?: 8.0,
                        initialNotes = item.notes ?: "",
                        initialStartDate = item.startDate,
                        initialCompletedDate = item.completedDate,
                        isEditing = true,
                        onDismiss = { editingWatchedItem = null },
                        onSubmit = { rating, notes, startDate, completedDate, _ ->
                            val editId = item.id
                            editingWatchedItem = null
                            coroutineScope.launch {
                                try {
                                    val res = apiService.updateWatched(
                                        editId,
                                        UpdateWatchedRequest(
                                            rating = rating,
                                            notes = notes,
                                            startDate = startDate,
                                            completedDate = completedDate,
                                            genre = item.genre,
                                            description = item.description
                                        )
                                    )
                                    if (res.isSuccessful) {
                                        Toast.makeText(context, "Review updated!", Toast.LENGTH_SHORT).show()
                                        refreshUserLists()
                                    } else {
                                        Toast.makeText(context, "Failed to update review", Toast.LENGTH_SHORT).show()
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}
