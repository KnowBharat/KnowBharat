package com.knowbharat.backend.controller;

import com.knowbharat.backend.dto.GameDataSyncDto;
import com.knowbharat.backend.dto.UnlockRequestDto;
import com.knowbharat.backend.entity.*;
import com.knowbharat.backend.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:3000")
public class UserProgressController {

    private final UserProgressRepository progressRepository;
    private final UserRepository userRepository;

    // 🌟 REMOVED MapExplorationRepository from constructor!
    public UserProgressController(UserProgressRepository progressRepository,
                                  UserRepository userRepository) {
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
    }

    private UserProgress getOrCreateProgress(Long userId) {
        return progressRepository.findById(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            UserProgress newProgress = new UserProgress();
            newProgress.setUser(user);
            return progressRepository.save(newProgress);
        });
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProgress(@PathVariable Long userId) {
        return ResponseEntity.ok(getOrCreateProgress(userId));
    }

    @GetMapping("/symbols/{userId}")
    public ResponseEntity<List<String>> getUnlockedSymbols(@PathVariable Long userId) {
        UserProgress progress = getOrCreateProgress(userId);
        return ResponseEntity.ok(progress.getUnlockedSymbols());
    }

    @PostMapping("/unlock/{userId}")
    public ResponseEntity<?> updateLevelUnlock(@PathVariable Long userId, @RequestBody UnlockRequestDto request) {
        UserProgress progress = getOrCreateProgress(userId);
        switch (request.getGame().toLowerCase()) {
            case "map" -> progress.setMapUnlocked(request.getLevel().intValue());
            case "puzzle" -> progress.setPuzzleUnlocked(request.getLevel());
            case "matching" -> progress.setMatchingUnlocked(request.getLevel());
            case "spell" -> progress.setSpellUnlocked(request.getLevel());
            case "quiz" -> progress.setQuizUnlocked(request.getLevel());
        }
        progressRepository.save(progress);
        return ResponseEntity.ok(Map.of("message", "Unlock level updated"));
    }

    @PostMapping("/currency/{userId}")
    public ResponseEntity<?> updateCurrency(@PathVariable Long userId, @RequestBody Map<String, Integer> payload) {
        UserProgress progress = getOrCreateProgress(userId);
        if (payload.containsKey("coins")) progress.setCoins(payload.get("coins"));
        if (payload.containsKey("keysCount")) progress.setKeysCount(payload.get("keysCount"));
        progressRepository.save(progress);
        return ResponseEntity.ok(Map.of("message", "Currency saved successfully"));
    }

    @PostMapping("/data/{userId}")
    public ResponseEntity<?> updateGameData(@PathVariable Long userId, @RequestBody GameDataSyncDto request) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        UserProgress progress = getOrCreateProgress(userId);
        List<?> rawData = (List<?>) request.getValue();

        if ("unlocked_symbols_list".equals(request.getKey())) {
            List<String> currentSymbols = progress.getUnlockedSymbols();
            for (Object symObj : rawData) {
                String symId = symObj.toString();
                if (!currentSymbols.contains(symId)) {
                    currentSymbols.add(symId);
                }
            }
            progress.setUnlockedSymbols(currentSymbols);
            progressRepository.save(progress);

        } else if ("map_explored_nodes".equals(request.getKey())) {
            // 🌟 UPDATED: Save map nodes directly to the JSON list!
            List<String> currentNodes = progress.getExploredMapNodes();
            for (Object nodeObj : rawData) {
                String node = nodeObj.toString();
                if (!currentNodes.contains(node)) {
                    currentNodes.add(node);
                }
            }
            progress.setExploredMapNodes(currentNodes);
            progressRepository.save(progress);
        }
        return ResponseEntity.ok(Map.of("message", "Data processed"));
    }
}