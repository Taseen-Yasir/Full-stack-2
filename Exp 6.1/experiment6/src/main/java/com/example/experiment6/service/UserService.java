package com.example.experiment6.service;

import com.example.experiment6.dto.PageResponse;
import com.example.experiment6.dto.UserRequest;
import com.example.experiment6.model.User;
import com.example.experiment6.repository.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ==========================
    // Create User
    // ==========================
    public User createUser(UserRequest request) {

        User user = new User(
                request.getUid(),
                request.getName()
        );

        return userRepository.save(user);
    }

    // ==========================
    // Get Users
    // Pagination + Sorting
    // ==========================
    public PageResponse<User> getUsers(Pageable pageable) {

        Page<User> page =
                userRepository.findAll(pageable);

        List<User> users =
                page.getContent();

        return new PageResponse<>(
                users,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    // ==========================
    // Delete User
    // ==========================
    public void deleteUser(String uid) {

        userRepository.deleteById(uid);
    }
}