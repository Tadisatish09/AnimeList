package com.anivault.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anivault.app.ui.theme.*

enum class AppTab(val title: String, val icon: ImageVector) {
    DISCOVER("Discover", Icons.Default.Search),
    SCHEDULE("Schedule", Icons.Default.CalendarMonth),
    WATCHLIST("Watchlist", Icons.Default.Bookmark),
    COMPLETED("Completed", Icons.Default.CheckCircle)
}

@Composable
fun BottomNavBar(
    selectedTab: AppTab,
    onTabSelected: (AppTab) -> Unit,
    watchlistCount: Int = 0,
    watchedCount: Int = 0
) {
    NavigationBar(
        containerColor = BgDark.copy(alpha = 0.95f),
        contentColor = TextMain,
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderColor)
    ) {
        AppTab.values().forEach { tab ->
            val isSelected = selectedTab == tab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = {
                    BadgedBox(
                        badge = {
                            if (tab == AppTab.WATCHLIST && watchlistCount > 0) {
                                Badge(containerColor = PrimaryIndigo) { Text("$watchlistCount") }
                            } else if (tab == AppTab.COMPLETED && watchedCount > 0) {
                                Badge(containerColor = AccentEmerald) { Text("$watchedCount") }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.title,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                },
                label = {
                    Text(
                        text = tab.title,
                        fontSize = 11.sp,
                        color = if (isSelected) PrimaryIndigo else TextDim
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryIndigo,
                    unselectedIconColor = TextDim,
                    indicatorColor = PrimaryIndigo.copy(alpha = 0.15f)
                )
            )
        }
    }
}
