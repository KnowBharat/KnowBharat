package com.knowbharat.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "tourist_places")
public class TouristPlace implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "state_id", nullable = false)
    private State state;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;
}
