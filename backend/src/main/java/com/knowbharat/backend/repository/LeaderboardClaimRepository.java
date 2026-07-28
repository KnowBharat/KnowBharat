package com.knowbharat.backend.repository;

import com.knowbharat.backend.entity.LeaderboardClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaderboardClaimRepository extends JpaRepository<LeaderboardClaim, Long> {
    boolean existsByUserIdAndTimeRangeAndPeriodKey(Long userId, String timeRange, String periodKey);
}