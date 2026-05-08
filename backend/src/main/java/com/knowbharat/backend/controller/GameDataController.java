package com.knowbharat.backend.controller;

import com.knowbharat.backend.entity.*;
import com.knowbharat.backend.repository.*;
import com.knowbharat.backend.service.DataCleanupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/game-data")
public class GameDataController {

    @Autowired private GameActivityRepository activityRepo;
    @Autowired private GameScoreRepository scoreRepo;
    @Autowired private UserRepository userRepository;
    @Autowired private DataCleanupService cleanupService;

    // ─── 1. INDIVIDUAL GAME RECORDING ───

    @PostMapping("/activity/{userId}")
    public ResponseEntity<?> recordActivity(@PathVariable Long userId, @RequestBody GameActivity activity) {
        User user = userRepository.findById(userId).orElseThrow();
        activity.setUser(user);
        activity.setTimestamp(LocalDateTime.now());
        activityRepo.save(activity);
        return ResponseEntity.ok(Map.of("message", "Activity recorded"));
    }

    @PostMapping("/score/{userId}")
    public ResponseEntity<?> recordScore(@PathVariable Long userId, @RequestBody GameScore score) {
        User user = userRepository.findById(userId).orElseThrow();
        score.setUser(user);
        score.setTimestamp(LocalDateTime.now());
        scoreRepo.save(score);
        return ResponseEntity.ok(Map.of("message", "Score recorded"));
    }

    // ─── 2. OVERALL FETCHING (WITH TIME FILTERS) ───

    @GetMapping("/score/overall/{userId}")
    public ResponseEntity<?> getScores(@PathVariable Long userId, @RequestParam(defaultValue = "all") String filter) {
        LocalDateTime cutoff = getCutoffTime(filter);
        if (cutoff == null) {
            // All-time total logic
            return ResponseEntity.ok(Map.of("totalScore", scoreRepo.getTotalScoreByUserId(userId)));
        } else {
            // Daily, Weekly, Monthly logic
            List<GameScore> recentScores = scoreRepo.findByUserIdAndTimestampAfter(userId, cutoff);
            int total = recentScores.stream().mapToInt(GameScore::getScore).sum();
            return ResponseEntity.ok(Map.of("totalScore", total, "scores", recentScores));
        }
    }

    @GetMapping("/activity/overall/{userId}")
    public ResponseEntity<?> getActivities(@PathVariable Long userId, @RequestParam(defaultValue = "all") String filter) {
        LocalDateTime cutoff = getCutoffTime(filter);
        // Default to fetching all if 'all' is passed.
        // For production, you may want to limit this so it doesn't fetch millions of rows!
        LocalDateTime timeLimit = (cutoff != null) ? cutoff : LocalDateTime.now().minusYears(10);
        List<GameActivity> activities = activityRepo.findByUserIdAndTimestampAfterOrderByTimestampDesc(userId, timeLimit);
        return ResponseEntity.ok(activities);
    }

    // ─── 3. MANUAL CLEANUP CONTROLLER ───

    @DeleteMapping("/admin/cleanup")
    public ResponseEntity<?> triggerManualCleanup() {
        String result = cleanupService.performCleanup();
        return ResponseEntity.ok(Map.of("message", result));
    }

    // ─── UTILITY METHOD ───
    private LocalDateTime getCutoffTime(String filter) {
        return switch (filter.toLowerCase()) {
            case "daily" -> LocalDateTime.now().minusDays(1);
            case "weekly" -> LocalDateTime.now().minusWeeks(1);
            case "monthly" -> LocalDateTime.now().minusMonths(1);
            default -> null; // 'all' time
        };
    }
}