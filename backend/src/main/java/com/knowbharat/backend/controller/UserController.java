package com.knowbharat.backend.controller;

import com.knowbharat.backend.dto.*;
import com.knowbharat.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    // Constructor Injection (Perfect Practice)
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // --- OTP & REGISTRATION ---
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        userService.sendRegistrationOtp(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "OTP Sent"));
    }

    @PostMapping("/register-with-otp")
    public ResponseEntity<?> registerWithOtp(@RequestBody RegisterOtpRequest request) {
        userService.registerWithOtp(request);
        return ResponseEntity.ok(Map.of("message", "Registration successful"));
    }

    // --- LOGIN / LOGOUT ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String bearer) {
        userService.logout(bearer.replace("Bearer ", ""));
        return ResponseEntity.ok().build();
    }

    // --- FORGOT PASSWORD ---
    @PostMapping("/forgot-password-otp")
    public ResponseEntity<?> forgotPasswordOtp(@RequestBody OtpRequest request) {
        userService.sendForgotPasswordOtp(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "OTP Sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password Reset"));
    }

    // --- PARENT DASHBOARD & SWITCHING ---
    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> stats(@RequestHeader("Authorization") String bearer,
                                   @RequestParam(defaultValue = "all") String timeRange) {
        Long userId = userService.validateToken(bearer.replace("Bearer ", ""));
        return ResponseEntity.ok(userService.getDashboardStats(userId, timeRange));
    }

    @PutMapping("/user/edit")
    public ResponseEntity<?> editUser(@RequestHeader("Authorization") String bearer,
                                      @RequestBody EditProfileRequest request) {
        Long userId = userService.validateToken(bearer.replace("Bearer ", ""));
        userService.editProfile(userId, request);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@RequestHeader("Authorization") String bearer,
                                            @RequestBody Map<String, String> payload) {
        Long userId = userService.validateToken(bearer.replace("Bearer ", ""));
        userService.verifyPassword(userId, payload.get("password"));
        return ResponseEntity.ok(Map.of("message", "Access Granted"));
    }

    @PostMapping("/dashboard/activity")
    public ResponseEntity<Void> recordActivity(@RequestHeader("Authorization") String bearer,
                                               @RequestBody ActivityRequest req) {
        Long userId = userService.validateToken(bearer.replace("Bearer ", ""));
        userService.recordActivity(userId, req.getGame(), req.getScore(), req.getStateName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/user/change-password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String bearer,
                                            @RequestBody Map<String, String> payload) {
        Long userId = userService.validateToken(bearer.replace("Bearer ", ""));
        userService.changePassword(userId, payload.get("oldPassword"), payload.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}