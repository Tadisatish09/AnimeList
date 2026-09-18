package com.anivault.app.ui.screens.watched

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.anivault.app.data.model.WatchedItem
import com.anivault.app.ui.theme.*
import kotlin.math.ceil
import kotlin.math.max

@Composable
fun WatchedScreen(
    items: List<WatchedItem>,
    isLoading: Boolean,
    onEditItem: (WatchedItem) -> Unit,
    onDeleteItem: (Int) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var sortBy by remember { mutableStateOf("recent") }
    var currentPage by remember { mutableIntStateOf(1) }
    val pageSize = 10

    // Reset pagination when search query changes
    LaunchedEffect(searchQuery, sortBy) {
        currentPage = 1
    }

    val filteredList = remember(items, searchQuery, sortBy) {
        val filtered = if (searchQuery.isBlank()) items
        else items.filter {
            it.title.contains(searchQuery, ignoreCase = true) ||
            it.genre?.contains(searchQuery, ignoreCase = true) == true ||
            it.notes?.contains(searchQuery, ignoreCase = true) == true
        }

        when (sortBy) {
            "rating_desc" -> filtered.sortedByDescending { it.rating ?: 0.0 }
            "rating_asc" -> filtered.sortedBy { it.rating ?: 0.0 }
            "title" -> filtered.sortedBy { it.title.lowercase() }
            else -> filtered // recent by default
        }
    }

    val totalPages = max(1, ceil(filteredList.size.toDouble() / pageSize).toInt())
    val pagedList = remember(filteredList, currentPage) {
        val startIndex = (currentPage - 1) * pageSize
        filteredList.drop(startIndex).take(pageSize)
    }

    val avgScore = remember(items) {
        if (items.isEmpty()) "0.0"
        else String.format(java.util.Locale.US, "%.1f", items.mapNotNull { it.rating }.average())
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Completed Anime",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White
                )
                Text(
                    text = "${items.size} Finished • Avg Score: $avgScore / 10",
                    fontSize = 12.sp,
                    color = AccentGold
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // In-list search
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search completed...", color = TextDim, fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextDim) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = PrimaryIndigo,
                unfocusedBorderColor = BorderColor,
                focusedTextColor = TextMain,
                unfocusedTextColor = TextMain,
                focusedContainerColor = BgInput,
                unfocusedContainerColor = BgInput
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = PrimaryIndigo)
            }
        } else if (items.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.CheckCircleOutline,
                        contentDescription = null,
                        tint = TextDim,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("No Completed Anime Logged", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    Text("Finished an anime? Mark it as watched and leave a review!", color = TextMuted, fontSize = 12.sp)
                }
            }
        } else if (filteredList.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No matching completed anime found.", color = TextMuted)
            }
        } else {
            Column(modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    items(pagedList, key = { it.id }) { item ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = BgCard)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                // Poster Thumbnail
                                Box(
                                    modifier = Modifier
                                        .width(72.dp)
                                        .height(104.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF111420))
                                        .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                                ) {
                                    if (!item.imageUrl.isNullOrBlank()) {
                                        AsyncImage(
                                            model = item.imageUrl,
                                            contentDescription = item.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier.fillMaxSize(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.Default.Movie,
                                                contentDescription = null,
                                                tint = TextDim,
                                                modifier = Modifier.size(24.dp)
                                            )
                                        }
                                    }
                                }

                                // Details
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )

                                    Spacer(modifier = Modifier.height(3.dp))

                                    // Rating Badge
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.Star,
                                            contentDescription = null,
                                            tint = AccentGold,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "${item.rating?.toInt() ?: 8} / 10",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            color = AccentGold
                                        )
                                    }

                                    if (!item.startDate.isNullOrBlank() || !item.completedDate.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.DateRange,
                                                contentDescription = null,
                                                tint = AccentCyan.copy(alpha = 0.8f),
                                                modifier = Modifier.size(12.dp)
                                            )
                                            val dateText = buildString {
                                                if (!item.startDate.isNullOrBlank()) {
                                                    append("Start: ${item.startDate.take(10)}")
                                                }
                                                if (!item.startDate.isNullOrBlank() && !item.completedDate.isNullOrBlank()) {
                                                    append(" • ")
                                                }
                                                if (!item.completedDate.isNullOrBlank()) {
                                                    append("End: ${item.completedDate.take(10)}")
                                                }
                                            }
                                            Text(
                                                text = dateText,
                                                fontSize = 11.sp,
                                                color = TextMuted,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }

                                    if (!item.notes.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Text(
                                            text = "\"${item.notes}\"",
                                            fontSize = 11.sp,
                                            color = TextMuted,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = { onEditItem(item) },
                                            shape = RoundedCornerShape(6.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo.copy(alpha = 0.2f)),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Text("Edit Review", fontSize = 10.sp, color = Color(0xFFA5B4FC), fontWeight = FontWeight.Bold)
                                        }

                                        Button(
                                            onClick = { onDeleteItem(item.id) },
                                            shape = RoundedCornerShape(6.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = AccentRose.copy(alpha = 0.15f)),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Text("Delete", fontSize = 10.sp, color = AccentRose, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Pagination Navigation Controls
                if (totalPages > 1) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BgCard, RoundedCornerShape(12.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = { if (currentPage > 1) currentPage-- },
                            enabled = currentPage > 1,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color.White,
                                disabledContentColor = TextDim
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (currentPage > 1) PrimaryIndigo else BorderColor
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Prev", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        Text(
                            text = "Page $currentPage of $totalPages  (${filteredList.size} total)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AccentCyan
                        )

                        OutlinedButton(
                            onClick = { if (currentPage < totalPages) currentPage++ },
                            enabled = currentPage < totalPages,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color.White,
                                disabledContentColor = TextDim
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (currentPage < totalPages) PrimaryIndigo else BorderColor
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Text("Next", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    }
                }
            }
        }
    }
}
