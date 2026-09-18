package com.anivault.app.ui.screens.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anivault.app.data.api.ApiService
import com.anivault.app.data.model.Anime
import com.anivault.app.ui.components.AnimeCard
import com.anivault.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun DiscoverScreen(
    apiService: ApiService,
    watchlistIds: Set<Int>,
    watchedIds: Set<Int>,
    onAddToWatchlist: (Anime) -> Unit,
    onMarkWatched: (Anime) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<Anime>>(emptyList()) }
    var hasSearched by remember { mutableStateOf(false) }
    var isSearching by remember { mutableStateOf(false) }

    var trendingAnime by remember { mutableStateOf<List<Anime>>(emptyList()) }
    var ongoingAnime by remember { mutableStateOf<List<Anime>>(emptyList()) }
    var ongoingPage by remember { mutableStateOf(1) }
    var hasNextPage by remember { mutableStateOf(true) }
    var lastPage by remember { mutableStateOf(1) }
    var isLoadingOngoing by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()

    // Fetch initial trending and ongoing anime
    LaunchedEffect(Unit) {
        try {
            val trendingRes = apiService.getTrending(5)
            if (trendingRes.isSuccessful) {
                trendingAnime = trendingRes.body()?.data ?: emptyList()
            }
        } catch (e: Exception) {
            // Log error
        }
    }

    LaunchedEffect(ongoingPage) {
        isLoadingOngoing = true
        try {
            val res = apiService.getOngoing(page = ongoingPage, limit = 10)
            if (res.isSuccessful) {
                ongoingAnime = res.body()?.data ?: emptyList()
                res.body()?.pagination?.let { pag ->
                    hasNextPage = pag.hasNextPage
                    lastPage = pag.lastVisiblePage
                }
            }
        } catch (e: Exception) {
            // Log error
        } finally {
            isLoadingOngoing = false
        }
    }

    fun executeSearch(q: String) {
        if (q.isBlank()) return
        isSearching = true
        hasSearched = true
        coroutineScope.launch {
            try {
                val res = apiService.searchAnime(q.trim(), 15)
                if (res.isSuccessful) {
                    searchResults = res.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                searchResults = emptyList()
            } finally {
                isSearching = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        // Search Input Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search any anime (e.g. Solo Leveling, Demon Slayer)...", color = TextDim, fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = TextDim) },
            trailingIcon = {
                if (searchQuery.isNotBlank() || hasSearched) {
                    IconButton(onClick = {
                        searchQuery = ""
                        hasSearched = false
                        searchResults = emptyList()
                    }) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextDim)
                    }
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryIndigo,
                unfocusedBorderColor = BorderColor,
                focusedTextColor = TextMain,
                unfocusedTextColor = TextMain,
                focusedContainerColor = BgInput,
                unfocusedContainerColor = BgInput
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Search Action Button
        if (searchQuery.isNotBlank() && !hasSearched) {
            Button(
                onClick = { executeSearch(searchQuery) },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp)
            ) {
                Text("Search Anime", fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(10.dp))
        }

        if (isSearching) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = PrimaryIndigo)
            }
        } else if (hasSearched) {
            // Search Results Display
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Search Results (${searchResults.size})",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
                TextButton(onClick = {
                    hasSearched = false
                    searchQuery = ""
                    searchResults = emptyList()
                }) {
                    Text("Clear", color = AccentCyan, fontSize = 12.sp)
                }
            }

            if (searchResults.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No anime found. Try another search term.", color = TextMuted)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(searchResults) { anime ->
                        val inWl = anime.malId?.let { watchlistIds.contains(it) } ?: false
                        val isW = anime.malId?.let { watchedIds.contains(it) } ?: false
                        AnimeCard(
                            anime = anime,
                            isInWatchlist = inWl,
                            isWatched = isW,
                            onAddToWatchlist = { onAddToWatchlist(anime) },
                            onMarkWatched = { onMarkWatched(anime) }
                        )
                    }
                }
            }
        } else {
            // Discover Mode (Popular + Ongoing)
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                // Section Title: Ongoing Anime
                item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PlayCircle, contentDescription = null, tint = AccentCyan, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Ongoing Anime",
                                style = MaterialTheme.typography.titleLarge,
                                color = Color.White
                            )
                        }

                        Box(
                            modifier = Modifier
                                .background(AccentCyan.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .border(1.dp, AccentCyan.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "Page $ongoingPage / $lastPage",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = AccentCyan
                            )
                        }
                    }
                }

                items(ongoingAnime) { anime ->
                    val inWl = anime.malId?.let { watchlistIds.contains(it) } ?: false
                    val isW = anime.malId?.let { watchedIds.contains(it) } ?: false
                    AnimeCard(
                        anime = anime,
                        isInWatchlist = inWl,
                        isWatched = isW,
                        onAddToWatchlist = { onAddToWatchlist(anime) },
                        onMarkWatched = { onMarkWatched(anime) }
                    )
                }
            }

            // Pagination Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = { if (ongoingPage > 1) ongoingPage-- },
                    enabled = ongoingPage > 1 && !isLoadingOngoing,
                    colors = ButtonDefaults.buttonColors(containerColor = BgCard),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Prev", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Prev", fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.width(14.dp))

                Text(
                    text = "Page $ongoingPage",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.width(14.dp))

                Button(
                    onClick = { if (hasNextPage) ongoingPage++ },
                    enabled = hasNextPage && !isLoadingOngoing,
                    colors = ButtonDefaults.buttonColors(containerColor = BgCard),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Text("Next", fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(Icons.Default.ChevronRight, contentDescription = "Next", modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
