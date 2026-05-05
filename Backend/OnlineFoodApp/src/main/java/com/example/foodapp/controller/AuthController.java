package com.example.foodapp.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.foodapp.entity.User;
import com.example.foodapp.service.UserService;
import com.example.foodapp.repository.UserRepository;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService service;
    private final UserRepository repo;

    //  Constructor Injection (BEST PRACTICE)
    public AuthController(UserService service, UserRepository repo) {
        this.service = service;
        this.repo = repo;
    }

    // REGISTER
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return service.register(user);
    }

    // LOGIN
    @PostMapping("/login")
    public String login(@RequestBody User user, HttpSession session) {
        try {
            User loggedUser = service.login(user.getEmail(), user.getPassword());

            if (loggedUser != null) {
                session.setAttribute("user", loggedUser);
                return "Login successful";
            }

            return "Invalid credentials";

        } catch (RuntimeException e) {
            return e.getMessage(); // blocked case
        }
    }

    // LOGOUT
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "Logged out";
    }

    //  FIXED: GET CURRENT USER
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        User u = (User) session.getAttribute("user");

        if (u == null) {
            return ResponseEntity.status(401).body("Not logged in");
        }

        // 🔥 Fetch fresh user from DB (important for role updates)
        User fresh = repo.findByEmail(u.getEmail());

        if (fresh == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        return ResponseEntity.ok(fresh);
    }
}