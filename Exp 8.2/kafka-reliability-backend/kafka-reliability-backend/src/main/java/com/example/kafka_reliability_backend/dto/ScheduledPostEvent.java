package com.example.kafka_reliability_backend.dto;

public class ScheduledPostEvent {

    private String eventId;
    private String content;
    private int failuresBeforeSuccess;

    public ScheduledPostEvent() {
    }

    public ScheduledPostEvent(
            String eventId,
            String content,
            int failuresBeforeSuccess) {
        this.eventId = eventId;
        this.content = content;
        this.failuresBeforeSuccess = failuresBeforeSuccess;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getFailuresBeforeSuccess() {
        return failuresBeforeSuccess;
    }

    public void setFailuresBeforeSuccess(
            int failuresBeforeSuccess) {
        this.failuresBeforeSuccess = failuresBeforeSuccess;
    }
}