package com.knowbharat.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Generates getters, setters, toString, equals, and hashcode
@NoArgsConstructor // Generates a no-args constructor
@AllArgsConstructor // Generates a constructor with all fields
@Entity
@Table(name = "national_symbols")
public class NationalSymbol {

    @Id
    private String id;

    private String emoji;
    private String category;
    private String title;
    private String name;
    private String since;
    private String color;
    private String bg;
    private String accent;

    @Column(columnDefinition = "TEXT")
    private String fact;

    private String tags;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "specialbg") // <-- Make sure this is fully lowercase to match SQL!
    private boolean specialBg;
}
