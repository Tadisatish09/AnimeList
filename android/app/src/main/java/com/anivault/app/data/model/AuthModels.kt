package com.anivault.app.data.model

import com.google.gson.annotations.SerializedName

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val role: String? = "user",
    @SerializedName("is_active")
    val isActive: Boolean? = true,
    @SerializedName("login_count")
    val loginCount: Int? = 0,
    @SerializedName("last_login")
    val lastLogin: String? = null
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class AuthResponse(
    val success: Boolean,
    val message: String?,
    val token: String?,
    val user: User?
)
