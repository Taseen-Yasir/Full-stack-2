package com.example.postapi.service;

import com.example.postapi.dto.UserRequest;
import com.example.postapi.exception.UserNotFoundException;
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

    // CREATE
    public User createUser(UserRequest request) {

        User user = new User(
                request.getUid(),
                request.getName()
        );

        return userRepository.save(user);
    }

    // READ - Get all users
    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

    // READ - Get user by UID
    public User getUserByUid(String uid) {

        return userRepository.findById(uid)
                .orElseThrow(() ->
                        new UserNotFoundException(
                                "User not found with UID: " + uid
                        )
                );
    }

    // UPDATE
    public User updateUser(
            String uid,
            UserRequest request) {

        User user = getUserByUid(uid);

        user.setName(request.getName());

        return userRepository.save(user);
    }

    // DELETE
    public void deleteUser(String uid) {

        User user = getUserByUid(uid);

        userRepository.delete(user);
    }
}