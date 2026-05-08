// dto/AuthRequest.java
package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
    private String role;
    private String deviceInfo; // NEW — sent from frontend
}