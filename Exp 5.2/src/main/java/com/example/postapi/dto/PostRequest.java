package com.example.postapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class PostRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 5, max = 2000, message = "Content must be between 5 and 2000 characters")
    private String content;

    @NotBlank(message = "Platform is required")
    private String platform;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public String getPlatform() {
        return platform;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}