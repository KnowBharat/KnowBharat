package com.knowbharat.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDto {
    private String game;
    private Integer score; // Can be null if it's just an unlock action
    private LocalDateTime timestamp;
    private String status; // "Played", "Unlocked", etc.
}