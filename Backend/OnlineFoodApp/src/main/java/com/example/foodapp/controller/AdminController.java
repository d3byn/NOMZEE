package com.example.foodapp.controller;

import com.example.foodapp.entity.Restaurant;
import com.example.foodapp.entity.RestaurantApproval;
import com.example.foodapp.entity.Role;
import com.example.foodapp.entity.User;
import com.example.foodapp.repository.RestaurantApprovalRepository;
import com.example.foodapp.repository.RestaurantRepository;
import com.example.foodapp.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminController {

    @Autowired private UserRepository userRepo;
    @Autowired private RestaurantRepository restaurantRepo;
    @Autowired private RestaurantApprovalRepository approvalRepo;

    // FIXED: Using enum comparison instead of String
    private User getAdminUser(HttpSession session) {
        User u = (User) session.getAttribute("user");
        if (u == null) return null;

        User fresh = userRepo.findByEmail(u.getEmail());
        if (fresh == null) return null;

        if (fresh.getRole() != Role.ADMIN) return null; //  FIX

        return fresh;
    }

    @GetMapping("/all-approvals")
    public ResponseEntity<?> getAllApprovals(HttpSession session) {
        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");
        return ResponseEntity.ok(approvalRepo.findAll());
    }

    @GetMapping("/pending-restaurants")
    public ResponseEntity<?> getPending(HttpSession session) {
        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");
        return ResponseEntity.ok(approvalRepo.findByStatus("PENDING"));
    }

    @GetMapping("/all-users")
    public ResponseEntity<?> getAllUsers(HttpSession session) {
        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        List<User> all = userRepo.findAll();
        all.removeIf(u -> u.getRole() == Role.ADMIN); // ✅ FIX
        return ResponseEntity.ok(all);
    }

    @GetMapping("/all-restaurants")
    public ResponseEntity<?> getAllRestaurants(HttpSession session) {
        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");
        return ResponseEntity.ok(restaurantRepo.findAll());
    }

    @PostMapping("/approve-restaurant/{restaurantId}")
    public ResponseEntity<?> approveRestaurant(
            @PathVariable Long restaurantId, HttpSession session) {

        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        Optional<Restaurant> opt = restaurantRepo.findById(restaurantId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Restaurant not found");

        Restaurant r = opt.get();
        r.setStatus("APPROVED");
        restaurantRepo.save(r);

        approvalRepo.findByRestaurantId(restaurantId).ifPresent(a -> {
            a.setStatus("APPROVED");
            a.setReviewedAt(LocalDateTime.now());
            approvalRepo.save(a);
        });

        return ResponseEntity.ok("Restaurant approved");
    }

    @PostMapping("/reject-restaurant/{restaurantId}")
    public ResponseEntity<?> rejectRestaurant(
            @PathVariable Long restaurantId,
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {

        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        Optional<Restaurant> opt = restaurantRepo.findById(restaurantId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Restaurant not found");

        Restaurant r = opt.get();
        r.setStatus("REJECTED");
        restaurantRepo.save(r);

        approvalRepo.findByRestaurantId(restaurantId).ifPresent(a -> {
            a.setStatus("REJECTED");
            a.setAdminNote(body != null ? body.getOrDefault("reason", "") : "");
            a.setReviewedAt(LocalDateTime.now());
            approvalRepo.save(a);
        });

        return ResponseEntity.ok("Restaurant rejected");
    }

    @PostMapping("/block-restaurant/{restaurantId}")
    public ResponseEntity<?> blockRestaurant(
            @PathVariable Long restaurantId, HttpSession session) {

        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        Optional<Restaurant> opt = restaurantRepo.findById(restaurantId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Not found");

        opt.get().setStatus("BLOCKED");
        restaurantRepo.save(opt.get());

        return ResponseEntity.ok("Restaurant blocked");
    }

    @PostMapping("/unblock-restaurant/{restaurantId}")
    public ResponseEntity<?> unblockRestaurant(
            @PathVariable Long restaurantId, HttpSession session) {

        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        Optional<Restaurant> opt = restaurantRepo.findById(restaurantId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Not found");

        opt.get().setStatus("APPROVED");
        restaurantRepo.save(opt.get());

        return ResponseEntity.ok("Restaurant unblocked");
    }

    @PostMapping("/block-user/{userId}")
    public ResponseEntity<?> blockUser(
            @PathVariable Long userId, HttpSession session) {

        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        Optional<User> opt = userRepo.findById(userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        if (opt.get().getRole() == Role.ADMIN) // ✅ FIX
            return ResponseEntity.status(400).body("Cannot block admin");

        opt.get().setBlocked(true);
        userRepo.save(opt.get());

        return ResponseEntity.ok("User blocked");
    }

    @PostMapping("/unblock-user/{userId}")
    public ResponseEntity<?> unblockUser(
            @PathVariable Long userId, HttpSession session) {

        if (getAdminUser(session) == null)
            return ResponseEntity.status(403).body("Unauthorized");

        Optional<User> opt = userRepo.findById(userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        opt.get().setBlocked(false);
        userRepo.save(opt.get());

        return ResponseEntity.ok("User unblocked");
    }
}