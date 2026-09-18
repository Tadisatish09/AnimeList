package com.anivault.app.ui.components

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.anivault.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun RatingDialog(
    animeTitle: String,
    animeImageUrl: String? = null,
    initialRating: Double = 8.0,
    initialNotes: String = "",
    initialStartDate: String? = null,
    initialCompletedDate: String? = null,
    isEditing: Boolean = false,
    onDismiss: () -> Unit,
    onSubmit: (
        rating: Double,
        notes: String,
        startDate: String?,
        completedDate: String?,
        removeFromWatchlist: Boolean
    ) -> Unit
) {
    val context = LocalContext.current
    val todayStr = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    var rating by remember { mutableStateOf(initialRating) }
    var notes by remember { mutableStateOf(initialNotes) }
    var startDate by remember { mutableStateOf(initialStartDate?.take(10) ?: "") }
    var completedDate by remember {
        mutableStateOf(initialCompletedDate?.take(10) ?: todayStr)
    }
    var removeFromWatchlist by remember { mutableStateOf(true) }

    fun openDatePicker(currentValue: String, onSelected: (String) -> Unit) {
        val cal = Calendar.getInstance()
        var y = cal.get(Calendar.YEAR)
        var m = cal.get(Calendar.MONTH)
        var d = cal.get(Calendar.DAY_OF_MONTH)

        if (currentValue.isNotBlank()) {
            try {
                val parts = currentValue.split("-")
                if (parts.size == 3) {
                    y = parts[0].toInt()
                    m = parts[1].toInt() - 1
                    d = parts[2].toInt()
                }
            } catch (ignored: Exception) {}
        }

        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val formatted = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, dayOfMonth)
                onSelected(formatted)
            },
            y,
            m,
            d
        ).show()
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .padding(vertical = 16.dp)
                .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp)
            ) {
                // Header with Close Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!animeImageUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = animeImageUrl,
                                contentDescription = animeTitle,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .width(46.dp)
                                    .height(64.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .border(1.dp, BorderColor, RoundedCornerShape(8.dp))
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = AccentGold.copy(alpha = 0.15f),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AccentGold.copy(alpha = 0.4f)),
                                modifier = Modifier.padding(bottom = 4.dp)
                            ) {
                                Text(
                                    text = if (isEditing) "EDIT WATCHED ENTRY" else "LOG AS COMPLETED",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = AccentGold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                            Text(
                                text = animeTitle,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Score Selector Label & Number
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Your Personal Score (1 - 10)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextMuted
                    )
                    Text(
                        text = "${rating.toInt()} / 10",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentGold
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // 1 to 10 Number Button Grid / Selector
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0D0F18), RoundedCornerShape(8.dp))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    for (score in 1..10) {
                        val isSelected = score == rating.toInt()
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(32.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    if (isSelected) AccentGold else Color.White.copy(alpha = 0.05f)
                                )
                                .clickable { rating = score.toDouble() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = score.toString(),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.Black else TextMuted
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Star row for quick visualization
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    for (i in 1..10) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Star $i",
                            tint = if (i <= rating) AccentGold else TextDim.copy(alpha = 0.3f),
                            modifier = Modifier
                                .size(22.dp)
                                .clickable { rating = i.toDouble() }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Start Date & Completion Date Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Start Date
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Start Date (Optional)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedCard(
                            onClick = {
                                openDatePicker(startDate) { startDate = it }
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.outlinedCardColors(containerColor = BgInput),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.DateRange,
                                        contentDescription = null,
                                        tint = AccentCyan,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (startDate.isNotBlank()) startDate else "YYYY-MM-DD",
                                        fontSize = 12.sp,
                                        color = if (startDate.isNotBlank()) TextMain else TextDim,
                                        maxLines = 1
                                    )
                                }
                                if (startDate.isNotBlank()) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Clear start date",
                                        tint = TextDim,
                                        modifier = Modifier
                                            .size(16.dp)
                                            .clickable { startDate = "" }
                                    )
                                }
                            }
                        }
                    }

                    // Completion Date
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Completion Date",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedCard(
                            onClick = {
                                openDatePicker(completedDate) { completedDate = it }
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.outlinedCardColors(containerColor = BgInput),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DateRange,
                                    contentDescription = null,
                                    tint = AccentGold,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (completedDate.isNotBlank()) completedDate else todayStr,
                                    fontSize = 12.sp,
                                    color = TextMain,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Review Notes Text Field
                Text(
                    text = "Personal Review / Notes",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextMuted
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = {
                        Text(
                            "What did you think of the ending, animation, or characters?",
                            color = TextDim,
                            fontSize = 12.sp
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryIndigo,
                        unfocusedBorderColor = BorderColor,
                        focusedTextColor = TextMain,
                        unfocusedTextColor = TextMain,
                        focusedContainerColor = BgInput,
                        unfocusedContainerColor = BgInput
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp),
                    shape = RoundedCornerShape(10.dp)
                )

                // Remove from Watchlist Checkbox
                if (!isEditing) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { removeFromWatchlist = !removeFromWatchlist },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = removeFromWatchlist,
                            onCheckedChange = { removeFromWatchlist = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = PrimaryIndigo,
                                uncheckedColor = BorderColor,
                                checkmarkColor = Color.White
                            )
                        )
                        Text(
                            text = "Remove from Watchlist if already present",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextMuted),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                    ) {
                        Text("Cancel", fontSize = 13.sp)
                    }

                    Button(
                        onClick = {
                            onSubmit(
                                rating,
                                notes,
                                startDate.ifBlank { null },
                                completedDate.ifBlank { todayStr },
                                removeFromWatchlist
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1.5f)
                            .height(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isEditing) "Update Rating" else "Save to Watched List",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}
