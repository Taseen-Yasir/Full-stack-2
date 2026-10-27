package com.example.jwt_rbac.config;

import com.example.jwt_rbac.security.AesUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AesConfig {

    @Bean
    public AesUtil aesUtil() {

        String key = System.getenv("AES_SECRET_KEY");

        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "AES_SECRET_KEY environment variable is not set"
            );
        }

        return new AesUtil(key);
    }
}