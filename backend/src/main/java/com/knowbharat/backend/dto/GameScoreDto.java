package com.knowbharat.backend.dto;

import java.time.LocalDateTime;

public record GameScoreDto(String game, int score, LocalDateTime timestamp) {}
