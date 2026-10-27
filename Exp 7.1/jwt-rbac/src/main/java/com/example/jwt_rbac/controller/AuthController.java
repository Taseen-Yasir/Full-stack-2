package com.example.jwt_rbac.controller;

import com.example.jwt_rbac.dto.LoginRequest;
import com.example.jwt_rbac.dto.LoginResponse;
import com.example.jwt_rbac.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtService jwtService;

    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        String role = null;

        if (request.getUsername().equals("admin")
                && request.getPassword().equals("admin123")) {
            role = "ADMIN";

        } else if (request.getUsername().equals("user")
                && request.getPassword().equals("user123")) {
            role = "USER";
        }

        if (role == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        String token =
                jwtService.generateToken(request.getUsername(), role);

        return ResponseEntity.ok(new LoginResponse(token));
    }
}