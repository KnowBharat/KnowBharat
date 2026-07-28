package com.knowbharat.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "leaderboard_claims")
public class LeaderboardClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String timeRange; // "daily", "weekly", "monthly"
    private String periodKey; // e.g., "2026-07-08", "2026-W27"
    private int rankAchieved;
    private int coinsClaimed;
}