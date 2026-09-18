package com.anivault.app.ui.screens.schedule

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anivault.app.data.api.ApiService
import com.anivault.app.data.model.Anime
import com.anivault.app.ui.components.AnimeCard
import com.anivault.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

data class WeekdayInfo(
    val key: String,
    val label: String,
    val dateString: String,
    val isToday: Boolean
)

@Composable
fun ScheduleScreen(
    apiService: ApiService,
    watchlistIds: Set<Int>,
    watchedIds: Set<Int>,
    onAddToWatchlist: (Anime) -> Unit,
    onMarkWatched: (Anime) -> Unit
) {
    var weekOffset by remember { mutableStateOf(0) }
    var selectedDay by remember {
        mutableStateOf(
            when (Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) {
                Calendar.MONDAY -> "monday"
                Calendar.TUESDAY -> "tuesday"
                Calendar.WEDNESDAY -> "wednesday"
                Calendar.THURSDAY -> "thursday"
                Calendar.FRIDAY -> "friday"
                Calendar.SATURDAY -> "saturday"
                Calendar.SUNDAY -> "sunday"
                else -> "monday"
            }
        )
    }

    var scheduleAnime by remember { mutableStateOf<List<Anime>>(emptyList()) }
    var scheduleDate by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    // Calculate Weekdays based on weekOffset
    val weekdays = remember(weekOffset) {
        val days = listOf("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
        val labels = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
        val cal = Calendar.getInstance()
        val jsDay = cal.get(Calendar.DAY_OF_WEEK)
        // Convert to Monday-based index (Monday = 0, Sunday = 6)
        val currentDayIndex = (jsDay + 5) % 7
        val todayKey = days[currentDayIndex]

        val sdf = SimpleDateFormat("MMM d", Locale.US)

        days.mapIndexed { index, dayKey ->
            val targetCal = Calendar.getInstance()
            val diff = (index - currentDayIndex) + (weekOffset * 7)
            targetCal.add(Calendar.DAY_OF_YEAR, diff)

            WeekdayInfo(
                key = dayKey,
                label = labels[index],
                dateString = sdf.format(targetCal.time),
                isToday = (weekOffset == 0 && dayKey == todayKey)
            )
        }
    }

    // Week Range Label
    val weekRangeLabel = remember(weekdays, weekOffset) {
        if (weekdays.isEmpty()) ""
        else {
            val first = weekdays.first().dateString
            val last = weekdays.last().dateString
            when (weekOffset) {
                0 -> "$first – $last (Current Week)"
                -1 -> "$first – $last (Previous Week)"
                1 -> "$first – $last (Next Week)"
                else -> if (weekOffset < 0) "$first – $last (${Math.abs(weekOffset)} Wks Ago)" else "$first – $last ($weekOffset Wks Ahead)"
            }
        }
    }

    // Fetch Schedule
    LaunchedEffect(selectedDay, weekOffset) {
        isLoading = true
        try {
            val res = apiService.getSchedule(day = selectedDay, weekOffset = weekOffset, page = 1, limit = 25)
            if (res.isSuccessful) {
                scheduleAnime = res.body()?.data ?: emptyList()
                scheduleDate = res.body()?.date ?: ""
            }
        } catch (e: Exception) {
            scheduleAnime = emptyList()
        } finally {
            isLoading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        // Week Navigator Bar
        Card(
            shape = RoundedCornerShape(10.dp),
            colors = CardDefaults.cardColors(containerColor = BgCard),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { weekOffset-- }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Week", tint = TextMain)
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = weekRangeLabel,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    if (weekOffset != 0) {
                        Text(
                            text = "Jump to Current Week",
                            fontSize = 10.sp,
                            color = PrimaryIndigo,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clickable { weekOffset = 0 }
                                .padding(top = 2.dp)
                        )
                    }
                }

                IconButton(onClick = { weekOffset++ }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.ChevronRight, contentDescription = "Next Week", tint = TextMain)
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 7-Day Horizontal Scroll Selector
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            weekdays.forEach { dayInfo ->
                val isSelected = selectedDay == dayInfo.key
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isSelected) PrimaryIndigo.copy(alpha = 0.25f) else BgCard)
                        .border(
                            1.dp,
                            if (isSelected) PrimaryIndigo else BorderColor,
                            RoundedCornerShape(10.dp)
                        )
                        .clickable { selectedDay = dayInfo.key }
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = dayInfo.label.take(3),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color.White
                        )
                        Text(
                            text = dayInfo.dateString,
                            fontSize = 11.sp,
                            color = TextDim
                        )
                        if (dayInfo.isToday) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 4.dp)
                                    .background(AccentCyan, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "TODAY",
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Selected Day Airing Count Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AccessTime, contentDescription = null, tint = AccentCyan, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "${selectedDay.capitalize()} Releases",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
            }
            Text(
                text = "${scheduleAnime.size} Anime Airing",
                fontSize = 11.sp,
                color = TextDim
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = PrimaryIndigo)
            }
        } else if (scheduleAnime.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No releases found for ${selectedDay.capitalize()}.", color = TextMuted)
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(scheduleAnime) { anime ->
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
    }
}

private fun String.capitalize(): String {
    return this.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() }
}
