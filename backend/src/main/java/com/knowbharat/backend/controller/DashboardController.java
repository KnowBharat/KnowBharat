package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.*;
import com.knowbharat.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth/dashboard")
public class DashboardController {

    @Autowired private UserRepository userRepo;
    @Autowired private UserProgressRepository progressRepo;
    @Autowired private GameScoreRepository scoreRepo;
    @Autowired private GameActivityRepository activityRepo;

    @GetMapping("/stats/{userId}")
    public ResponseEntity<?> getDashboardStats(@PathVariable Long userId, @RequestParam(defaultValue = "daily") String timeRange) {

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        UserProgress progress = progressRepo.findById(userId).orElse(new UserProgress());

        LocalDateTime cutoff = getCutoffTime(timeRange);

        Map<String, Object> response = new HashMap<>();

        // 1. User Profile Data
        response.put("childName", user.getChildName());
        response.put("email", user.getEmail());

        // 2. States Explored (From UserProgress map_explored_nodes)
        List<String> exploredNodes = progress.getExploredMapNodes() != null ? progress.getExploredMapNodes() : new ArrayList<>();
        response.put("mapExploredCount", exploredNodes.size());

        response.put("exploredMapNodes", exploredNodes);

        // 3. Total Score & Activity (Time Filtered)
        Integer totalScore = scoreRepo.getTotalScoreSince(userId, cutoff);
        response.put("totalScore", totalScore != null ? totalScore : 0);
        
        LocalDateTime activityCutoff = (cutoff != null) ? cutoff : LocalDateTime.now().minusYears(10);
        response.put("recentActivities", activityRepo.findByUserIdAndTimestampAfterOrderByTimestampDesc(userId, activityCutoff));

        // 4. Global Leaderboard (Time Filtered)
        List<Object[]> lbData = scoreRepo.getGlobalLeaderboard(cutoff);
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        for (Object[] row : lbData) {
            Map<String, Object> lbEntry = new HashMap<>();
            lbEntry.put("userId", row[0]);
            lbEntry.put("childName", row[1]);
            lbEntry.put("score", row[2]);
            leaderboard.add(lbEntry);
        }
        response.put("leaderboard", leaderboard);

        // 5. Global Module Averages (Time Filtered)
        List<Object[]> avgData = scoreRepo.getGlobalAverages(cutoff);
        Map<String, Double> globalAverages = new HashMap<>();
        for (Object[] row : avgData) {
            globalAverages.put((String) row[0], (Double) row[1]);
        }
        response.put("globalModuleAverages", globalAverages);

        return ResponseEntity.ok(response);
    }

    private LocalDateTime getCutoffTime(String filter) {
        LocalDateTime now = LocalDateTime.now();
        return switch (filter.toLowerCase()) {
            case "daily" -> now.withHour(0).withMinute(0).withSecond(0).withNano(0);

            case "weekly" -> now.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                    .withHour(0).withMinute(0).withSecond(0).withNano(0);

            case "monthly" -> now.withDayOfMonth(1)
                    .withHour(0).withMinute(0).withSecond(0).withNano(0);

            default -> LocalDateTime.of(2000, 1, 1, 0, 0);
        };
    }
}