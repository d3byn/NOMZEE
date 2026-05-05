package com.example.foodapp.service.serviceimpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.example.foodapp.entity.User;
import com.example.foodapp.repository.UserRepository;
import com.example.foodapp.service.UserService;

@Service
public class UserServiceImpl implements UserService {

	private final UserRepository repo;
	private final BCryptPasswordEncoder encoder;

	//  Constructor Injection
	public UserServiceImpl(UserRepository repo, BCryptPasswordEncoder encoder) {
		this.repo = repo;
		this.encoder = encoder;
	}

	// REGISTER
	@Override
	public User register(User user) {
		user.setPassword(encoder.encode(user.getPassword())); // encrypt password
		return repo.save(user);
	}

	//  LOGIN (NO session logic here)
	@Override
	public User login(String email, String password) {

		User user = repo.findByEmail(email);

		if (user != null && encoder.matches(password, user.getPassword())) {

			if (user.isBlocked()) {
				throw new RuntimeException("Account is blocked. Contact admin.");
			}

			return user; //  fresh DB user
		}

		return null;
	}
}