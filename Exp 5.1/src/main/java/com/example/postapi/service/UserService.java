package com.example.postapi.service;

import com.example.postapi.dto.UserRequest;
import com.example.postapi.model.User;
import com.example.postapi.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(UserRequest request) {

        User user = new User(
                request.getUid(),
                request.getName()
        );

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserByUid(String uid) {

        return userRepository.findById(uid)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );
    }

    public User updateUser(String uid, UserRequest request) {

        User user = getUserByUid(uid);

        user.setName(request.getName());

        return userRepository.save(user);
    }

    public void deleteUser(String uid) {

        User user = getUserByUid(uid);

        userRepository.delete(user);
    }
}