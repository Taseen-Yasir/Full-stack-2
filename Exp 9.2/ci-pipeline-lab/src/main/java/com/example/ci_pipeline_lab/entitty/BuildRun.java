package com.example.ci_pipeline_lab.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "build_runs")
public class BuildRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String commitMessage;

    @Column(nullable = false)
    private String status = "QUEUED";

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public BuildRun() {
    }

    public BuildRun(String commitMessage) {
        this.commitMessage = commitMessage;
        this.status = "QUEUED";
    }

    @PrePersist
    public void beforeSaving() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getCommitMessage() {
        return commitMessage;
    }

    public void setCommitMessage(String commitMessage) {
        this.commitMessage = commitMessage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}