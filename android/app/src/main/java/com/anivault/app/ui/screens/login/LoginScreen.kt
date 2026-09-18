package com.anivault.app.ui.screens.login

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anivault.app.data.api.ApiService
import com.anivault.app.data.local.SessionManager
import com.anivault.app.data.model.LoginRequest
import com.anivault.app.data.model.RegisterRequest
import com.anivault.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    apiService: ApiService,
    sessionManager: SessionManager,
    onLoginSuccess: () -> Unit
) {
    var isRegisterMode by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderColor, RoundedCornerShape(20.dp)),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Logo
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Brush.linearGradient(listOf(PrimaryIndigo, AccentCyan))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🎌", fontSize = 28.sp)
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "AniVault",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White
                )

                Text(
                    text = if (isRegisterMode) "Create your anime vault account" else "Sign in to access your watchlist",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Mode Selector Toggle
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BgInput, RoundedCornerShape(10.dp))
                        .padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (!isRegisterMode) PrimaryIndigo else Color.Transparent)
                            .clickable { isRegisterMode = false; errorMessage = null }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Sign In",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (!isRegisterMode) Color.White else TextMuted
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isRegisterMode) PrimaryIndigo else Color.Transparent)
                            .clickable { isRegisterMode = true; errorMessage = null }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Register",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (isRegisterMode) Color.White else TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Error / Success Message
                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        color = AccentRose,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )
                }
                if (successMessage != null) {
                    Text(
                        text = successMessage!!,
                        color = AccentEmerald,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )
                }

                // Name field (if register mode)
                AnimatedVisibility(visible = isRegisterMode) {
                    Column {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full Name", color = TextDim, fontSize = 12.sp) },
                            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = TextDim) },
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
                    }
                }

                // Email field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address", color = TextDim, fontSize = 12.sp) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = TextDim) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
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

                // Password field
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password", color = TextDim, fontSize = 12.sp) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextDim) },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = "Toggle Password",
                                tint = TextDim
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
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

                Spacer(modifier = Modifier.height(20.dp))

                // Submit Action Button
                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank() || (isRegisterMode && name.isBlank())) {
                            errorMessage = "Please fill in all fields."
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        successMessage = null

                        coroutineScope.launch {
                            try {
                                if (isRegisterMode) {
                                    val res = apiService.register(RegisterRequest(name, email, password))
                                    if (res.isSuccessful && res.body()?.token != null) {
                                        sessionManager.saveAuthToken(res.body()!!.token!!)
                                        res.body()!!.user?.let { sessionManager.saveUser(it) }
                                        onLoginSuccess()
                                    } else {
                                        errorMessage = res.body()?.message ?: "Registration failed."
                                    }
                                } else {
                                    val res = apiService.login(LoginRequest(email, password))
                                    if (res.isSuccessful && res.body()?.token != null) {
                                        sessionManager.saveAuthToken(res.body()!!.token!!)
                                        res.body()!!.user?.let { sessionManager.saveUser(it) }
                                        onLoginSuccess()
                                    } else {
                                        errorMessage = res.body()?.message ?: "Invalid email or password."
                                    }
                                }
                            } catch (e: Exception) {
                                errorMessage = "Network error: ${e.localizedMessage ?: "Could not connect to server"}"
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    enabled = !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text(
                            text = if (isRegisterMode) "Create Account" else "Sign In",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }
    }
}
