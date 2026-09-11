package com.example.postapi.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class LoggingFilter extends OncePerRequestFilter {

    private static final Logger logger =
            LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // Generate a unique correlation ID
        String correlationId = UUID.randomUUID().toString();

        // Record start time
        long startTime = System.currentTimeMillis();

        // Put correlation ID into MDC
        MDC.put("correlationId", correlationId);

        // Log request start
        logger.info(
                "Request started | method={} | uri={}",
                request.getMethod(),
                request.getRequestURI()
        );

        try {

            // Continue request processing
            filterChain.doFilter(request, response);

        } finally {

            // Calculate execution time
            long executionTime =
                    System.currentTimeMillis() - startTime;

            // Add correlation ID to response header
            response.setHeader(
                    "X-Correlation-ID",
                    correlationId
            );

            // Log request completion
            logger.info(
                    "Request completed | status={} | executionTime={}ms",
                    response.getStatus(),
                    executionTime
            );

            // Clear MDC
            MDC.remove("correlationId");
        }
    }
}