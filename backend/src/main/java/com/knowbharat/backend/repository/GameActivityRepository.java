package com.knowbharat.backend.repository;

import com.knowbharat.backend.entity.GameActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface GameActivityRepository extends JpaRepository<GameActivity, Long> {
    List<GameActivity> findByUserIdAndGame(Long userId, String game);
    List<GameActivity> findByUserIdAndTimestampAfterOrderByTimestampDesc(Long userId, LocalDateTime timestamp);

    @Modifying
    @Query("DELETE FROM GameActivity a WHERE a.timestamp < :cutoffDate")
    void deleteActivitiesOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}