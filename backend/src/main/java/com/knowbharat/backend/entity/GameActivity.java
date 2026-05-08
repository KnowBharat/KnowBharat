package com.knowbharat.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_activity")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    private String game; // e.g., "puzzle", "map", "matching"
    private String status; // e.g., "played", "unlocked", "visit"
    private LocalDateTime timestamp = LocalDateTime.now();
}