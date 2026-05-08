package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class EditProfileRequest {
    private String firstName;
    private String lastName;
    private String childName;
}