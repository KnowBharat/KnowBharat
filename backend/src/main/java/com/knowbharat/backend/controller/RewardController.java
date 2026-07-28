package com.knowbharat.backend.controller;

import com.knowbharat.backend.dto.DashboardStatsResponse;
import com.knowbharat.backend.entity.LeaderboardClaim;
import com.knowbharat.backend.entity.UserProgress;
import com.knowbharat.backend.repository.LeaderboardClaimRepository;
import com.knowbharat.backend.repository.UserProgressRepository;
import com.knowbharat.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/auth/rewards")
@CrossOrigin(origins = "*")
public class RewardController {

    @Autowired private LeaderboardClaimRepository claimRepo;
    @Autowired private UserService userService;
    @Autowired private UserProgressRepository progressRepo;

    // 1. Get all unclaimed rewards for the user
    @GetMapping("/pending/{userId}")
    public ResponseEntity<?> getPendingRewards(@PathVariable Long userId) {
        List<Map<String, Object>> pending = new ArrayList<>();
        String[] ranges = {"daily", "weekly", "monthly"};

        for (String range : ranges) {
            String periodKey = getPeriodKey(range);

            // If they haven't claimed this period's reward yet
            if (!claimRepo.existsByUserIdAndTimeRangeAndPeriodKey(userId, range, periodKey)) {
                DashboardStatsResponse stats = userService.getDashboardStats(userId, range);
                int rank = -1;

                for (int i = 0; i < stats.getLeaderboard().size(); i++) {
                    if (stats.getLeaderboard().get(i).isCurrentUser()) {
                        rank = i + 1; break;
                    }
                }

                if (rank >= 1 && rank <= 10) {
                    int coins = calculateCoins(range, rank);
                    pending.add(Map.of("timeRange", range, "rank", rank, "coins", coins, "periodKey", periodKey));
                }
            }
        }
        return ResponseEntity.ok(pending);
    }

    // 2. Claim a specific reward
    @PostMapping("/claim/{userId}")
    public ResponseEntity<?> claimReward(@PathVariable Long userId, @RequestBody Map<String, String> payload) {
        String range = payload.get("timeRange");
        String periodKey = getPeriodKey(range);

        if (claimRepo.existsByUserIdAndTimeRangeAndPeriodKey(userId, range, periodKey)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already claimed"));
        }

        DashboardStatsResponse stats = userService.getDashboardStats(userId, range);
        int rank = -1;
        for (int i = 0; i < stats.getLeaderboard().size(); i++) {
            if (stats.getLeaderboard().get(i).isCurrentUser()) {
                rank = i + 1; break;
            }
        }

        int coins = calculateCoins(range, rank);
        if (coins == 0) return ResponseEntity.badRequest().body(Map.of("error", "Not eligible"));

        // Save Claim
        LeaderboardClaim claim = new LeaderboardClaim();
        claim.setUserId(userId);
        claim.setTimeRange(range);
        claim.setPeriodKey(periodKey);
        claim.setRankAchieved(rank);
        claim.setCoinsClaimed(coins);
        claimRepo.save(claim);

        // Add Coins to User
        UserProgress progress = progressRepo.findById(userId).orElseThrow();
        progress.setCoins(progress.getCoins() + coins);
        progressRepo.save(progress);

        return ResponseEntity.ok(Map.of("message", "Claimed", "newCoins", progress.getCoins()));
    }

    // --- Helper Methods ---
    private int calculateCoins(String range, int rank) {
        if (rank < 1 || rank > 10) return 0;
        return switch (range.toLowerCase()) {
            case "daily" -> rank == 1 ? 30 : rank == 2 ? 20 : rank == 3 ? 10 : 5;
            case "weekly" -> rank == 1 ? 50 : rank == 2 ? 30 : rank == 3 ? 10 : 5;
            case "monthly" -> rank == 1 ? 70 : rank == 2 ? 50 : rank == 3 ? 30 : 10;
            default -> 0;
        };
    }

    private String getPeriodKey(String timeRange) {
        LocalDate today = LocalDate.now();
        return switch (timeRange.toLowerCase()) {
            case "daily" -> today.toString(); // Locks it to today's date
            case "weekly" -> today.with(java.time.DayOfWeek.MONDAY).toString(); // Locks to this week's Monday
            case "monthly" -> YearMonth.now().toString(); // Locks to this month
            default -> UUID.randomUUID().toString();
        };
    }
}