package com.knowbharat.backend.service;

import com.knowbharat.backend.entity.MonthlyWinner;
import com.knowbharat.backend.entity.UserProgress;
import com.knowbharat.backend.repository.GameScoreRepository;
import com.knowbharat.backend.repository.UserProgressRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeaderboardRewardService {

    @Autowired private GameScoreRepository scoreRepo;
    @Autowired private UserProgressRepository progressRepo;
    @Autowired private EntityManager entityManager;

    // Coins awarded based on Rank: 1st, 2nd, 3rd, and 4th-10th
    private final int[] DAILY_REWARDS = {200, 150, 100, 25};
    private final int[] WEEKLY_REWARDS = {500, 300, 200, 50};
    private final int[] MONTHLY_REWARDS = {2000, 1000, 500, 100};

    // Runs Daily at 11:59 PM
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void processDailyRewards() {
        distributeCoins(LocalDateTime.now().minusDays(1), DAILY_REWARDS);
    }

    // Runs Weekly (Sunday at 11:59 PM)
    @Scheduled(cron = "0 59 23 * * SUN")
    @Transactional
    public void processWeeklyRewards() {
        distributeCoins(LocalDateTime.now().minusWeeks(1), WEEKLY_REWARDS);
    }

    // Runs Monthly (Last day of the month at 11:59 PM)
    @Scheduled(cron = "0 59 23 L * ?")
    @Transactional
    public void processMonthlyRewards() {
        List<Object[]> topUsers = distributeCoins(LocalDateTime.now().minusMonths(1), MONTHLY_REWARDS);

        String currentMonth = LocalDate.now().getMonth().name() + " " + LocalDate.now().getYear();

        // Save Top 3 to the MonthlyWinners table
        for (int i = 0; i < Math.min(3, topUsers.size()); i++) {
            Object[] user = topUsers.get(i);
            MonthlyWinner winner = new MonthlyWinner();
            winner.setUserId((Long) user[0]);
            winner.setChildName((String) user[1]);
            winner.setTotalScore((Integer) user[2]);
            winner.setRankPosition(i + 1);
            winner.setMonthYear(currentMonth);
            entityManager.persist(winner);
        }
    }

    private List<Object[]> distributeCoins(LocalDateTime cutoff, int[] rewardTiers) {
        List<Object[]> leaderboard = scoreRepo.getGlobalLeaderboard(cutoff);

        for (int i = 0; i < Math.min(10, leaderboard.size()); i++) {
            Long userId = (Long) leaderboard.get(i)[0];
            int coinsToAward = (i == 0) ? rewardTiers[0] : (i == 1) ? rewardTiers[1] : (i == 2) ? rewardTiers[2] : rewardTiers[3];

            UserProgress progress = progressRepo.findById(userId).orElse(null);
            if (progress != null) {
                progress.setCoins(progress.getCoins() + coinsToAward);
                progressRepo.save(progress);
            }
        }
        return leaderboard;
    }
}