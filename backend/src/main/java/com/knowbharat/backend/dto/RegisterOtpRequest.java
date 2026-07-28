package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class RegisterOtpRequest {
    private String childName;
    private String schoolName;
    private String dob;
    private String phone;
    private String email;
    private String password;
    private String otp;
}