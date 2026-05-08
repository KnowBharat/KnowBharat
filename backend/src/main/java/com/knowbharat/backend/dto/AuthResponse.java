// dto/AuthResponse.java
package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class AuthResponse {
    private String  token;
    private Long    userId;
    private String  role;
    private String  message; // used for error responses

    public AuthResponse(String token, Long userId, String role) {
        this.token = token; this.userId = userId; this.role = role;
    }
    public AuthResponse(String message) { this.message = message; }
}