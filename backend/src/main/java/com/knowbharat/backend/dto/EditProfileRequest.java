package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class EditProfileRequest {
    private String childName;
    private String schoolName;
    private String dob;
    private String phone;
}