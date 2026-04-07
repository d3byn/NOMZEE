package com.example.foodapp.service;

import com.example.foodapp.entity.User;

public interface UserService {
    User register(User user);
    User login(String email, String password);
}
