package com.example.foodapp.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.foodapp.entity.User;
import com.example.foodapp.service.UserService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService service;
    
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return service.register(user);
    }
    @PostMapping("/login")
    public String login(@RequestBody User user, HttpSession session) {

        User loggedUser = service.login(user.getEmail(), user.getPassword());

        if (loggedUser != null) {
            session.setAttribute("user", loggedUser); // 🔥 store session
            return "Login successful";
        }
        return "Invalid credentials";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "Logged out";
    }
}