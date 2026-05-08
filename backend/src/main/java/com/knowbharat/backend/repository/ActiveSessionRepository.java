// repository/ActiveSessionRepository.java
package com.knowbharat.backend.repository;

import com.knowbharat.backend.entity.ActiveSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ActiveSessionRepository extends JpaRepository<ActiveSession, Long> {
    List<ActiveSession>    findByUserId(Long userId);
    Optional<ActiveSession> findByToken(String token);
    void                   deleteByToken(String token);
    long                   countByUserId(Long userId);
}