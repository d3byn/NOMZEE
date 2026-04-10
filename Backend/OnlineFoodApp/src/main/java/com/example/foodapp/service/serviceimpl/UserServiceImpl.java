package com.example.foodapp.service.serviceimpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.example.foodapp.entity.User;
import com.example.foodapp.repository.UserRepository;
import com.example.foodapp.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository repo;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public User register(User user) {
        user.setPassword(encoder.encode(user.getPassword())); // encrypt
        return repo.save(user);
    }

    @Override
    public User login(String email, String password) {

        User user = repo.findByEmail(email);

        if (user != null && encoder.matches(password, user.getPassword())) {
            return user;
        }

        return null;
    }
}