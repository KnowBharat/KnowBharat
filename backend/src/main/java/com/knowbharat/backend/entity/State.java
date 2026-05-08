package com.knowbharat.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "states")
public class State implements Serializable{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String capital;
    private String population;
    private String language;
    private String area;
    private String established;

    @Column(length = 2000)
    private String about;

    @Column(name = "about_capital", length = 2000)
    private String aboutCapital;
}
