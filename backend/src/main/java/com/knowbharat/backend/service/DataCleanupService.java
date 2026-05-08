package com.knowbharat.backend.service;

import com.knowbharat.backend.repository.GameActivityRepository;
import com.knowbharat.backend.repository.GameScoreRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class DataCleanupService {

    @Autowired
    private GameActivityRepository activityRepository;

    @Autowired
    private GameScoreRepository scoreRepository;

    // Automatically runs daily at midnight to keep database clean
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void deleteOldRecordsAutomated() {
        performCleanup();
    }

    // Callable from the Controller
    @Transactional
    public String performCleanup() {
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        activityRepository.deleteActivitiesOlderThan(oneMonthAgo);
        scoreRepository.deleteScoresOlderThan(oneMonthAgo);
        return "Cleanup successful: Records older than 1 month deleted.";
    }
}