package com.knowbharat.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity (name = "traditional_wears")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TraditionalWear implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "state_id", nullable = false)
    private State state;

    private String menWear;
    private String womenWear;
    private String imageUrl;
}
