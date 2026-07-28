package com.knowbharat.backend.repository;

import com.knowbharat.backend.entity.Food;
import com.knowbharat.backend.entity.GameScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface GameScoreRepository extends JpaRepository<GameScore, Long> {
    List<GameScore> findByUserIdAndGame(Long userId, String game);
    List<GameScore> findByUserIdAndTimestampAfter(Long userId, LocalDateTime timestamp);

    @Query("SELECT COALESCE(SUM(s.score), 0) FROM GameScore s WHERE s.user.id = :userId")
    Integer getTotalScoreByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM GameScore s WHERE s.timestamp < :cutoffDate")
    void deleteScoresOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Used for the Time Filters (Daily/Weekly/Monthly)
    @Query("SELECT COALESCE(SUM(s.score), 0) FROM GameScore s WHERE s.user.id = :userId AND s.timestamp >= :cutoff")
    Integer getTotalScoreSince(@Param("userId") Long userId, @Param("cutoff") LocalDateTime cutoff);

    // Used to generate the Global Leaderboard
    @Query("SELECT u.id, u.childName, CAST(SUM(s.score) AS int) " +
            "FROM GameScore s JOIN s.user u WHERE s.timestamp >= :cutoff " +
            "GROUP BY u.id, u.childName ORDER BY SUM(s.score) DESC")
    List<Object[]> getGlobalLeaderboard(@Param("cutoff") LocalDateTime cutoff);

    // Used to compare the user's performance against the Global Average
    @Query("SELECT s.game, AVG(s.score) FROM GameScore s WHERE s.timestamp >= :cutoff GROUP BY s.game")
    List<Object[]> getGlobalAverages(@Param("cutoff") LocalDateTime cutoff);

    List<GameScore> findByUserId(Long userid);
}