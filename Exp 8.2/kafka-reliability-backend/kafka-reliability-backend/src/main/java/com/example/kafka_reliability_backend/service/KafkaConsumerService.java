package com.example.kafka_reliability_backend.service;

import com.example.kafka_reliability_backend.dto.ScheduledPostEvent;
import com.example.kafka_reliability_backend.entity.EventRecord;
import com.example.kafka_reliability_backend.repository.EventRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private final ObjectMapper objectMapper;
    private final EventRecordRepository repository;

    public KafkaConsumerService(
            ObjectMapper objectMapper,
            EventRecordRepository repository) {
        this.objectMapper = objectMapper;
        this.repository = repository;
    }

   @KafkaListener(
    topics = "scheduled-posts-dlq-82",
    groupId = "scheduled-posts-dlq-group-82"
)
    public void consume(String message) throws Exception {

        ScheduledPostEvent event =
                objectMapper.readValue(
                        message,
                        ScheduledPostEvent.class
                );

        EventRecord record = repository
                .findByEventId(event.getEventId())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Event record not found: "
                                        + event.getEventId()
                        )
                );

        // Idempotency: don't process completed events again.
        if ("PROCESSED".equals(record.getStatus())) {
            System.out.println(
                    "Duplicate event ignored: "
                            + event.getEventId()
            );
            return;
        }

        // Record every processing attempt.
        record.setAttempts(record.getAttempts() + 1);
        record.setStatus("PROCESSING");
        repository.save(record);

        System.out.println(
                "Processing event: " + event.getEventId()
                        + ", attempt: " + record.getAttempts()
        );

        // Simulate temporary failures for the demonstration.
        if (record.getAttempts()
                <= event.getFailuresBeforeSuccess()) {

            record.setStatus("RETRYING");
            record.setLastError(
                    "Simulated failure on attempt "
                            + record.getAttempts()
            );
            repository.save(record);

            throw new IllegalStateException(
                    record.getLastError()
            );
        }

        // Mark successful processing.
        record.setStatus("PROCESSED");
        record.setLastError(null);
        repository.save(record);

        System.out.println(
                "Event processed successfully: "
                        + event.getEventId()
        );
    }

    @KafkaListener(
        topics = "scheduled-posts-dlq",
        groupId = "scheduled-posts-dlq-group"
    )
    public void consumeDeadLetter(String message)
            throws Exception {

        ScheduledPostEvent event =
                objectMapper.readValue(
                        message,
                        ScheduledPostEvent.class
                );

        repository.findByEventId(event.getEventId())
                .ifPresent(record -> {
                    if (!"PROCESSED".equals(record.getStatus())) {
                        record.setStatus("DLQ");
                        record.setLastError(
                                "Processing failed after retries"
                        );
                        repository.save(record);
                    }
                });

        System.out.println(
                "Dead-letter event received: "
                        + event.getEventId()
        );
    }
}