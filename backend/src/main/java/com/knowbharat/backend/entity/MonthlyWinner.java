package com.knowbharat.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_winners")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyWinner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String childName;
    private int rankPosition; // 1, 2, or 3
    private int totalScore;
    private String monthYear; // e.g., "JULY 2026"
    private LocalDateTime awardedAt = LocalDateTime.now();
}