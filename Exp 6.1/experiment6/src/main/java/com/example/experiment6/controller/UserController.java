package com.example.experiment6.controller;

import com.example.experiment6.dto.PageResponse;
import com.example.experiment6.dto.UserRequest;
import com.example.experiment6.model.User;
import com.example.experiment6.service.UserService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(
            @Valid @RequestBody UserRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<User>> getUsers(
            @PageableDefault(
                    page = 0,
                    size = 5,
                    sort = "uid",
                    direction = Sort.Direction.ASC
            )
            Pageable pageable) {

        return ResponseEntity.ok(
                userService.getUsers(pageable)
        );
    }

    @DeleteMapping("/{uid}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String uid) {

        userService.deleteUser(uid);

        return ResponseEntity.noContent().build();
    }
}