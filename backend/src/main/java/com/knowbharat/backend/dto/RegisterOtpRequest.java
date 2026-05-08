package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class RegisterOtpRequest {
    private String firstName;
    private String lastName;
    private String childName;
    private String email;
    private String password;
    private String otp;
}