package com.knowbharat.backend.service;


import com.knowbharat.backend.dto.*;
import com.knowbharat.backend.entity.*;
import com.knowbharat.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;


@Service
public class UserService {


    @Autowired private UserRepository userRepository;
    @Autowired private ActiveSessionRepository activeSessionRepository;
    @Autowired private JavaMailSender mailSender;

    @Autowired private GameScoreRepository scoreRepository;
    @Autowired private GameActivityRepository activityRepository;
    @Autowired private UserProgressRepository progressRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();


    @Async
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }


    // --- OTP & REGISTRATION ---
    public void sendRegistrationOtp(String email) {
        String cleanEmail = email.toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new RuntimeException("Email already registered!");
        }
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(cleanEmail, otp);


        String subject = "Welcome to KnowBharat - Verification Code";
        String body = "Hello,\n\nYour OTP for KnowBharat registration is: " + otp + "\n\nThis code will expire in 5 minutes.";
        sendEmail(cleanEmail, subject, body);
    }


    @Transactional
    public void registerWithOtp(RegisterOtpRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        String savedOtp = otpStorage.get(cleanEmail);

        if (savedOtp == null || !savedOtp.equals(request.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP!");
        }

        User user = new User();
        user.setChildName(request.getChildName());
        user.setSchoolName(request.getSchoolName());
        user.setDob(request.getDob());
        user.setPhone(request.getPhone());
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("student");

        User savedUser = userRepository.save(user);

        // Generate 3 Unique Random Symbols (Assuming IDs are 1 to 20)
        List<String> randomSymbols = new ArrayList<>();
        Random rand = new Random();
        while(randomSymbols.size() < 3) {
            String randId = String.valueOf(rand.nextInt(20) + 1);
            if(!randomSymbols.contains(randId)) randomSymbols.add(randId);
        }

        // Instantly Create Progress with 100 Coins, 5 Keys, and 3 Random Symbols
        UserProgress progress = new UserProgress();
        progress.setUser(savedUser);
        progress.setCoins(100);
        progress.setKeysCount(5);
        progress.setUnlockedSymbols(randomSymbols);
        progressRepository.save(progress);

        otpStorage.remove(cleanEmail);
    }


    // --- LOGIN & LOGOUT ---
    @Transactional
    public AuthResponse login(AuthRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();


        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));


        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Incorrect password. Please try again.");
        }


        String token = "token-" + user.getId() + "-" + UUID.randomUUID().toString().replace("-", "");
        String deviceInfo = request.getDeviceInfo() != null ? request.getDeviceInfo() : "Unknown device";


        ActiveSession session = new ActiveSession();
        session.setUserId(user.getId());
        session.setToken(token);
        session.setDeviceInfo(deviceInfo);
        session.setCreatedAt(LocalDateTime.now());
        session.setLastSeen(LocalDateTime.now());
        activeSessionRepository.save(session);


        return new AuthResponse(token, user.getId(), user.getRole());
    }


    @Transactional
    public void logout(String token) {
        activeSessionRepository.deleteByToken(token);
    }


    public Long validateToken(String token) {
        ActiveSession session = activeSessionRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired session."));
        session.setLastSeen(LocalDateTime.now());
        activeSessionRepository.save(session);
        return session.getUserId();
    }


    // --- FORGOT PASSWORD ---
    public void sendForgotPasswordOtp(String email) {
        String cleanEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("Email not registered! Please check the spelling."));


        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(user.getEmail(), otp);


        String subject = "KnowBharat - Password Reset";
        String body = "Hello " + user.getChildName() + ",\n\nYou requested a password reset. Your OTP is: " + otp + "\n\nThis code will expire in 5 minutes.";
        sendEmail(user.getEmail(), subject, body);
    }


    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        String savedOtp = otpStorage.get(cleanEmail);


        if (savedOtp == null || !savedOtp.equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP!");
        }


        User user = userRepository.findByEmail(cleanEmail).orElseThrow();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);


        otpStorage.remove(cleanEmail);
    }


    // --- PARENT DASHBOARD & UTILS ---
    public void verifyPassword(Long userId, String rawPassword) {
        User user = userRepository.findById(userId).orElseThrow();
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect password");
        }
    }


    public void editProfile(Long userId, EditProfileRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setChildName(request.getChildName());
        user.setSchoolName(request.getSchoolName());
        user.setDob(request.getDob());
        user.setPhone(request.getPhone());
        userRepository.save(user);
    }


    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow();
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }


    // Now saves cleanly to the new GameActivity table!
    @Transactional
    public void recordActivity(Long userId, String game, Integer score, String stateName) {
        User user = userRepository.findById(userId).orElseThrow();


        GameActivity activity = new GameActivity();
        activity.setUser(user);
        activity.setGame(game);
        activity.setStatus(stateName != null ? stateName : "Played");
        activity.setTimestamp(LocalDateTime.now());


        activityRepository.save(activity);
    }


    public DashboardStatsResponse getDashboardStats(Long userId, String timeRange) {
        User user = userRepository.findById(userId).orElseThrow();

        // 1. Setup Time Filter
        LocalDateTime cutoffDate = switch (timeRange.toLowerCase()) {
            case "daily" -> LocalDateTime.now().minusDays(1);
            case "weekly" -> LocalDateTime.now().minusWeeks(1);
            case "monthly" -> LocalDateTime.now().minusMonths(1);
            default -> null;
        };

        // 2. Fetch User's Personal Stats
        Integer totalScore = scoreRepository.getTotalScoreByUserId(userId);
        if (totalScore == null) totalScore = 0;

        List<GameActivity> recentActivities = (cutoffDate != null)
                ? activityRepository.findByUserIdAndTimestampAfterOrderByTimestampDesc(userId, cutoffDate)
                : activityRepository.findByUserIdAndGame(userId, "all");

        // Get states directly from UserProgress JSON array
        UserProgress progress = progressRepository.findById(userId).orElse(new UserProgress());
        Set<String> uniqueStates = progress.getExploredMapNodes().stream()
                .map(node -> node.split(" lvl ")[0]) // Extracts "West Bengal" from "West Bengal lvl 1"
                .collect(Collectors.toSet());

        // 3. Build Global Leaderboard
        List<User> allUsers = userRepository.findAll();
        List<DashboardStatsResponse.LeaderboardEntry> leaderboard = new ArrayList<>();

        for (User u : allUsers) {
            int userScore = 0;
            if (cutoffDate != null) {
                List<GameScore> recentScores = scoreRepository.findByUserIdAndTimestampAfter(u.getId(), cutoffDate);
                userScore = recentScores.stream().mapToInt(GameScore::getScore).sum();
            } else {
                Integer total = scoreRepository.getTotalScoreByUserId(u.getId());
                userScore = (total != null) ? total : 0;
            }

            if (userScore > 0) {
                String displayName = (u.getChildName() != null && !u.getChildName().isEmpty()) ? u.getChildName() : "Student";
                leaderboard.add(new DashboardStatsResponse.LeaderboardEntry(displayName, userScore, u.getId().equals(userId)));
            }
        }

        leaderboard.sort((a, b) -> b.getScore() - a.getScore());
        if (leaderboard.size() > 10) leaderboard = leaderboard.subList(0, 10);

        // Map activities to DTOs for frontend
        List<ActivityDto> activityDtos = recentActivities.stream().limit(10).map(a ->
                new ActivityDto(a.getGame(), 0, a.getTimestamp(), a.getStatus())
        ).toList();

        return new DashboardStatsResponse(
                totalScore,                             // 1
                uniqueStates.size(),                   // 2
                activityDtos,                          // 3
                new ArrayList<>(uniqueStates).stream().limit(5).toList(), // 4
                user.getChildName(),                   // 5
                user.getEmail(),                       // 6
                leaderboard                            // 7
        );
    }
}