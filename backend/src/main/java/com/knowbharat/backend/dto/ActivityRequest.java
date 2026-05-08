// dto/ActivityRequest.java
package com.knowbharat.backend.dto;
import lombok.Data;

@Data
public class ActivityRequest {
    private String  game;
    private Integer score;      // null = just browsed
    private String  stateName;
}