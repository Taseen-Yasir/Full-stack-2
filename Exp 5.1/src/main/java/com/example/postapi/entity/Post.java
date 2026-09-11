package com.example.postapi.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String content;

    private String platform;

    private LocalDateTime scheduledAt;

    public Post() {
    }

    public Post(String title, String content, String platform, LocalDateTime scheduledAt) {
        this.title = title;
        this.content = content;
        this.platform = platform;
        this.scheduledAt = scheduledAt;
    }

    public Long getId() {
        return id;
    }

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

    public void setId(Long id) {
        this.id = id;
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