package com.example.postapi.controller;

import com.example.postapi.dto.ApiResponse;
import com.example.postapi.dto.UserRequest;
import com.example.postapi.model.User;
import com.example.postapi.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(
            @Valid @RequestBody UserRequest request) {

        User user = userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "User created successfully",
                        user
                ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Users retrieved successfully",
                        userService.getAllUsers()
                )
        );
    }

    @GetMapping("/{uid}")
    public ResponseEntity<ApiResponse<User>> getUser(
            @PathVariable String uid) {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "User retrieved successfully",
                        userService.getUserByUid(uid)
                )
        );
    }

    @PutMapping("/{uid}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable String uid,
            @Valid @RequestBody UserRequest request) {

        User user = userService.updateUser(uid, request);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "User updated successfully",
                        user
                )
        );
    }

    @DeleteMapping("/{uid}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String uid) {

        userService.deleteUser(uid);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "User deleted successfully",
                        null
                )
        );
    }
}