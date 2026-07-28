package com.knowbharat.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Integer totalScore;
    private Integer mapExploredCount;
    private List<ActivityDto> recentActivities;
    private List<String> recentlyExploredStates;
    private String childName;
    private String email;
    private List<LeaderboardEntry> leaderboard; // The list lives HERE, not inside the entry

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private String name;
        private int score;
        private boolean isCurrentUser;
    }
}