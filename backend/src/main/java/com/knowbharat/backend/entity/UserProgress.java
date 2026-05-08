package com.knowbharat.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.knowbharat.backend.util.StringListConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProgress {

    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    private int coins;
    private int keysCount;

    private int mapUnlocked;

    private Double puzzleUnlocked;
    private Double matchingUnlocked;
    private Double spellUnlocked;
    private Double quizUnlocked;

    // JSON Column for Symbols
    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> unlockedSymbols = new ArrayList<>();

    // 🌟 NEW JSON Column for Map Explored Nodes!
    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> exploredMapNodes = new ArrayList<>();
}