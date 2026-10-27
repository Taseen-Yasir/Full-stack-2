package com.example.jwt_rbac.controller;

import com.example.jwt_rbac.dto.LoginRequest;
import com.example.jwt_rbac.dto.TokenResponse;
import com.example.jwt_rbac.dto.RefreshRequest;
import com.example.jwt_rbac.security.JwtService;
import com.example.jwt_rbac.service.RefreshTokenService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final long ACCESS_TOKEN_EXPIRES_IN = 900;

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(
            JwtService jwtService,
            RefreshTokenService refreshTokenService) {

        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        String role = getRole(
                request.getUsername(),
                request.getPassword()
        );

        if (role == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        String accessToken =
                jwtService.generateToken(
                        request.getUsername(),
                        role
                );

        String refreshToken =
                refreshTokenService.generateRefreshToken(
                        request.getUsername()
                );

        return ResponseEntity.ok(
                new TokenResponse(
                        accessToken,
                        refreshToken,
                        ACCESS_TOKEN_EXPIRES_IN
                )
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @RequestBody RefreshRequest request) {

        try {

            if (request.getRefreshToken() == null ||
                    request.getRefreshToken().isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .body("Refresh token is required");
            }

            String username =
                    getUsernameFromRefreshToken(
                            request.getRefreshToken()
                    );

            String role = getRoleForUser(username);

            RefreshTokenService.TokenPair pair =
                    refreshTokenService.refresh(
                            request.getRefreshToken(),
                            role
                    );

            return ResponseEntity.ok(
                    new TokenResponse(
                            pair.accessToken(),
                            pair.refreshToken(),
                            ACCESS_TOKEN_EXPIRES_IN
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestBody RefreshRequest request) {

        if (request.getRefreshToken() != null &&
                !request.getRefreshToken().isBlank()) {

            refreshTokenService.revoke(
                    request.getRefreshToken()
            );
        }

        return ResponseEntity.ok(
                "Refresh token revoked successfully"
        );
    }

    private String getRole(
            String username,
            String password) {

        if ("admin".equals(username) &&
                "admin123".equals(password)) {

            return "ADMIN";
        }

        if ("user".equals(username) &&
                "user123".equals(password)) {

            return "USER";
        }

        return null;
    }

    private String getRoleForUser(String username) {

        if ("admin".equals(username)) {
            return "ADMIN";
        }

        if ("user".equals(username)) {
            return "USER";
        }

        throw new RuntimeException(
                "Unknown user"
        );
    }

    /*
     * For this lab demo, the refresh-token service
     * stores the username with the hashed token.
     *
     * We retrieve the username through the service.
     */
    private String getUsernameFromRefreshToken(
            String refreshToken) {

        return refreshTokenService
                .getUsernameFromRefreshToken(refreshToken);
    }
}