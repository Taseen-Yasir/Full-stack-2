package com.example.kafka_reliability_backend.controller;

import com.example.kafka_reliability_backend.dto.ScheduledPostEvent;
import com.example.kafka_reliability_backend.entity.EventRecord;
import com.example.kafka_reliability_backend.repository.EventRecordRepository;
import com.example.kafka_reliability_backend.service.KafkaProducerService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:3002")
public class EventController {

    private final EventRecordRepository repository;
    private final KafkaProducerService producerService;

    public EventController(
            EventRecordRepository repository,
            KafkaProducerService producerService) {
        this.repository = repository;
        this.producerService = producerService;
    }

    // Submit an event to Kafka
    @PostMapping
    public ResponseEntity<?> submitEvent(
            @RequestBody ScheduledPostEvent event) {

        if (event.getContent() == null
                || event.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Post content is required")
            );
        }

        if (event.getFailuresBeforeSuccess() < 0
                || event.getFailuresBeforeSuccess() > 10) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error",
                            "Failures must be between 0 and 10"
                    )
            );
        }

        // Generate an event ID if the client did not supply one.
        if (event.getEventId() == null
                || event.getEventId().isBlank()) {
            event.setEventId(UUID.randomUUID().toString());
        }

        event.setEventId(event.getEventId().trim());

        // Reject duplicate event IDs.
        if (repository.existsByEventId(event.getEventId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error", "Duplicate event detected",
                            "eventId", event.getEventId(),
                            "message",
                            "This event ID has already been submitted"
                    ));
        }

        // Save the event before publishing it to Kafka.
        EventRecord record = new EventRecord();
        record.setEventId(event.getEventId());
        record.setContent(event.getContent());
        record.setStatus("QUEUED");
        record.setAttempts(0);
        record.setFailuresBeforeSuccess(
                event.getFailuresBeforeSuccess()
        );

        repository.save(record);

        // Publish the event to the scheduled-posts topic.
        producerService.sendEvent(event);

        return ResponseEntity.accepted().body(
                Map.of(
                        "eventId", event.getEventId(),
                        "status", "QUEUED",
                        "message", "Event submitted to Kafka"
                )
        );
    }

    // Get all event records
    @GetMapping
    public List<EventRecord> getAllEvents() {
        return repository.findAll();
    }

    // Get one event by ID
    @GetMapping("/{eventId}")
    public ResponseEntity<EventRecord> getEvent(
            @PathVariable String eventId) {

        return repository.findByEventId(eventId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}