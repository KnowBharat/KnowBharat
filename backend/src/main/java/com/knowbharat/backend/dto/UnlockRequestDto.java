package com.knowbharat.backend.dto;

import lombok.Data;

@Data
public class UnlockRequestDto {
    private String game;    // "map", "puzzle", "matching", etc.
    private Double level;   // 1.0, 1.1, 2.0, etc.
}