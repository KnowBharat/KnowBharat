package com.knowbharat.backend.repository;

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

    @Query("SELECT SUM(s.score) FROM GameScore s WHERE s.user.id = :userId")
    Integer getTotalScoreByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM GameScore s WHERE s.timestamp < :cutoffDate")
    void deleteScoresOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}